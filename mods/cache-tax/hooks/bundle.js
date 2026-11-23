// Built by `bin/modz build` from the files beside it. Never edited by hand.
const MIN_MS = 60 * 1000;
const HOUR_MS = 60 * MIN_MS;
const TTL_MS = HOUR_MS;
const PING_AFTER_MS = 50 * MIN_MS;
const MIN_PING_MS = MIN_MS;
const AUTO_WARM_MS = 3 * HOUR_MS;
const DEFAULT_WINDOW_MS = 6 * HOUR_MS;
const MAX_ALWAYS_MS = 168 * HOUR_MS;
const SOON_MS = 10 * MIN_MS;
const BIG_TOKENS = 50000;
const PING_PROMPT = "Reply with the single word: warm. No reasoning, no tools, nothing else.";
const MAX_PINGS = 12;
const MAX_PING_OUTPUT = 1000;
const OPUS_4_5 = [0.5, 10, 25];
const OPUS_4 = [1.5, 30, 75];
const SONNET_4 = [0.3, 6, 15];
const PRICES = {
  "fable-5-2": [0.2, 16, 40],
  "mythos-5-2": [0.2, 16, 40],
  "fable-5-1": [0.25, 20, 50],
  "mythos-5-1": [0.25, 20, 50],
  "fable-5": [1, 20, 50],
  "mythos-5": [1, 20, 50],
  "opus-5-5": [0.2, 8, 20],
  "opus-5": [0.5, 10, 25],
  "sonnet-5-5": [0.1, 4, 10],
  "sonnet-5": [0.2, 4, 10],
  "haiku-5-5": [0.01, 0.2, 0.5],
  "opus-4-8": OPUS_4_5,
  "opus-4-7": OPUS_4_5,
  "opus-4-6": OPUS_4_5,
  "opus-4-5": OPUS_4_5,
  "opus-4-1": OPUS_4,
  "opus-4-0": OPUS_4,
  "opus-4": OPUS_4,
  "sonnet-4-6": SONNET_4,
  "sonnet-4-5": SONNET_4,
  "sonnet-4-0": SONNET_4,
  "sonnet-4": SONNET_4,
  "haiku-4-5": [0.1, 2, 5],
  "haiku-3-5": [0.08, 1.6, 4]
};
const FAMILY_VERSION = /(fable|mythos|opus|sonnet|haiku)-(\d{1,2}(?:-\d{1,2})?)(?!\d)/;
const LONG_PROMPT_TOKENS = 1e5;
const LONG_PRICES = [
  ["haiku-5-5", 0.05, 1, 2.5]
];
function freshState() {
  return {
    hasBand: false,
    hasStatus: false,
    sid: "",
    deadline: 0,
    every: PING_AFTER_MS,
    always: false,
    alwaysMs: DEFAULT_WINDOW_MS,
    lastRequestAt: 0,
    lastResponseAt: 0,
    lastModel: null,
    cacheModel: null,
    ctx: 0,
    compacted: false,
    guard: "warn",
    guardFloor: 0,
    ackedAt: 0,
    coldWritePending: false,
    largestWrite: null,
    misses: [],
    pending: null,
    refresh: null,
    last: null,
    stopped: null,
    held: null,
    resend: null,
    waitForTurn: false,
    retries: 0,
    pings: 0,
    isWarmAfterPay: false,
    rate: null
  };
}
function priceOf(model, promptTokens) {
  const m = (model ?? "").toLowerCase().replace(/[\s.]+/g, "-");
  const found = FAMILY_VERSION.exec(m);
  const key = found ? `${found[1]}-${found[2]}` : m.includes("3-5-haiku") ? "haiku-3-5" : "";
  const long = promptTokens > LONG_PROMPT_TOKENS ? LONG_PRICES.find(([family]) => family === key) : undefined;
  return long ? [long[1], long[2], long[3]] : PRICES[key] ?? null;
}
function coldUsd(s, model = s.lastModel) {
  const price = priceOf(model, s.ctx);
  return price ? s.ctx * price[1] / 1e6 : null;
}
function warmUsd(s, model = s.lastModel) {
  const price = priceOf(model, s.ctx);
  return price ? s.ctx * price[0] / 1e6 : null;
}
function pingUsd(u, price) {
  return (u.cache_read_input_tokens * price[0] + u.cache_creation_input_tokens * price[1] + u.input_tokens * price[1] / 2 + u.output_tokens * price[2]) / 1e6;
}
function breakEvenPings(s) {
  const price = priceOf(s.lastModel, s.ctx);
  if (!price || s.ctx <= 0)
    return null;
  return Math.floor(price[1] / price[0]);
}
function isCold(s, now) {
  return s.lastRequestAt > 0 && !s.compacted && now - s.lastRequestAt >= TTL_MS;
}
const isHoldShown = (s, now) => s.held !== null && (s.held.switch !== null || isCold(s, now));
const heldModel = (s) => s.held?.switch?.to ?? s.lastModel;
function untilCold(s, now) {
  if (!s.lastRequestAt || s.compacted || isCold(s, now))
    return null;
  return s.lastRequestAt + TTL_MS - now;
}
function alwaysWindow(value) {
  if (value === true)
    return DEFAULT_WINDOW_MS;
  return typeof value === "number" && value >= TTL_MS && value <= MAX_ALWAYS_MS ? value : 0;
}
function parseAlways(rest) {
  if (!rest.length)
    return DEFAULT_WINDOW_MS;
  return rest.length === 1 ? alwaysWindow(parseDuration(rest[0] ?? "")) || null : null;
}
const holdMs = (s) => s.always ? s.alwaysMs : AUTO_WARM_MS;
function parseDuration(text) {
  const m = /^(?:(\d+)h)?(?:(\d+)m)?$/.exec(text.trim());
  if (!m || m[1] === undefined && m[2] === undefined)
    return null;
  return (Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0)) * MIN_MS;
}
const FULL_SHARE = 0.5;
const FULL_FLOOR = 20000;
const isFullMiss = (prev, write) => prev > FULL_FLOOR && write >= FULL_SHARE * prev;
function disarm(s) {
  if (s.pending)
    s.pending.cancel();
  s.pending = null;
}
function resetForClear(s) {
  s.ctx = 0;
  s.lastRequestAt = 0;
  s.lastResponseAt = 0;
  s.cacheModel = null;
  s.compacted = false;
  s.ackedAt = 0;
  s.coldWritePending = false;
  s.largestWrite = null;
  s.misses = [];
  s.held = null;
  s.resend = null;
  s.waitForTurn = false;
  s.isWarmAfterPay = false;
  disarm(s);
}

let current = "en";
const langOf = (value) => typeof value === "string" && /^tr/i.test(value.trim()) ? "tr" : "en";
function setLang(value) {
  current = langOf(value);
  return current;
}
const pick = (table) => table[current];

const MIN_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_FROM_HOURS = 48;
const WHOLE_DOLLARS_FROM = 100;
const UNITS = {
  en: { day: "d", hour: "h", min: "m", point: ".", group: "," },
  tr: { day: " gün", hour: " sa", min: " dk", point: ",", group: "." }
};
function fmtDuration(ms) {
  const u = pick(UNITS);
  const total = Math.max(0, Math.round(ms / MIN_MS));
  const h = Math.floor(total / MIN_PER_HOUR);
  const m = total % MIN_PER_HOUR;
  if (h >= DAYS_FROM_HOURS)
    return `${Math.floor(h / HOURS_PER_DAY)}${u.day} ${h % HOURS_PER_DAY}${u.hour}`;
  if (h === 0)
    return `${m}${u.min}`;
  return m === 0 ? `${h}${u.hour}` : `${h}${u.hour} ${m}${u.min}`;
}
const decimal = (n) => String(n).replace(".", pick(UNITS).point);
function fmtUsd(usd) {
  return usd == null ? "—" : "$" + (usd >= WHOLE_DOLLARS_FROM ? usd.toFixed(0) : decimal(usd.toFixed(2)));
}
function fmtInt(n) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, pick(UNITS).group);
}
function fmtTok(n) {
  if (n >= 1e6)
    return decimal((n / 1e6).toFixed(1)) + "M";
  return n >= 1000 ? Math.round(n / 1000) + "k" : String(n);
}

const statusIcons = {
  dark: {
    warm: {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
  <title>Cache Tax</title>
  <g stroke="#faf9f5" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <path fill="#78b85a" d="M8 18 32 5 56 18 32 31Z"/>
    <path d="M8 18v28l24 13 24-13V18M32 31v28"/>
    <path d="m40 32 8 5-8 5"/>
  </g>
</svg>
`,
      png: "iVBORw0KGgoAAAANSUhEUgAAAGAAAABACAYAAADlNHIOAAAABmJLR0QA/wD/AP+gvaeTAAAM10lEQVR4nO2caXQUVRbH/687JD1AIOn3qjubSEIgiqNzQMI2iAIJcpRBQBnEcSAugxgPQ3BhCRF1hBBRMrKcM5FVlMMAQjx6HEZIIiCrC4kwyqIEQmii6SUJ6Wwk3X3nAylt0pWVXujo75z60PVevbr3/uvV63erXgG/4VOYrw3oCEKIuxmjRURIAADGkEvElprN5uO+tq29+JUAoaGhvdRqtghgTwNQNSkmgO1kjKWaTKZzvrCvIzR14qYkODiYSxLPUKtV3wNspkajUT2XPAsFBV+joOBrPJc8CxqNhgE0hchxSgjtOzqdTu9ru/2eiIiIrpzz+ULwCiE46XQSJSXNoMJzp6n+avV128Wic5SSMpv0eh0JwUkIXiVJPEOr1fbwtR/+iIpzPl0IXtIYTJo86SH6puArl8A33b779gQlJc2QRSAhhEmStHMABPjaKb+Ac57AOT8pB3Ds2AQ6sD+v1cA33Q7sz6OxYxOchOBnJEk7BX427nkNrVY7VAjtATlg8fGD6MPsHXS1rkoxwDW1FbTv3Ie079yHVFNboVjnal0VfZi9g+LjBzkL8YUQ4l5f+yvj86tBq9X2V6nYMgATGn9j1qxnMPNvTyEwMNClPhHhlOk49hTuQkWdGQDQIygU9/Uej4HhI6Birv8rbDYbtm3bgRUrMlFqNMq7P3Y4aGFZWdkpT/nWFnwmAOc8kjH2GkBJANRdu3bFk0/MwOzZsxEc3F3xmMLy09hz7gP8VHVJsVzqGo7R0RNwh26QYnlNTQ02btqMNWvWoLLSCgB2gL1LRK9YLJbLbnGsnXhdAEmSujscjucYQxqA7l26dMHUqVPw4osvQCdJisdcrixCTuEunK8406Zz9OoZi8SYybg1pK9ieVlZObKysrB23QbU19cDQC1jWNXQYM+oqKio6JhnHcObAgQKIZIAeh2AjjGGBx98EAsXvITo6GjFA67UWZB34SOc+OkYCNTuE8bxP2Bc3yngv1OeEhgMBqxavQZbt26Dw+EAgDIiLA8ODl5ZVFRU1+4TdgBvCMAkSfsIETIAFgMAgwYNwstpCxEfH694QHV9FY5c2oOjhjzYHA03dHI1U2NA+B8xKnoCggN7KtY5ceIkli5Nx6HDR+RdlwC2xGw2bwBgvyEDWsGjAnDOExjDGwAGAkC/fn3x4gtzMX78eMX69far+OLyPnx+8T+4anPvBRioDsKQyFEYeeuDCArQKNb5/OAhvP76Enz33c/j8neM0WsmU9kHbjXGCY8IoNPpEonsW4igA4Dw8HDMTZmDadOmQq1Wu9S3kx0FPx7Gvgsfw1p/xRMm/Uy3wO4Yfsv9GBY1BgGqLi7lDocDu3fvxpKlGSguLgYAMAYjY+rHjUZjjrvtcbsAOp1urMNh/xQACwnpieTkZDz91BPQaJSvurOWk/j0hx2w1Ja625QW6anhSIieiLvChoAphKG+vh47duzE8uVvwmyxAACpVOpxRqNxrzvtcLsAQvDLACJemJuC519IAVP4Xw4AReVnsfd8NgyV591tQruI6hGDsTGT0Ts0TrGcyIHMFW9jxT/fBoASs9kS6c7ze0IABwBmuHQBKpXr7cZYXYKcwl04aznp7lPfEHH8LiT2eRi6bhEuZQ6HHVG3RAMAmc0Wt2aQPZGOZgAUg++vOPni9gvWEz2AAKDkcnGL9fzlFiQTEdkLAGA2W9waM58JIFNYfhr//WEbjNUl7jalRXjXMCREP4T+ursVB+GmeEoArz0R27JlK+x21zlNn9DbkRy/GBPi/trsRMmddAvsjsQ+D+O5+MW4QzfIJfgOhwOffPKJx+2Q8VoPiIjshb59Y/HSi8+3OhE7eHE36my1brWrvRMxJfsBP74FyQ4A11IRaYsWYPDgwYpt1DRU43Dxp15LRXzzzQmkpy9zTkV0agGMwLUZcmJiAl595eUWk3EHLu7G8R8Pgqh9yTgGhv66u5EQM7HFZNybb63Azp3ZcvtlALQt2e/3AjCmCm5MRy8CENymdLS1CDnn2peOHtvnYfTqGatYXlZWhqysd5zT0TWMYXVDgz0jIEBd3pL9fi+A7IBHHsh0C8fo3q0/kFm9ejWs1ipA4YFMW+13Fz4TQKajjyT3FmajvM4EoPVHkg0NDdi+/YM2PZL81Qkgo9Vqh6pUeANgIwEgOjoaqQvn4YEHHgBjrofYHA344vI+AMCQyFGKmU0iwu7du5G+bDkuXLgg7/4SYPPMZvMBd9rfUW4aAWQ45wkAMhnDnQAwcOAALEpdiGHDhrbLjqNHj2Fp+jLk5xfIuwjAR4GBQX8pKSmp8ZT97eWmezXRYrHkWiyWgQCbBeDH/PwCPPzInzF9ehLOnDnb6vFnzpzF9OlJyMp6BxvWr0VB/ldISpoOlUrFAEysr6/7n06nvd/jjvgK+f2bpu/oyPvb09aNvJpYfLHwuvJjRw/RyJEjnN4P0m6VJCnMk/a3hZvuFqREcHAw12gCXyLCHAAajUaD84XfX1cnpk8/1NX98hgz//iXCAu7Pr42mw3r1m/EihWZqKmpAYAKgC0wm83rADg8ZX9L3HS3ICWsVqvFZLIssNsdcQCuC7SMvI8x7AWA+QtS5Xd/fiYgIADPzpqJ/ftykTBmNACEAJTFOT8ohGg5Heoh/EIAmfLy8lZTrERsNoDynJxcjBx5H3buzHapExUVhffeexebN29CREQEGMNwgI4KIfp5wu6W8CsB2oLZbP4eYEOJcMRoMuHvc1IwfXoSDAaDS93EhDH4LC9H7g2hjNEyb9vb6QQArolgsVjuafwnVZGb9xnuG5WAf2Wthc1mu65ujx7BWL48AwAgL3nyJp1SAH+iUy5aEEL0I6JNAA0HgIQxo5GevgRRUVEudSsrrZg3bwEAebEfJnvT1k7XA64NpHSMMQzXSRJWrXwb7733rmLwc3LzMHpMInLzPgOAciK20Nv2droewBgtI0JoYmICVq9aiR49gl3qGAwGpKamyYEHEY4wxp40m83fC8G9am+nE0AeSN/ISHcJfnMTMYvll4mYt+l0AjRHfn4B5s1fgFOnTjfuoX8zpn7eZDL95Eu7vD4G6PX6GE+2zxhyAWD+/IUoLS1FaWkpUhelYcJDkxqDT+dVKhpnNpc91jT4nrZNCa/1AI1Gg7q6OtjttjNCaDepVAGLjUaj29/IvTaQ0qic3LzQAQOvW3/QwBhWBAV1/YfBYLjulQs512S321JkW72F13rA4UMH8Pjjj0GtVncB2EyHw17oiYXU8kyYMWQDsAKwMoZsu90x0GSyLHQOvpxtDQoKLCTCfJVKFTR+/Hgc2J/rTpO8ixD8ilI6WN5OnsinR6dOcV42WiKEeAZt7I1uShcHCCGecV4I/ujUKXTyRL6izcUXC+X2Pbt4wR1IEt8lBKdp06aSsbSkPQupT3POJ7XW/o0KwDmfJAQ/3daF4MbSEpo2bSoJwUmS+C73RMmDCCH6CcHLhOAUGxtDmZlvUeUVS7MO5ubuoREjhv8cQEniRyQpdETz7XdMAEkKHSFJ/Ihcb/DgeMretb3ZheBV1nLauGEdxcX1ldsu80W2tEM0ipArO3vnnb+njRvWUW1NpfKq9+ortHHDOrqj/+3OPeIjrVbb37Xt9gmg1Wr7C8E/ksv79etLmZlvUZW1XNGWulorZe/aTgMGDHC2Jddvgu8M5zxBCH5cdmTYsCGUvWt7s72hotxEmZlvUUxMb9lxuxBiR1hYSG+5zbYKwDmPFEL7jhC8QQhOvXrdQq++kkYWc2mLvfHee+9xDvy3jd+X8GuYJGmnCMHPyY6NG3c/HTq4r9lA/PSjgV59JY0iIsLlQNRIEs8ICQkJaU0ASZK6Nz5HtgrBKTw8jFJSZpPBUNTs+b784ghNfOhPzoEvFkLMBNB5VpnExsYGCaGdK0ncLDs6bdpUOnvm22YDc77wLKWkzCadTpLHB3PrAlyrI0mCkpJmtNr+s8/OJEkSTsdq58bGxgb5Ol4ew+kKrWzrFfrVl0ebXqHNCiD3sMOH9rfQwy417WHVcg/zdXy8xrV7tFgvBLd15B6tJMDw4UPbNMZER98qB94mhFjPOXfryke/oum/lNtvi6N1a7Ooukr5G0B1tVba8v5ml/1b3t9MdbVWxWOqqypo3dosuv22uFb/Zf1qae8Hm9qy+cMHm246fvtk2c1Bu3I1ztuN5pp+wwm9Xt9NkniaaEzw6fU6Sk6eRUUXfnAJfNGFHyg5eZbzZyuvSBJP0+v13Xzth98TFhYmcc5XCsGvCsEpKiqSFr+cSpeKz9Ol4vO0+OVUioqKlAN/lXO+MiwsTHm9002GX90P9Xp9jN3esARgj8LVdgJom1rdJa20tNS3y+/bgV8JINP48e5UIiQCAGPIIWLp/vjx7t/wMf8HjK9ER0Ercn4AAAAASUVORK5CYII="
    },
    cold: {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
  <title>Cache Tax</title>
  <g stroke="#faf9f5" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <path fill="#d97757" d="M8 18 32 5 56 18 32 31Z"/>
    <path d="M8 18v28l24 13 24-13V18M32 31v28"/>
    <path d="m40 32 8 5-8 5"/>
  </g>
</svg>
`,
      png: "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"
    },
    neutral: {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
  <title>Cache Tax</title>
  <g stroke="#faf9f5" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <path fill="#92928b" d="M8 18 32 5 56 18 32 31Z"/>
    <path d="M8 18v28l24 13 24-13V18M32 31v28"/>
    <path d="m40 32 8 5-8 5"/>
  </g>
</svg>
`,
      png: "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"
    }
  },
  light: {
    warm: {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
  <title>Cache Tax</title>
  <g stroke="#141413" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <path fill="#397527" d="M8 18 32 5 56 18 32 31Z"/>
    <path d="M8 18v28l24 13 24-13V18M32 31v28"/>
    <path d="m40 32 8 5-8 5"/>
  </g>
</svg>
`,
      png: "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"
    },
    cold: {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
  <title>Cache Tax</title>
  <g stroke="#141413" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <path fill="#c15f3c" d="M8 18 32 5 56 18 32 31Z"/>
    <path d="M8 18v28l24 13 24-13V18M32 31v28"/>
    <path d="m40 32 8 5-8 5"/>
  </g>
</svg>
`,
      png: "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"
    },
    neutral: {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
  <title>Cache Tax</title>
  <g stroke="#141413" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <path fill="#686861" d="M8 18 32 5 56 18 32 31Z"/>
    <path d="M8 18v28l24 13 24-13V18M32 31v28"/>
    <path d="m40 32 8 5-8 5"/>
  </g>
</svg>
`,
      png: "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"
    }
  }
};

const GRID = 64;
const ASSET = statusIcons.dark.neutral.svg;
const GROUP = /<g [\s\S]*?<\/g>/.exec(ASSET)?.[0] ?? "";
const OUTLINE = /stroke="([^"]+)"/.exec(GROUP)?.[1] ?? "";
const LID = /fill="([^"]+)"/.exec(GROUP)?.[1] ?? "";
function cube({ x, y, size }, ink) {
  const { lid, outline } = ink;
  const group = GROUP.replace(`stroke="${OUTLINE}"`, `stroke="${outline}"`).replace(`fill="${LID}"`, `fill="${lid}"`);
  return `<g transform="translate(${x} ${y}) scale(${size / GRID})" fill="none">${group}</g>`;
}

const DARK = {
  sheet: "#191917",
  card: "#1F1F1C",
  inset: "#171715",
  line: "#2E2E2A",
  lineStrong: "#45443F",
  track: "#34332F",
  hi: "#F0EEE8",
  mid: "#C2BEB4",
  lo: "#8E8A80",
  role: {
    read: { fg: "#7FB6E8", tint: "#1E2B37", line: "#2F4A63" },
    edit: { fg: "#E58A5F", tint: "#38251D", line: "#6A3E2D" },
    run: { fg: "#B19CF3", tint: "#29243D", line: "#4A3F75" },
    ok: { fg: "#6FC593", tint: "#1B2F25", line: "#2F5A42" },
    warn: { fg: "#E9B949", tint: "#332D19", line: "#66552A" },
    danger: { fg: "#F2727F", tint: "#3B2023", line: "#74343C" },
    plan: { fg: "#E07BC0", tint: "#351F2E", line: "#6B3A5C" }
  }
};
const LIGHT = {
  sheet: "#F4F2EC",
  card: "#FFFFFF",
  inset: "#F6F4EF",
  line: "#E4E0D6",
  lineStrong: "#CFC9BC",
  track: "#ECE8DF",
  hi: "#1C1B19",
  mid: "#4F4B44",
  lo: "#77726A",
  role: {
    read: { fg: "#2464A0", tint: "#E7F0F9", line: "#B9D3EC" },
    edit: { fg: "#A94A26", tint: "#FBEDE6", line: "#EFC6B4" },
    run: { fg: "#6243C4", tint: "#F0ECFC", line: "#CFC3F3" },
    ok: { fg: "#1F6E43", tint: "#E4F4EA", line: "#B5DEC4" },
    warn: { fg: "#8A6000", tint: "#FBF2D9", line: "#EBD48F" },
    danger: { fg: "#C0263A", tint: "#FCE8EA", line: "#F1B9C0" },
    plan: { fg: "#A8337F", tint: "#FBE9F4", line: "#EDBFDC" }
  }
};
const palette = (isLight) => isLight ? LIGHT : DARK;
const TERMINAL = {
  read: "suggestion",
  edit: "claude",
  run: "permission",
  ok: "success",
  warn: "warning",
  danger: "error",
  plan: "merged"
};
const isLightTheme = (value) => typeof value === "string" && value.startsWith("light");
const FONT = `-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, system-ui, sans-serif`;
const MONO = `ui-monospace, 'SF Mono', Menlo, monospace`;

const esc = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const NARROW = "iljtfrı.,:;|!'`· ()";
const WIDE = "mwMWğĞ@%";
const BOLD_GROWTH = 1.06;
const GLYPH = { narrow: 0.3, wide: 0.82, capital: 0.64, space: 0.28, other: 0.54, mono: 0.6 };
function share(c) {
  if (NARROW.includes(c))
    return GLYPH.narrow;
  if (WIDE.includes(c))
    return GLYPH.wide;
  if (c === " ")
    return GLYPH.space;
  return c >= "A" && c <= "Z" ? GLYPH.capital : GLYPH.other;
}
function measure(text, font) {
  const chars = [...text];
  if (font.isMono)
    return chars.length * font.size * GLYPH.mono;
  const base = chars.reduce((sum, c) => sum + font.size * share(c), 0);
  return base * ((font.weight ?? 400) >= 600 ? BOLD_GROWTH : 1);
}
function fit(text, width, font) {
  if (measure(text, font) <= width)
    return text;
  const chars = [...text];
  while (chars.length > 1 && measure(`${chars.join("")}…`, font) > width)
    chars.pop();
  return `${chars.join("").trimEnd()}…`;
}
function text(t) {
  const attrs = [
    `x="${t.x}" y="${t.y}" fill="${t.fill}" font-size="${t.size}" font-weight="${t.weight ?? 400}"`,
    `font-family="${t.isMono ? MONO : FONT}"`,
    t.isMono ? 'font-variant-numeric="tabular-nums"' : "",
    t.anchor && t.anchor !== "start" ? `text-anchor="${t.anchor}"` : "",
    t.isItalic ? 'font-style="italic"' : ""
  ];
  return `<text ${attrs.filter(Boolean).join(" ")}>${esc(t.text)}</text>`;
}
const ICON_STROKE = 1.75;
const icon = (paths, { x, y, size }, color) => `<g transform="translate(${x} ${y}) scale(${size / 24})" fill="none" stroke="${color}" stroke-width="${ICON_STROKE * 24 / size}" ` + `stroke-linecap="round" stroke-linejoin="round">${paths}</g>`;
const REDUCED = "@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}";
function doc(frame, body, style = "") {
  const w = Math.round(frame.width);
  const h = Math.round(frame.height);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` + `<style>${style}${REDUCED}</style>${body}</svg>`;
}
const iconSvg = (paths, size, color) => doc({ width: size, height: size }, icon(paths, { x: 0, y: 0, size }, color));

const plural$1 = (n, one, many) => `${n} ${n === "1" ? one : many}`;
const EN$1 = {
  name: "Re-read cost",
  headline: "Your message is on hold",
  wentCold: (ago) => `The chat stopped being kept ready ${ago} ago.`,
  switched: (from, to) => [`Model changed (${from} → ${to}): Claude reads the whole chat again.`, `Model changed: ${from} → ${to}.`],
  sendNow: "Send now",
  warmTurn: "A usual turn",
  warmCaptions: (times) => times === null ? ["while the chat is kept ready"] : [`while the chat is kept ready · ${times}× cheaper`, `${times}× cheaper`],
  tokens: (tokens) => `~${plural$1(tokens, "token", "tokens")}`,
  rewritten: (rate) => [`read again in full · ${rate}`, "read again in full"],
  keep: (auto) => `Pay once, and keepwarm keeps the chat ready for ${auto}.`,
  pay: { label: "Pay and send", hotkey: "p" },
  fresh: { label: "Start fresh", hotkey: "n" },
  status: { label: "Show status", hotkey: "s" },
  alt: (cold, warm) => `Re-read cost: your message is on hold. Send now ${cold}, a usual turn ${warm}.`,
  held: "Held: ",
  states: { warm: "ready", cold: "expired", unknown: "unknown", stopped: "stopped" },
  cache: "Chat · ",
  coldAgo: (ago) => `${ago} ago`,
  nextUpTo: (usd) => `next message up to ${usd}`,
  goesCold: (left) => `expires in ${left}`,
  keepWarm: "keep it ready with /keepwarm",
  noPing: "could not keep the chat ready: it had already expired, or Claude could not be reached",
  nothingToFork: "no chat to keep ready yet",
  apiError: (status) => `Claude could not be reached${status}`,
  aborted: "the refresh was cut off",
  noText: "the refresh got no answer",
  pingFailed: (why) => `the refresh failed: ${why}`,
  share: (share) => `Sending now takes ${share} at this chat’s pace`,
  capReached: (pings) => `${pings} refreshes, the most one stretch sends; /keepwarm starts another`,
  tooLong: (tokens) => `a refresh wrote ${tokens} tokens, more than allowed`,
  gone: (g) => `the refresh read ${g.read} tokens and had to read ${g.wrote} tokens again in full (${g.usd}); the chat had already expired`,
  section: "Chat kept ready",
  sectionEmpty: "No answer yet. After each answer Claude keeps the chat ready (cache) for an hour, so the next message costs less; once the first answer arrives this shows whether it is still ready, the time left, what a message costs once it is not, and keepwarm.",
  listPrice: "$ are estimates at list prices; on a subscription the share of your usage allowance is what counts."
};
const TR$1 = {
  name: "Baştan okuma bedeli",
  headline: "Mesajın bekletiliyor",
  wentCold: (ago) => `Sohbet ${ago} önce hazır tutulmayı bıraktı.`,
  switched: (from, to) => [`Model değişti (${from} → ${to}): Claude tüm sohbeti baştan okur.`, `Model değişti: ${from} → ${to}.`],
  sendNow: "Şimdi gönder",
  warmTurn: "Olağan bir tur",
  warmCaptions: (times) => times === null ? ["sohbet hazırken"] : [`sohbet hazırken · ${times} kat ucuz`, `${times} kat ucuz`],
  tokens: (tokens) => `~${tokens} token`,
  rewritten: (rate) => [`baştan okunur · ${rate}`, "baştan okunur"],
  keep: (auto) => `Bir kez öde, keepwarm sohbeti ${auto} hazır tutsun.`,
  pay: { label: "Öde ve gönder", hotkey: "o" },
  fresh: { label: "Yeni başla", hotkey: "y" },
  status: { label: "Durumu göster", hotkey: "d" },
  alt: (cold, warm) => `Baştan okuma bedeli: mesajın bekletiliyor. Şimdi gönder ${cold}, olağan bir tur ${warm}.`,
  held: "Bekleyen: ",
  states: { warm: "hazır", cold: "süresi doldu", unknown: "bilinmiyor", stopped: "durdu" },
  cache: "Sohbet · ",
  coldAgo: (ago) => `${ago} önce`,
  nextUpTo: (usd) => `sonraki mesaj en fazla ${usd}`,
  goesCold: (left) => `${left} sonra süresi dolar`,
  keepWarm: "/keepwarm ile hazır tut",
  noPing: "sohbet hazır tutulamadı: ya süresi zaten dolmuştu ya da Claude'a ulaşılamadı",
  nothingToFork: "hazır tutulacak sohbet henüz yok",
  apiError: (status) => `Claude'a ulaşılamadı${status}`,
  aborted: "tazeleme yarıda kesildi",
  noText: "tazeleme yanıt almadı",
  pingFailed: (why) => `tazeleme başarısız: ${why}`,
  share: (share) => `Şimdi göndermek bu sohbetin hızıyla ${share} tutar`,
  capReached: (pings) => `${pings} tazeleme, bir seferde gidebilecek en fazlası; /keepwarm yenisini başlatır`,
  tooLong: (tokens) => `bir tazeleme ${tokens} token yazdı, izin verilenden fazla`,
  gone: (g) => `tazeleme ${g.read} token okudu, ${g.wrote} tokenı baştan okumak zorunda kaldı (${g.usd}); sohbetin süresi zaten dolmuştu`,
  section: "Hazır sohbet",
  sectionEmpty: "Henüz yanıt yok. Claude her yanıttan sonra sohbeti bir saat hazır tutar (cache), sonraki mesaj daha ucuza gelir; ilk yanıt gelince burada hâlâ hazır mı, kalan süre, hazır değilken bir mesajın kaça geleceği ve keepwarm görünür.",
  listPrice: "$ tutarları liste fiyatıyla tahmindir; abonelikte asıl ölçü kullanım hakkından alınan paydır."
};
const bandWords = () => pick({ en: EN$1, tr: TR$1 });

function timesCheaper(view) {
  return view.coldUsd && view.warmUsd ? Math.round(view.coldUsd / view.warmUsd) : null;
}
function warmCaptions(view) {
  return bandWords().warmCaptions(timesCheaper(view));
}
const HEADER_H = 50;
const CUBE = 18;
const TEXT_X = 28;
const HEADLINE = { size: 17, weight: 620 };
const BODY = { size: 13 };
const CUBE_Y = 6;
const HY = { headline: 20, body: 43 };
function headerSvg(width, view, p) {
  const room = width - TEXT_X;
  const reason = view.reason.find((said) => measure(said, BODY) <= room) ?? fit(view.reason.at(-1) ?? "", room, BODY);
  const body = [
    cube({ x: 0, y: CUBE_Y, size: CUBE }, { lid: "none", outline: p.mid }),
    text({ ...HEADLINE, x: TEXT_X, y: HY.headline, fill: p.hi, text: fit(bandWords().headline, room, HEADLINE) }),
    text({ ...BODY, x: 0, y: HY.body, fill: p.mid, text: reason })
  ];
  return doc({ width, height: HEADER_H }, body.join(""));
}
const COMPARE_H = 112;
const PAD = 16;
const GUTTER = 20;
const RADIUS = 10;
const BAR_H = 6;
const MIN_BAR = 6;
const LABEL = { size: 12, weight: 500 };
const PRICE = { size: 24, weight: 650, isMono: true };
const CAPTION = { size: 12 };
const CAPTION_GAP = 6;
const DIGIT_SLACK = 1.1;
const CY = { label: 26, price: 56, bar: 68, caption: 94 };
function column(c, p) {
  const fill = c.share === null ? "" : `<rect x="${c.x}" y="${CY.bar}" width="${Math.max(MIN_BAR, c.w * c.share)}" height="${BAR_H}" rx="${BAR_H / 2}" fill="${p.mid}"/>`;
  return [
    text({ ...LABEL, x: c.x, y: CY.label, fill: p.mid, text: fit(c.label, c.w, LABEL) }),
    text({ ...PRICE, x: c.x, y: CY.price, fill: c.ink, text: fmtUsd(c.usd) }),
    `<rect x="${c.x}" y="${CY.bar}" width="${c.w}" height="${BAR_H}" rx="${BAR_H / 2}" fill="${p.track}"/>`,
    fill
  ].join("");
}
function coldCaption({ x, w }, view, p) {
  const count = bandWords().tokens(view.tokens);
  const restX = x + measure(count, CAPTION) * DIGIT_SLACK + CAPTION_GAP;
  const room = Math.max(0, x + w - restX);
  const rest = bandWords().rewritten(view.rate).find((said) => measure(said, CAPTION) <= room) ?? "";
  return [
    text({ ...CAPTION, x, y: CY.caption, fill: p.hi, text: count }),
    text({ ...CAPTION, x: restX, y: CY.caption, fill: p.lo, text: rest })
  ].join("");
}
function compareSvg(width, view, p) {
  const w = (width - 2 * PAD - GUTTER) / 2;
  const right = PAD + w + GUTTER;
  const share = view.coldUsd && view.warmUsd !== null ? Math.min(1, view.warmUsd / view.coldUsd) : null;
  const body = [
    `<rect width="${width}" height="${COMPARE_H}" rx="${RADIUS}" fill="${p.inset}"/>`,
    column({ x: PAD, w, label: bandWords().sendNow, usd: view.coldUsd, share: view.coldUsd === null ? null : 1, ink: p.role.warn.fg }, p),
    column({ x: right, w, label: bandWords().warmTurn, usd: view.warmUsd, share, ink: p.hi }, p),
    coldCaption({ x: PAD, w }, view, p),
    text({ ...CAPTION, x: right, y: CY.caption, fill: p.lo, text: warmCaptions(view).find((said) => measure(said, CAPTION) <= w) ?? "" })
  ];
  return doc({ width, height: COMPARE_H }, body.join(""));
}

const ICONS = {
  pauseCircle: '<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>',
  shieldCheck: '<path d="M12 3l7 2.8v5.4c0 4.4-2.9 8-7 9.8-4.1-1.8-7-5.4-7-9.8V5.8z"/><path d="m9 12.2 2.1 2.1 4-4.1"/>',
  bookmarkPlus: '<path d="M6.5 3.5h11v17l-5.5-3.8-5.5 3.8z"/><path d="M12 7.5v5.5M9.25 10.25h5.5"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  folder: '<path d="M3.5 7.5a2 2 0 0 1 2-2h3.6l2 2.2h7.4a2 2 0 0 1 2 2v7.8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.2-3.5-8.5s1.2-6.1 3.5-8.5z"/>'
};

const PX_PER_COLUMN = 8;
const CARD_CHROME = 6;
const MIN_WIDTH = 300;
const MAX_WIDTH = 720;
const ROW_ICON = 16;
const contentWidth = (columns) => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, (columns - CARD_CHROME) * PX_PER_COLUMN));
const heldQuote = (view) => `“${view.held}”`;
const keepText = (view) => bandWords().keep(view.autoWarm);
function buttons(ui, actions) {
  const { Box, Button } = ui;
  const { pay, fresh, status } = bandWords();
  return Box({ flexDirection: "row", flexWrap: "wrap", gap: 1, alignItems: "center", children: [
    Button({ key: "cache-tax:pay", ...pay, variant: "secondary", onPress: actions.pay }),
    Button({ key: "cache-tax:fresh", ...fresh, variant: "secondary", onPress: actions.fresh }),
    Button({ key: "cache-tax:status", ...status, plain: true, dimColor: true, onPress: actions.status })
  ] });
}
function infoRow(ui, glyph, children) {
  const { Box, Svg } = ui;
  const { paths, color } = glyph;
  return Box({ flexDirection: "row", gap: 1, alignItems: "center", children: [
    Box({ flexShrink: 0, children: [Svg({ source: iconSvg(paths, ROW_ICON, color), alt: "", width: ROW_ICON, height: ROW_ICON })] }),
    ...children
  ] });
}
function desktopInfo(ui, view, p) {
  const { Box, Text } = ui;
  return Box({ flexDirection: "column", children: [
    infoRow(ui, { paths: ICONS.pauseCircle, color: p.mid }, [
      Text({ color: p.mid, wrap: "truncate-end", children: [bandWords().held, Text({ color: p.hi, children: [heldQuote(view)] })] })
    ]),
    view.share === null ? null : infoRow(ui, { paths: ICONS.pauseCircle, color: p.mid }, [Text({ color: p.hi, children: [bandWords().share(view.share)] })]),
    infoRow(ui, { paths: ICONS.shieldCheck, color: p.mid }, [Text({ color: p.mid, children: [keepText(view)] })])
  ] });
}
function holdDesktop(ui, o) {
  const { Box, Svg } = ui;
  const p = palette(o.isLight);
  const width = contentWidth(o.columns);
  const alt = bandWords().alt(fmtUsd(o.view.coldUsd), fmtUsd(o.view.warmUsd));
  return Box({
    key: "cache-tax:hold",
    flexDirection: "column",
    alignSelf: "flex-start",
    gap: 1,
    paddingX: 2,
    paddingY: 1,
    borderStyle: "round",
    borderColor: p.line,
    backgroundColor: p.card,
    children: [
      Svg({ source: headerSvg(width, o.view, p), alt, width, height: HEADER_H }),
      Svg({ source: compareSvg(width, o.view, p), alt: `${bandWords().tokens(o.view.tokens)}, ${o.view.rate}`, width, height: COMPARE_H }),
      desktopInfo(ui, o.view, p),
      buttons(ui, o.actions)
    ]
  });
}
const BAR_FULL = 24;
const BAR_MIN = 1;
const LABEL_CELLS = 13;
const PRICE_CELLS = 6;
const LINE_CHROME = 30;
function textBar(share, cells) {
  const filled = Math.max(BAR_MIN, Math.round(share * cells));
  return "━".repeat(Math.max(0, filled - 1)) + "╸";
}
function priceLine(ui, { label, usd, color, bar }) {
  const { Box, Text } = ui;
  return Box({ flexDirection: "row", gap: 1, children: [
    Text({ dimColor: true, children: [label.padEnd(LABEL_CELLS)] }),
    Text({ bold: true, color, children: [usd.padStart(PRICE_CELLS)] }),
    Text({ color, children: [bar] })
  ] });
}
function holdTerminal(ui, o) {
  const { Box, Text } = ui;
  const warn = o.noColor ? undefined : TERMINAL.warn;
  const v = o.view;
  const share = v.coldUsd && v.warmUsd !== null ? Math.min(1, v.warmUsd / v.coldUsd) : 0;
  const cells = Math.max(BAR_MIN, Math.min(BAR_FULL, o.columns - LINE_CHROME));
  const said = bandWords();
  return Box({ key: "cache-tax:hold", flexDirection: "column", paddingX: 1, borderStyle: "round", borderDimColor: true, children: [
    Text({ bold: true, dimColor: true, children: [said.name] }),
    Text({ bold: true, children: [said.headline] }),
    Text({ dimColor: true, children: [v.reason[0] ?? ""] }),
    priceLine(ui, { label: said.sendNow, usd: fmtUsd(v.coldUsd), color: warn, bar: textBar(1, cells) }),
    priceLine(ui, { label: said.warmTurn, usd: fmtUsd(v.warmUsd), color: undefined, bar: `${textBar(share, cells)} ${warmCaptions(v).at(-1) ?? ""}` }),
    Text({ dimColor: true, children: [`${said.tokens(v.tokens)} ${said.rewritten(v.rate)[0]}`] }),
    v.share === null ? null : Text({ bold: true, children: [said.share(v.share)] }),
    Text({ wrap: "truncate-end", children: [Text({ dimColor: true, children: [`⏸ ${said.held}`] }), heldQuote(v)] }),
    Text({ dimColor: true, children: [`✓ ${keepText(v)}`] }),
    buttons(ui, o.actions)
  ] });
}

const FAMILY = /(fable|opus|sonnet|haiku)-(\d{1,2})(?:-(\d{1,2}))?(?!\d)/;
function parse(id) {
  const m = FAMILY.exec(id.toLowerCase().replace(/\[[^\]]*\]/g, "").replace(/[\s.]+/g, "-"));
  if (!m || !m[1] || !m[2])
    return null;
  return { family: m[1], version: m[3] ? `${m[2]}.${m[3]}` : m[2] };
}
function modelName(id) {
  const p = parse(id);
  if (!p)
    return id;
  return `${p.family.charAt(0).toUpperCase()}${p.family.slice(1)} ${p.version}`;
}
function switchOf(cache, session) {
  const a = parse(cache);
  const b = parse(session);
  if (!a || !b)
    return null;
  if (a.family === b.family && a.version === b.version)
    return null;
  return { from: cache, to: session };
}

const FIVE_HOUR = "five_hour";
const SEVEN_DAY = "seven_day";
const MIN_USD = 0.5;
const MIN_POINTS = 1;
const windowOf = (limits) => limits.find((limit) => limit.kind === FIVE_HOUR) ?? limits.find((limit) => limit.kind === SEVEN_DAY);
function trackRate(rate, limits, usd) {
  const window = windowOf(limits);
  if (window === undefined || usd === undefined)
    return rate;
  const reading = { kind: window.kind, percent: window.percentUsed, usd };
  const isFresh = rate === null || rate.kind !== window.kind || window.percentUsed < rate.percent || usd < rate.usd;
  if (isFresh)
    return { ...reading, firstPercent: reading.percent, firstUsd: usd };
  return { ...rate, percent: reading.percent, usd };
}
function shareOf(rate, usd) {
  if (rate === null || usd === null)
    return null;
  const spent = rate.usd - rate.firstUsd;
  const moved = rate.percent - rate.firstPercent;
  if (spent < MIN_USD || moved < MIN_POINTS)
    return null;
  return { percent: usd * moved / spent, isWeekly: rate.kind === SEVEN_DAY };
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const EN = {
  rateUnknown: "the full re-read price",
  perMillion: (usd) => `$${usd} per million tokens`,
  guard: (g) => (g.share === null ? `${g.lead} This message makes Claude read up to ${g.tokens} tokens of the chat again at ${g.rate} = ${g.usd}` : `${g.lead} This message makes Claude read up to ${g.tokens} tokens of the chat again: ${g.share} (${g.usd} at list prices)`) + (g.warm === null ? "" : ` (while the chat is kept ready, a turn costs ${g.warm})`) + ".",
  share: (percent, isWeekly) => `≈${percent}% of the ${isWeekly ? "weekly" : "5-hour"} usage allowance`,
  noPrice: "no price for this model",
  coldLead: (ago) => `This chat stopped being kept ready (cache) ${ago} ago.`,
  switchLead: (from, to) => `Model changed (${from} → ${to}): Claude reads the whole chat again.`,
  dropHeld: (usd) => `cache-tax: your message is on hold; choose on the card (the chat is no longer kept ready, up to ${usd}).`,
  dropSwitched: (usd) => `cache-tax: your message is on hold; choose on the card (model changed, up to ${usd}).`,
  drop: (guard) => `cache-tax: ${guard} Send again to pay; /keepwarm then keeps the chat ready. Or start over with /clear and a short note.`,
  warn: (guard) => `${guard} Sending anyway; /keepwarm keeps the chat ready from here.`,
  paid: (g) => `Claude read ${g.tokens} tokens of the chat again (${g.usd}). The chat stays ready for ${g.auto} so you do not pay this ` + "again today; /keepwarm off stops it.",
  paidCold: (g) => `Claude read ${g.tokens} tokens of the chat again (${g.usd}). /keepwarm keeps it ready so you do not pay this again today.`,
  cap: (pings, output) => `; at most ${pings} refreshes, and one that writes more than ${output} tokens ends it`,
  resume: (tokens, usd) => `Picking up a chat that is no longer kept ready. The first message makes Claude read ${tokens} tokens again, ≈${usd}. ` + "If you only need the results, start with /clear and paste a summary.",
  hookTwice: "The older hook version (cache-tax@claude-code-hooks) is installed too, so a message is warned about or " + "held twice. Remove it, or run /cache-tax guard warn here.",
  forkWaits: "keepwarm is on, but there is no chat to refresh yet, so nothing goes out until your next " + "message. Send one more message and the refreshes start.",
  firstTurn: " · waiting for the first turn",
  afterCompact: " · waiting for the first turn after the chat was summarized",
  coldPing: (every) => ` · no longer ready; first refresh ${every} after the next turn`,
  pingIn: (left) => ` · refresh in ${left}`,
  lastPing: (read, usd) => ` · last refresh read ${read} tokens for ${usd}`,
  stopped: (why) => `stopped keeping the chat ready: ${why}`,
  warmFor: (rest) => `keeping ready: ${rest}`,
  left: (left) => `${left} left`,
  coldNow: (every) => `. The chat is no longer kept ready; the first refresh comes ${every} after the next turn`,
  armedCold: (span) => `the chat stays ready for ${span}`,
  armed: (t) => `the chat stays ready for ${t.span}: ${t.every} into every pause, a small refresh keeps it ready ` + "without a full re-read",
  always: (span) => `keepwarm always on: every chat starts kept ready for ${span}; /keepwarm off turns it off for good`,
  keepwarmCommand: "Keep the chat ready (cache) during breaks, so the next message costs less: 6 hours on its own, a span like 90m, always (or always 24h), off or status (cache-tax)",
  cacheTaxCommand: "Whether the chat is still kept ready, what a message costs once it is not, and this chat’s full re-reads; guard warn|refuse (cache-tax)",
  keepwarm: {
    off: "keepwarm off",
    offAlways: "keepwarm off; it no longer turns on by itself when a chat starts",
    usage: "keepwarm takes a span (6h, 90m) or always, off, status",
    every: "every takes a span from 1m to 59m",
    alwaysUsage: "always takes one span from 1h to 168h, such as always 24h"
  },
  guardMode: {
    usage: "/cache-tax guard takes warn, refuse, or refuse with a dollar floor such as refuse 5",
    floor: (usd) => `guard: hold the message once when it costs ${usd} or more. A cheaper one goes through with its price shown`,
    refuse: "guard: hold the message once. It waits with its price; sending it again goes through",
    warn: "guard: warn only. The message goes through with its price shown"
  },
  labels: { state: "kept ready", context: "chat memory", cost: "cost", keepwarm: "keepwarm", even: "worth it", guard: "guard", session: "this chat" },
  noModel: "no model seen yet",
  compacted: "started over when the chat was summarized; waiting for the first turn",
  noRequest: "nothing sent in this chat yet",
  coldState: (ago) => `NO, last call to Claude ${ago} ago`,
  warmState: (left) => `yes, ${left} left`,
  context: (tokens) => `${tokens} tokens`,
  cost: (usd, warm) => `full re-read ${usd} (a turn while ready ${warm})`,
  on: (line) => `on, ${line}`,
  stoppedRow: (why) => `stopped, ${why}`,
  offUntilNext: (span) => `off until the next chat starts, then on for ${span} (always)`,
  off: (span) => `off (/keepwarm turns it on for ${span})`,
  even: (pings, t) => `up to ${plural(pings, "refresh costs", "refreshes cost")} the same as one full re-read; at one every ${t.every}, ` + `that covers ≈${t.span} away`,
  guardRefuse: "hold once (/cache-tax guard warn only shows the price)",
  guardWarn: "warn only (/cache-tax guard refuse holds once)",
  guardFloor: (usd) => `hold once at ${usd} or more, warn below (/cache-tax guard refuse holds any)`,
  underFloor: (floor) => ` It costs less than your ${floor} floor, so it was not held.`,
  session: (count, usd) => `${plural(count, "full re-read", "full re-reads")} paid, ${usd}`,
  unpricedPaid: (usd, count) => `${usd ? `${usd} and ` : ""}${count} with no price`
};

const TR = {
  rateUnknown: "baştan okuma fiyatı",
  perMillion: (usd) => `milyon token başına $${usd}`,
  guard: (g) => (g.share === null ? `${g.lead} Bu mesajla Claude sohbetin en fazla ${g.tokens} token'ını ${g.rate} fiyatla baştan okur = ${g.usd}` : `${g.lead} Bu mesajla Claude sohbetin en fazla ${g.tokens} token'ını baştan okur: ${g.share} (liste fiyatıyla ${g.usd})`) + (g.warm === null ? "" : ` (sohbet hazır tutulurken bir tur ${g.warm} olurdu)`) + ".",
  share: (percent, isWeekly) => `${isWeekly ? "haftalık" : "5 saatlik"} kullanım hakkından ≈%${percent}`,
  noPrice: "bu modelin fiyatı yok",
  coldLead: (ago) => `sohbet ${ago} önce hazır tutulmayı bıraktı (cache).`,
  switchLead: (from, to) => `model değişti (${from} → ${to}): Claude tüm sohbeti baştan okur.`,
  dropHeld: (usd) => `cache-tax: mesajın bekletiliyor, kartta seç (sohbet artık hazır tutulmuyor, en fazla ${usd}).`,
  dropSwitched: (usd) => `cache-tax: mesajın bekletiliyor, kartta seç (model değişti, en fazla ${usd}).`,
  drop: (guard) => `cache-tax: ${guard} Ödemek için yeniden gönder; sonra /keepwarm sohbeti hazır tutar. Ya da /clear ile kısa bir notla baştan başla.`,
  warn: (guard) => `${guard} Yine de gönderiliyor; buradan sonra /keepwarm sohbeti hazır tutar.`,
  paidCold: (g) => `Claude sohbetin ${g.tokens} token'ını baştan okudu (${g.usd}). Bugün yeniden ödememen için /keepwarm sohbeti hazır tutar.`,
  cap: (pings, output) => `; en fazla ${pings} tazeleme, ${output} tokendan fazlasını yazan tazeleme bunu bitirir`,
  paid: (g) => `Claude sohbetin ${g.tokens} token'ını baştan okudu (${g.usd}). Bugün yeniden ödememen için sohbet ${g.auto} ` + "hazır tutuluyor; durdurmak için /keepwarm off.",
  resume: (tokens, usd) => `artık hazır tutulmayan bir sohbete dönülüyor. İlk mesajla Claude ${tokens} token'ı baştan okur, yaklaşık ${usd}. ` + "Yalnızca sonuçlar gerekiyorsa /clear ile başlayıp bir özet yapıştır.",
  hookTwice: "eski hook sürümü (cache-tax@claude-code-hooks) da kurulu; mesaj iki kez uyarılır ya da " + "bekletilir. Onu kaldır ya da burada /cache-tax guard warn.",
  forkWaits: "keepwarm açık, ama henüz tazelenecek bir sohbet yok; sonraki mesajına kadar tazeleme gitmez. " + "Bir mesaj daha gönder, tazelemeler başlasın.",
  firstTurn: " · ilk tur bekleniyor",
  afterCompact: " · sohbet özetlendikten sonraki ilk tur bekleniyor",
  coldPing: (every) => ` · artık hazır değil; ilk tazeleme sonraki turdan ${every} sonra`,
  pingIn: (left) => ` · tazeleme ${left} sonra`,
  lastPing: (read, usd) => ` · son tazeleme ${read} token okudu, ${usd}`,
  stopped: (why) => `hazır tutma durdu: ${why}`,
  warmFor: (rest) => `hazır tutma: ${rest}`,
  left: (left) => `${left} kaldı`,
  coldNow: (every) => `. Sohbet şu an hazır tutulmuyor; ilk tazeleme sonraki turdan ${every} sonra yapılır`,
  armedCold: (span) => `sohbet ${span} hazır tutulacak`,
  armed: (t) => `sohbet ${t.span} hazır tutulacak: her duraklamada ${t.every} sonra küçük bir tazeleme ` + "onu baştan okutmadan hazır tutar",
  always: (span) => `keepwarm hep açık: her sohbet ${span} hazır tutularak başlar; /keepwarm off kalıcı olarak kapatır`,
  keepwarmCommand: "Aralarda sohbeti hazır tut (cache), sonraki mesaj daha ucuza gelsin: tek başına 6 saat, 90m gibi bir süre, always (ya da always 24h), off ya da status (cache-tax)",
  cacheTaxCommand: "Sohbet hâlâ hazır tutuluyor mu, tutulmuyorsa bir mesaj kaça gelir ve bu sohbette kaç kez baştan okundu; guard warn|refuse (cache-tax)",
  keepwarm: {
    off: "keepwarm kapalı",
    offAlways: "keepwarm kapalı; sohbet başında artık kendiliğinden açılmayacak",
    usage: "keepwarm bir süre alır (6h, 90m) ya da always, off, status",
    every: "every 1m ile 59m arası bir süre alır",
    alwaysUsage: "always 1h ile 168h arası tek bir süre alır, örneğin always 24h"
  },
  guardMode: {
    usage: "/cache-tax guard warn, refuse ya da refuse 5 gibi dolar sınırlı bir refuse alır",
    floor: (usd) => `koruma: ${usd} ve üstüne gelen mesajı bir kez beklet. Daha ucuzu fiyatı gösterilerek geçer`,
    refuse: "koruma: mesajı bir kez beklet. Fiyatıyla bekler, yeniden gönderince geçer",
    warn: "koruma: yalnızca uyar. Mesaj fiyatı gösterilerek geçer"
  },
  labels: { state: "hazır mı", context: "hafıza", cost: "bedel", keepwarm: "keepwarm", even: "değer mi", guard: "koruma", session: "bu sohbet" },
  noModel: "model henüz görülmedi",
  compacted: "sohbet özetlenince baştan başladı, ilk tur bekleniyor",
  noRequest: "bu sohbette henüz bir şey gönderilmedi",
  coldState: (ago) => `HAYIR, Claude'a son çağrı ${ago} önce`,
  warmState: (left) => `evet, ${left} kaldı`,
  context: (tokens) => `${tokens} token`,
  cost: (usd, warm) => `baştan okumak ${usd} (hazırken bir tur ${warm})`,
  on: (line) => `açık, ${line}`,
  stoppedRow: (why) => `durdu, ${why}`,
  offUntilNext: (span) => `sonraki sohbet başına dek kapalı, sonra ${span} açılır (always)`,
  off: (span) => `kapalı (/keepwarm ile ${span} aç)`,
  even: (pings, t) => `${pings} tazeleme, sohbeti bir kez baştan okumakla aynı tutar; ${t.every} arayla tazelersen yaklaşık ${t.span} uzak kalabilirsin`,
  guardRefuse: "bir kez beklet (/cache-tax guard warn ile yalnızca fiyat göster)",
  guardWarn: "yalnızca uyar (/cache-tax guard refuse ile bir kez beklet)",
  guardFloor: (usd) => `${usd} ve üstünde bir kez beklet, altında uyar (/cache-tax guard refuse her birini bekletir)`,
  underFloor: (floor) => ` ${floor} sınırının altında olduğu için bekletilmedi.`,
  session: (count, usd) => `sohbet ${count} kez baştan okundu, ${usd}`,
  unpricedPaid: (usd, count) => `${usd ? `${usd} ve ` : ""}${count} kez fiyatsız`
};

const say = () => pick({ en: EN, tr: TR });
const autoWarm = (s) => fmtDuration(holdMs(s));
const coldFor = (s, now) => now - s.lastRequestAt - TTL_MS;
function rateText(s, model = s.lastModel) {
  const price = priceOf(model, s.ctx);
  return price ? say().perMillion(decimal(price[1])) : say().rateUnknown;
}
function shareText(s, usd) {
  const share = shareOf(s.rate, usd);
  if (share === null)
    return null;
  const percent = share.percent < HALF_POINT ? "<1" : decimal(String(Math.round(share.percent)));
  return say().share(percent, share.isWeekly);
}
const HALF_POINT = 0.5;
function guardText(s, { now, switched }) {
  const model = switched?.to ?? s.lastModel;
  const warm = warmUsd(s, model);
  const usd = coldUsd(s, model);
  const lead = switched ? say().switchLead(modelName(switched.from), modelName(switched.to)) : say().coldLead(fmtDuration(coldFor(s, now)));
  const share = shareText(s, usd);
  return say().guard({ lead, tokens: fmtInt(s.ctx), rate: rateText(s, model), usd: fmtUsd(usd), warm: warm == null ? null : fmtUsd(warm), share });
}
function dropText(s, now) {
  const switched = s.held?.switch ?? null;
  const usd = fmtUsd(coldUsd(s, heldModel(s)));
  if (s.hasBand)
    return switched ? say().dropSwitched(usd) : say().dropHeld(usd);
  return say().drop(guardText(s, { now, switched }));
}
const warnText = (s, cause) => say().warn(guardText(s, cause));
const floorText = (s) => say().underFloor(fmtUsd(s.guardFloor));
function guardSetText(s) {
  if (s.guard === "warn")
    return say().guardMode.warn;
  return s.guardFloor ? say().guardMode.floor(fmtUsd(s.guardFloor)) : say().guardMode.refuse;
}
function guardRow(s) {
  if (s.guard === "warn")
    return say().guardWarn;
  return s.guardFloor ? say().guardFloor(fmtUsd(s.guardFloor)) : say().guardRefuse;
}
const paidText = (s, { tokens, usd, isWarm }) => isWarm ? say().paid({ tokens: fmtTok(tokens), usd: fmtUsd(usd), auto: autoWarm(s) }) : say().paidCold({ tokens: fmtTok(tokens), usd: fmtUsd(usd) });
const capText = () => say().cap(MAX_PINGS, MAX_PING_OUTPUT);
const resumeText = (tokens, usd) => say().resume(fmtInt(tokens), usd);
function nextPingText(s, now) {
  if (!s.lastRequestAt)
    return say().firstTurn;
  if (s.compacted)
    return say().afterCompact;
  if (isCold(s, now))
    return say().coldPing(fmtDuration(s.every));
  if (s.waitForTurn)
    return say().firstTurn;
  return say().pingIn(fmtDuration(s.lastRequestAt + s.every - now));
}
const lastPingText = (s) => s.last ? say().lastPing(fmtTok(s.last.read), fmtUsd(s.last.usd)) : "";
const heldText = (s, now) => `${say().left(fmtDuration(s.deadline - now))}${nextPingText(s, now)}${lastPingText(s)}`;
function statusText(s, now) {
  if (s.stopped)
    return say().stopped(s.stopped);
  if (!s.deadline)
    return;
  return say().warmFor(heldText(s, now));
}
const coldNowText = (s) => say().coldNow(fmtDuration(s.every));
function armedText(s, now, windowMs) {
  const span = fmtDuration(windowMs);
  if (isCold(s, now))
    return `${say().armedCold(span)}${capText()}${coldNowText(s)}`;
  return say().armed({ span, every: fmtDuration(s.every) }) + capText();
}
const alwaysText = (s, now) => say().always(fmtDuration(s.alwaysMs)) + capText() + (isCold(s, now) ? coldNowText(s) : "");
const commands = () => ({
  keepwarm: {
    name: "keepwarm",
    description: say().keepwarmCommand,
    argumentHint: "[6h | always [24h] | off | status]",
    immediate: true
  },
  cacheTax: {
    name: "cache-tax",
    description: say().cacheTaxCommand,
    argumentHint: "[status | guard warn | guard refuse [dollars]]",
    immediate: true
  }
});
const row = (label, value) => `${label.padEnd(12)}${value}`;
function stateRow(s, now) {
  if (s.compacted)
    return say().compacted;
  if (!s.lastRequestAt)
    return say().noRequest;
  if (isCold(s, now))
    return say().coldState(fmtDuration(now - s.lastRequestAt));
  return say().warmState(fmtDuration(s.lastRequestAt + TTL_MS - now));
}
function keepwarmRow$1(s, now) {
  const always = s.always ? " (always)" : "";
  if (s.deadline)
    return `${say().on(heldText(s, now))}${always}${capText()}`;
  if (s.stopped)
    return `${say().stoppedRow(s.stopped)}${always}`;
  return s.always ? say().offUntilNext(fmtDuration(s.alwaysMs)) : say().off(fmtDuration(DEFAULT_WINDOW_MS));
}
function cardText(s, now) {
  const { labels } = say();
  const lines = [s.lastModel ?? say().noModel, row(labels.state, stateRow(s, now)), row(labels.context, say().context(fmtInt(s.ctx)))];
  const hasPrice = s.lastModel === null || priceOf(s.lastModel, s.ctx) !== null;
  lines.push(row(labels.cost, hasPrice ? say().cost(fmtUsd(coldUsd(s)), fmtUsd(warmUsd(s))) : say().noPrice));
  lines.push(row(labels.keepwarm, keepwarmRow$1(s, now)));
  const pings = breakEvenPings(s);
  if (pings != null) {
    lines.push(row(labels.even, say().even(pings, { every: fmtDuration(s.every), span: fmtDuration(pings * s.every) })));
  }
  lines.push(row(labels.guard, guardRow(s)));
  const priced = s.misses.filter((m) => m.usd != null);
  const paid = fmtUsd(priced.reduce((a, m) => a + (m.usd ?? 0), 0));
  const unpriced = s.misses.length - priced.length;
  lines.push(row(labels.session, say().session(s.misses.length, unpriced ? say().unpricedPaid(priced.length ? paid : null, unpriced) : paid)));
  return lines.join(`
`);
}

function temperature(s, now) {
  if (!s.lastRequestAt || s.compacted)
    return "unknown";
  return isCold(s, now) ? "cold" : "warm";
}
function keepwarmRow(s, now) {
  const line = statusText(s, now);
  if (line === undefined || s.deadline && now >= s.deadline)
    return null;
  if (s.stopped)
    return { state: "stopped", detail: [line] };
  return { state: temperature(s, now), detail: line.split(" · ") };
}
function rowOf(s, now) {
  if (isHoldShown(s, now))
    return null;
  if (s.deadline || s.stopped)
    return keepwarmRow(s, now);
  if (s.ctx < BIG_TOKENS)
    return null;
  if (isCold(s, now)) {
    return { state: "cold", detail: [bandWords().coldAgo(fmtDuration(coldFor(s, now))), bandWords().nextUpTo(fmtUsd(coldUsd(s)))] };
  }
  const left = untilCold(s, now);
  if (left === null || left > SOON_MS)
    return null;
  return { state: "warm", detail: [bandWords().goesCold(fmtDuration(left)), bandWords().keepWarm] };
}
function bandKey(s, now) {
  const hold = isHoldShown(s, now) ? `${s.held?.switch?.to ?? ""}:${fmtDuration(coldFor(s, now))}` : "";
  return `${hold}|${JSON.stringify(rowOf(s, now))}`;
}
const SEP = " · ";
const ROW_CHROME = 18;
function fitDetail(row, columns) {
  const room = columns - ROW_CHROME - bandWords().states[row.state].length;
  const kept = [];
  for (const part of row.detail) {
    if ([...kept, part].join(SEP).length > room && kept.length > 0)
      break;
    kept.push(part);
  }
  return kept.join(SEP);
}
const CUBE_PX = 16;
function lidOf(state, isLight) {
  const p = palette(isLight);
  if (state === "warm")
    return p.role.ok.fg;
  return state === "cold" ? p.role.warn.fg : p.lo;
}
function rowDesktop(ui, o) {
  const { Box, Svg, Text } = ui;
  const p = palette(o.isLight);
  const color = o.noColor || o.row.state === "unknown" || o.row.state === "stopped" ? undefined : lidOf(o.row.state, o.isLight);
  const icon = o.noColor ? Text({ bold: true, children: ["[>]"] }) : Svg({ source: doc({ width: CUBE_PX, height: CUBE_PX }, cube({ x: 0, y: 0, size: CUBE_PX }, { lid: lidOf(o.row.state, o.isLight), outline: p.hi })), alt: "Cache Tax", width: CUBE_PX, height: CUBE_PX });
  return Box({ key: "cache-tax:row", flexDirection: "row", alignItems: "center", gap: 1, children: [
    Box({ flexShrink: 0, children: [icon] }),
    Text({ color: o.noColor ? undefined : p.mid, wrap: "truncate-end", children: [
      bandWords().cache,
      Text({ color, bold: true, children: [bandWords().states[o.row.state]] }),
      `${SEP}${fitDetail(o.row, o.columns)}`
    ] })
  ] });
}
const IMAGE_CELLS = 3;
function terminalColor(state, noColor) {
  if (noColor)
    return;
  if (state === "warm")
    return TERMINAL.ok;
  return state === "cold" ? TERMINAL.warn : undefined;
}
function rowTerminal(ui, o) {
  const { Box, Image, Text } = ui;
  const variant = statusIcons[o.isLight ? "light" : "dark"];
  const asset = o.row.state === "warm" || o.row.state === "cold" ? variant[o.row.state] : variant.neutral;
  const icon = o.noColor ? Text({ bold: true, children: ["[>]"] }) : Image({ source: { png: asset.png }, columns: IMAGE_CELLS, rows: 1, alt: "[>]" });
  return Box({ key: "cache-tax:row", flexDirection: "row", alignItems: "center", children: [
    Box({ flexShrink: 0, children: [icon] }),
    Text({ wrap: "truncate-end", children: [
      ` ${bandWords().cache}`,
      Text({ color: terminalColor(o.row.state, o.noColor), bold: true, children: [bandWords().states[o.row.state]] }),
      `${SEP}${fitDetail(o.row, o.columns)}`
    ] })
  ] });
}

function reasonOf(s, now) {
  const switched = s.held?.switch;
  if (switched)
    return bandWords().switched(modelName(switched.from), modelName(switched.to));
  return [bandWords().wentCold(fmtDuration(coldFor(s, now)))];
}
function holdView(s, now) {
  const model = heldModel(s);
  return {
    held: s.held?.text ?? "",
    reason: reasonOf(s, now),
    tokens: fmtInt(s.ctx),
    coldUsd: coldUsd(s, model),
    warmUsd: warmUsd(s, model),
    rate: rateText(s, model),
    autoWarm: autoWarm(s),
    share: shareText(s, coldUsd(s, model))
  };
}
function holdCard(d, b) {
  if (!isHoldShown(b.s, b.now))
    return null;
  const options = { view: holdView(b.s, b.now), actions: b.actions, ...b.prefs, columns: b.columns };
  return d.surface === "desktop" ? holdDesktop(d.ui, options) : holdTerminal(d.ui, options);
}
function statusRow(d, b) {
  const row = rowOf(b.s, b.now);
  if (row === null)
    return null;
  const options = { row, ...b.prefs, columns: b.columns };
  return d.surface === "desktop" ? rowDesktop(d.ui, options) : rowTerminal(d.ui, options);
}
function composeBand(d, theirs, b) {
  const above = holdCard(d, b);
  const below = statusRow(d, b);
  if (above === null && below === null)
    return theirs;
  return d.ui.Box({ flexDirection: "column", gap: above === null ? 0 : 1, children: [above, theirs, below] });
}

const NAME = "cache-tax";
const UNATTENDED = new Set(["task-notification", "scheduled-trigger", "peer", "peer-send-message", "projects-relay", "coordinator", "observer", "observer-activity"]);
const ACK_SLACK_MS = 60 * 1000;
const ackedKey = (s) => `acked:${s.sid}`;
async function isAcked(io, s) {
  if (s.ackedAt === s.lastRequestAt)
    return true;
  const acked = await io.get(ackedKey(s));
  return typeof acked === "number" && s.lastResponseAt > 0 && Math.abs(acked - s.lastResponseAt) < ACK_SLACK_MS;
}
async function switchNow(io, s) {
  if (!s.cacheModel)
    return null;
  return switchOf(s.cacheModel, await io.model());
}
function release(io, s) {
  if (s.held && s.hasBand)
    io.redraw();
  s.held = null;
}
async function ownResend(io, s, { e, next }) {
  if (e.origin.kind === "plugin" && e.origin.name === NAME && e.text === s.resend) {
    s.resend = null;
    s.coldWritePending = true;
    await io.del(ackedKey(s));
  }
  return next(e);
}
async function onPrompt(io, s, { e, next }) {
  if (e.origin.kind === "plugin")
    return ownResend(io, s, { e, next });
  if (typeof e.text !== "string" || e.text.trimStart().startsWith("/") || s.ctx < BIG_TOKENS)
    return next(e);
  const now = await io.now();
  const switched = await switchNow(io, s);
  if (!switched && !isCold(s, now)) {
    if (s.held?.switch)
      release(io, s);
    return next(e);
  }
  const isUnattended = UNATTENDED.has(e.origin.kind);
  const usd = coldUsd(s, switched?.to ?? s.lastModel);
  const isUnderFloor = s.guard === "refuse" && usd !== null && usd < s.guardFloor;
  const isShown = s.guard === "warn" || isUnattended || isUnderFloor;
  if (isShown || await isAcked(io, s)) {
    if (isShown)
      io.log(warnText(s, { now, switched }) + (isUnderFloor ? floorText(s) : ""));
    s.ackedAt = 0;
    s.coldWritePending = true;
    release(io, s);
    await io.del(ackedKey(s));
    return next(e);
  }
  s.ackedAt = s.lastRequestAt;
  if (s.lastResponseAt)
    await io.set(ackedKey(s), s.lastResponseAt);
  s.held = { text: e.text, at: now, switch: switched };
  if (s.hasBand)
    io.redraw();
  return { drop: dropText(s, now) };
}

const FIRST_PINNED = 1e9;
const pins = new Map;
function handleFor(id) {
  let handle = pins.get(id);
  if (handle === undefined) {
    handle = FIRST_PINNED + pins.size;
    pins.set(id, handle);
  }
  return handle;
}
const UNDRAWABLE = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f\ud800-\udfff\u{10eeee}]/gu;
const drawable = (text) => text.replace(UNDRAWABLE, "");
function drawableProps(el) {
  const props = el.props;
  if (typeof props !== "object" || props === null)
    return el;
  const cleaned = Object.entries(props).filter(([name, value]) => name !== "key" && typeof value === "string" && drawable(value) !== value);
  if (cleaned.length === 0)
    return el;
  return { ...el, props: { ...props, ...Object.fromEntries(cleaned.map(([name, value]) => [name, drawable(value)])) } };
}
function pinNode(node, ctx) {
  if (typeof node === "string")
    return drawable(node);
  if (typeof node !== "object" || node === null)
    return node;
  const el = drawableProps(node);
  const children = el.children?.map((child) => pinNode(child, ctx));
  const withKids = children === undefined ? el : { ...el, children };
  if (el.press?.plugin !== "" || typeof el.props?.key !== "string")
    return withKids;
  const base = `${ctx.site}\x00${el.type}\x00${el.props.key}`;
  const nth = ctx.seen.get(base) ?? 0;
  ctx.seen.set(base, nth + 1);
  return { ...withKids, press: { plugin: "", handle: handleFor(`${base}\x00${nth}`) } };
}
function pinned(site, tree) {
  if (tree === null || tree === undefined)
    return tree;
  const ctx = { site: `${site.surface}\x00${site.component ?? ""}\x00${site.requestId ?? ""}`, seen: new Map };
  return pinNode(tree, ctx);
}

function actions($, s) {
  const release = () => {
    const held = s.held;
    s.held = null;
    $.ui.invalidate("ui.render");
    return held;
  };
  return {
    pay: () => void (async () => {
      const held = release();
      if (!held)
        return;
      s.resend = held.text;
      s.isWarmAfterPay = true;
      await $.prompt.submit({ text: held.text, asUser: true });
    })(),
    fresh: () => void (async () => {
      const held = release();
      await $.command.run({ command: "clear" });
      if (held)
        await $.prompt.fill({ text: held.text });
    })(),
    status: () => void $.command.run({ command: NAME })
  };
}
function wireBand(on, c) {
  const { s } = c;
  on("config.set", { key: "theme" }, async ($, e, next) => {
    const result = await next(e);
    if (result.deny === undefined) {
      c.prefs.isLight = isLightTheme(result.value);
      if (s.hasBand)
        $.ui.invalidate("ui.render");
    }
    return result;
  });
  on("ui.render", { component: "AbovePrompt" }, async ($, e, next) => {
    const theirs = await next(e);
    if (!s.hasBand || e.props.hasSurvey)
      return theirs;
    const band = { s, prefs: c.prefs, actions: actions($, s), columns: e.props.bodyColumns, now: await $.clock.now() };
    if (e.surface === "desktop")
      return pinned(e, composeBand({ surface: "desktop", ui: $.ui.resolve(e) }, theirs, band));
    if (e.surface === "terminal")
      return pinned(e, composeBand({ surface: "terminal", ui: $.ui.resolve(e) }, theirs, band));
    return theirs;
  });
}

const isFloor = (n) => typeof n === "number" && Number.isFinite(n) && n > 0;
function guardFromStore(value) {
  if (value === "refuse")
    return { guard: "refuse", guardFloor: 0 };
  return isFloor(value) ? { guard: "refuse", guardFloor: value } : { guard: "warn", guardFloor: 0 };
}
const storedGuard = (s) => s.guard === "warn" ? "warn" : s.guardFloor || "refuse";
function parseGuard(rest) {
  if (rest[0] === "warn" && rest.length === 1)
    return { guard: "warn", guardFloor: 0 };
  if (rest[0] !== "refuse" || rest.length > 2)
    return null;
  if (rest.length === 1)
    return { guard: "refuse", guardFloor: 0 };
  const floor = Number((rest[1] ?? "").replace(/^\$/, ""));
  return isFloor(floor) ? { guard: "refuse", guardFloor: floor } : null;
}

function toneOf(s, now) {
  const left = untilCold(s, now);
  return isCold(s, now) || left !== null && left <= SOON_MS ? "warn" : "neutral";
}
function cacheSection(s, now) {
  const base = { id: "cache", title: bandWords().section, at: 0 };
  if (!s.lastRequestAt && !s.deadline)
    return { ...base, lines: [bandWords().sectionEmpty], tone: "neutral", isEmpty: true };
  const rows = cardText(s, now).split(`
`).map((row) => row.replace(/ {2,}/, " · "));
  return { ...base, lines: [...rows, bandWords().listPrice], tone: toneOf(s, now) };
}

const SECOND_MS = 1000;
function seedFromResume(s, e, now) {
  if (e.source !== "resume" && e.source !== "fork")
    return null;
  if (typeof e.context_tokens === "number" && e.context_tokens > 0)
    s.ctx = e.context_tokens;
  if (typeof e.seconds_since_last_response === "number") {
    s.lastRequestAt = now - e.seconds_since_last_response * SECOND_MS;
    s.lastResponseAt = s.lastRequestAt;
  }
  if (typeof e.model === "string")
    s.lastModel = e.model;
  s.compacted = false;
  if (e.prompt_cache_likely_expired !== true || s.ctx < BIG_TOKENS)
    return null;
  const usd = typeof e.estimated_cache_write_usd === "number" ? fmtUsd(e.estimated_cache_write_usd) : fmtUsd(coldUsd(s));
  return resumeText(s.ctx, usd);
}

const KEY_DEADLINE = "deadline";
const KEY_EVERY = "every";
const KEY_GUARD = "guard";
const KEY_ALWAYS = "always";
const MIN_DELAY_MS = 1000;
const MAX_RETRIES = 3;
const BROKEN_SHARE = 0.1;
const deadlineKey = (s) => `${KEY_DEADLINE}:${s.sid}`;
const everyKey = (s) => `${KEY_EVERY}:${s.sid}`;
function refreshLine(io, s, now) {
  if (s.deadline > now && !s.refresh) {
    const refresh = io.every(MIN_MS, () => void io.now().then((at) => {
      if (s.refresh === refresh)
        updateStatus(io, s, at);
    }));
    s.refresh = refresh;
  } else if (s.deadline <= now && s.refresh) {
    s.refresh.cancel();
    s.refresh = null;
  }
}
function updateStatus(io, s, now) {
  if (s.hasBand)
    return io.redraw();
  refreshLine(io, s, now);
  const text = statusText(s, now);
  if (text === undefined && !s.hasStatus)
    return;
  s.hasStatus = text !== undefined;
  io.status(text);
}
const STALE_MS = 24 * HOUR_MS;
async function prune(io, s, now) {
  const own = new Set([KEY_DEADLINE, deadlineKey(s)]);
  for (const key of await io.keys()) {
    if (key !== KEY_DEADLINE && !key.startsWith(`${KEY_DEADLINE}:`))
      continue;
    const deadline = await io.get(key);
    const lapsedBy = typeof deadline === "number" && deadline > 0 ? now - deadline : Number.POSITIVE_INFINITY;
    if (lapsedBy < (own.has(key) ? 0 : STALE_MS))
      continue;
    await io.del(key);
    await io.del(KEY_EVERY + key.slice(KEY_DEADLINE.length));
  }
}
async function halt(io, s, end) {
  s.deadline = 0;
  s.every = PING_AFTER_MS;
  s.stopped = end.why;
  disarm(s);
  await io.del(deadlineKey(s));
  await io.del(everyKey(s));
  if (end.isForgettingAlways) {
    s.always = false;
    await io.del(KEY_ALWAYS);
  }
  updateStatus(io, s, await io.now());
}
const stop = (io, s, why) => halt(io, s, { why, isForgettingAlways: false });
const stopForGood = (io, s) => halt(io, s, { why: null, isForgettingAlways: true });
async function arm(io, s) {
  disarm(s);
  s.retries = 0;
  if (!s.deadline)
    return;
  const now = await io.now();
  if (now >= s.deadline)
    return stop(io, s, null);
  if (s.lastRequestAt && !s.compacted && !s.waitForTurn && !isCold(s, now)) {
    const untilCold = s.lastRequestAt + TTL_MS - now;
    const delay = Math.min(s.deadline - now, untilCold, Math.max(MIN_DELAY_MS, s.lastRequestAt + s.every - now));
    s.pending = io.after(delay, () => {
      ping(io, s);
    });
  } else {
    s.pending = io.after(s.deadline - now, () => {
      arm(io, s);
    });
  }
  updateStatus(io, s, now);
}
function failureText(reply) {
  if (reply === null)
    return bandWords().noPing;
  if (reply.isAnswered !== false)
    return null;
  if (reply.reason === "nothing-to-fork")
    return bandWords().nothingToFork;
  if (reply.reason === "api-error")
    return bandWords().apiError(reply.status === null ? "" : ` (${reply.status})`);
  return reply.reason === "aborted" ? bandWords().aborted : bandWords().noText;
}
async function isRetried(io, s, reply) {
  if (reply.reason === "nothing-to-fork") {
    if (!s.waitForTurn)
      io.log(say().forkWaits);
    s.waitForTurn = true;
    await arm(io, s);
    return true;
  }
  const isBusy = reply.reason === "api-error" && (reply.status === null || reply.status === 429 || reply.status >= 500);
  const wait = MIN_PING_MS * 2 ** s.retries;
  const now = await io.now();
  if (!isBusy || s.retries >= MAX_RETRIES || now + wait >= Math.min(s.deadline, s.lastRequestAt + TTL_MS - MIN_PING_MS))
    return false;
  s.retries++;
  disarm(s);
  s.pending = io.after(wait, () => {
    ping(io, s);
  });
  return true;
}
async function ping(io, s) {
  s.pending = null;
  if (!s.deadline)
    return;
  const now = await io.now();
  if (now >= s.deadline)
    return arm(io, s);
  if (isCold(s, now) || s.waitForTurn)
    return arm(io, s);
  if (now - s.lastRequestAt < s.every - MIN_DELAY_MS)
    return arm(io, s);
  if (s.retries && now >= s.lastRequestAt + TTL_MS - MIN_PING_MS)
    return stop(io, s, bandWords().apiError(""));
  if (s.pings >= MAX_PINGS)
    return stop(io, s, bandWords().capReached(MAX_PINGS));
  s.pings++;
  const sentAt = s.lastRequestAt;
  let reply;
  try {
    reply = await io.fork(PING_PROMPT);
  } catch (err) {
    return stop(io, s, bandWords().pingFailed(err instanceof Error ? err.message : String(err)));
  }
  if (s.lastRequestAt !== sentAt)
    return;
  if (reply?.isAnswered === false && await isRetried(io, s, reply))
    return;
  const failure = failureText(reply);
  if (failure !== null || reply === null || reply.isAnswered === false)
    return stop(io, s, failure);
  s.retries = 0;
  const u = reply.usage;
  const price = priceOf(s.lastModel, u.input_tokens + u.cache_read_input_tokens + u.cache_creation_input_tokens);
  const warm = u.cache_read_input_tokens > 0 && u.cache_creation_input_tokens < BROKEN_SHARE * u.cache_read_input_tokens;
  const usd = price ? pingUsd(u, price) : null;
  s.last = { at: now, read: u.cache_read_input_tokens, write: u.cache_creation_input_tokens, usd, warm };
  if (!warm) {
    return stop(io, s, bandWords().gone({ read: fmtTok(u.cache_read_input_tokens), wrote: fmtTok(u.cache_creation_input_tokens), usd: fmtUsd(usd) }));
  }
  if (u.output_tokens > MAX_PING_OUTPUT)
    return stop(io, s, bandWords().tooLong(u.output_tokens));
  s.lastRequestAt = now;
  await arm(io, s);
}
async function scoreMiss(io, s, { now, write }) {
  const price = priceOf(s.lastModel, s.ctx);
  const usd = price ? write * price[1] / 1e6 : null;
  s.misses.push({ at: now, tokens: write, usd });
  if (s.always || s.deadline >= now + AUTO_WARM_MS)
    return;
  if (s.isWarmAfterPay)
    await startWindow(io, s, { windowMs: AUTO_WARM_MS, every: s.every });
  io.log(paidText(s, { tokens: write, usd, isWarm: s.isWarmAfterPay }));
}
async function startWindow(io, s, span) {
  const { windowMs, every } = span;
  const now = await io.now();
  s.every = every;
  if (every === PING_AFTER_MS)
    await io.del(everyKey(s));
  else
    await io.set(everyKey(s), every);
  s.deadline = now + windowMs;
  s.stopped = null;
  s.pings = 0;
  await io.set(deadlineKey(s), s.deadline);
  await arm(io, s);
}

function io($) {
  return {
    now: () => $.clock.now(),
    after: (ms, fn) => $.clock.after(ms, fn),
    every: (ms, fn) => $.clock.every(ms, fn),
    fork: (prompt) => $.model.fork({ prompt }),
    get: (key) => $.store.get(key),
    keys: () => $.store.keys(),
    set: (key, value) => $.store.set(key, value),
    del: (key) => $.store.delete(key),
    redraw: () => $.ui.invalidate("ui.render"),
    status: (text) => $.ui.status(text),
    log: (text) => $.ui.log(text)
  };
}
const guardIo = ($) => ({ ...io($), model: () => $.session.model() });
async function publish($, c) {
  const section = cacheSection(c.s, await $.clock.now());
  const said = JSON.stringify(section);
  if (said === c.section)
    return;
  c.section = said;
  await $.state.set({ plugin: "cache-tax", key: "section" }, section);
}
async function openUsage($) {
  if ((await $.state.get({ plugin: "hud-pro", key: "host" })).value !== true)
    return;
  await $.state.set({ plugin: "cache-tax", key: "openUsage" }, { section: "cache", at: await $.clock.now() });
}
function tick($, c, now) {
  publish($, c).catch(() => $.ui.log("cache-tax: the Usage section was not written"));
  const key = bandKey(c.s, now);
  if (key === c.drawn)
    return;
  c.drawn = key;
  $.ui.invalidate("ui.render");
}
async function readPrefs($, prefs) {
  const theme = (await $.config.list()).find((row) => row.key === "theme")?.value;
  prefs.isLight = isLightTheme(theme);
  prefs.noColor = Boolean(await $.env.get("NO_COLOR"));
}
const isPingPeriod = (ms) => typeof ms === "number" && ms >= MIN_PING_MS && ms < TTL_MS;
const openAlways = ($, s) => startWindow(io($), s, { windowMs: s.alwaysMs, every: PING_AFTER_MS });
async function restore($, s, now) {
  await prune(io($), s, now);
  const saved = await $.store.get(deadlineKey(s));
  const savedEvery = await $.store.get(everyKey(s));
  s.deadline = typeof saved === "number" && saved > now ? saved : 0;
  s.every = isPingPeriod(savedEvery) ? savedEvery : PING_AFTER_MS;
  Object.assign(s, guardFromStore(await $.store.get(KEY_GUARD)));
  const stored = alwaysWindow(await $.store.get(KEY_ALWAYS));
  s.always = stored > 0;
  if (stored)
    s.alwaysMs = stored;
  if (s.always)
    await openAlways($, s);
  const usage = await $.session.usage();
  if (usage.context.tokens)
    s.ctx = usage.context.tokens;
}
async function registerCommands($) {
  const specs = commands();
  await $.command.register(specs.keepwarm);
  await $.command.register(specs.cacheTax);
  if ((await $.command.list()).some((cmd) => cmd.name === "cache-tax:status"))
    $.ui.log(say().hookTwice);
}
async function onAlways($, s, { words, now }) {
  const windowMs = parseAlways(words.slice(1));
  if (!windowMs)
    return say().keepwarm.alwaysUsage;
  s.always = true;
  s.alwaysMs = windowMs;
  await $.store.set(KEY_ALWAYS, windowMs === DEFAULT_WINDOW_MS ? true : windowMs);
  await openAlways($, s);
  return alwaysText(s, now);
}
async function onKeepwarm($, s, args) {
  const words = args.trim().split(/\s+/).filter(Boolean);
  const now = await $.clock.now();
  if (words[0] === "off") {
    const wasAlways = s.always;
    await stopForGood(io($), s);
    return wasAlways ? say().keepwarm.offAlways : say().keepwarm.off;
  }
  if (words[0] === "always")
    return onAlways($, s, { words, now });
  if (words[0] === "status")
    return statusText(s, now) ?? say().keepwarm.off;
  const window = words.length ? parseDuration(words[0] ?? "") : DEFAULT_WINDOW_MS;
  if (!window)
    return say().keepwarm.usage;
  let every = PING_AFTER_MS;
  if (words[1] === "every") {
    const period = parseDuration(words[2] ?? "");
    if (!isPingPeriod(period))
      return say().keepwarm.every;
    every = period;
  }
  await startWindow(io($), s, { windowMs: window, every });
  return armedText(s, now, window);
}
async function onCacheTax($, s, args) {
  const words = args.trim().split(/\s+/).filter(Boolean);
  if (words[0] !== "guard") {
    await openUsage($);
    return cardText(s, await $.clock.now());
  }
  const setting = parseGuard(words.slice(1));
  if (!setting)
    return say().guardMode.usage;
  Object.assign(s, setting);
  await $.store.set(KEY_GUARD, storedGuard(s));
  return guardSetText(s);
}
async function onTurnComplete($, s, e) {
  const now = await $.clock.now();
  if (s.deadline && now >= s.deadline)
    await stop(io($), s, null);
  if (now - s.lastRequestAt > e.durationMs)
    s.lastRequestAt = now;
  if (e.usage || !e.isAborted && e.reason !== "error")
    s.lastResponseAt = now;
  s.compacted = false;
  s.waitForTurn = false;
  s.ackedAt = 0;
  s.held = null;
  const u = e.usage;
  if (u) {
    if (u.model)
      s.lastModel = u.model;
    const prev = s.ctx;
    const write = u.cache_creation_input_tokens;
    const reading = await $.session.usage();
    s.rate = trackRate(s.rate, reading.rateLimits, reading.cost?.usd);
    const live = reading.context.tokens;
    s.ctx = live && live > 0 ? live : u.input_tokens + u.cache_read_input_tokens + write;
    if (isFullMiss(prev, s.largestWrite ?? write) || s.coldWritePending)
      await scoreMiss(io($), s, { now, write });
  }
  s.coldWritePending = false;
  s.isWarmAfterPay = false;
  s.largestWrite = null;
  if (s.always)
    await openAlways($, s);
  else
    await arm(io($), s);
}
function wireSession(on, c) {
  const { s } = c;
  on("session.start", async ($, e, next) => {
    setLang(await $.env.get("MODZ_LANG").catch(() => {
      return;
    }));
    const r = await next(e);
    s.hasBand = e.surface === "terminal" || e.surface === "desktop";
    if (s.hasBand) {
      await readPrefs($, c.prefs);
      $.clock.every(MIN_MS, () => void $.clock.now().then((now) => tick($, c, now)));
    }
    s.sid = await $.session.id();
    const now = await $.clock.now();
    await restore($, s, now);
    await registerCommands($);
    updateStatus(io($), s, now);
    await publish($, c);
    return r;
  });
  on("classic.SessionStart", async ($, e, next) => {
    const r = await next(e);
    if (e.source === "clear") {
      await stop(io($), s, null);
      await $.store.delete(ackedKey(s));
      resetForClear(s);
      s.sid = await $.session.id();
      if (s.always)
        await openAlways($, s);
      else
        updateStatus(io($), s, await $.clock.now());
      await publish($, c);
      return r;
    }
    const line = seedFromResume(s, e, await $.clock.now());
    if (!s.lastModel)
      s.lastModel = await $.session.model();
    if (line)
      $.ui.log(line);
    await arm(io($), s);
    return r;
  });
}
function wireCommands(on, c) {
  const { s } = c;
  on("command.run", { command: "keepwarm" }, async ($, e) => {
    const text = await onKeepwarm($, s, String(e.args ?? ""));
    await publish($, c);
    return { text };
  });
  on("command.run", { command: NAME }, async ($, e) => {
    const text = await onCacheTax($, s, String(e.args ?? ""));
    await publish($, c);
    return { text };
  });
}
function wireTurns(on, c) {
  const { s } = c;
  on("prompt.submit", ($, e, next) => onPrompt(guardIo($), s, { e, next }));
  on("turn.step", async function* ($, e, next) {
    if (!e.agentId) {
      s.lastRequestAt = await $.clock.now();
      s.cacheModel = e.model;
    }
    const r = yield* next(e);
    if (!e.agentId && r.usage)
      s.largestWrite = Math.max(s.largestWrite ?? 0, r.usage.cache_creation_input_tokens);
    return r;
  });
  on("turn.complete", async ($, e, next) => {
    const r = await next(e);
    if (!e.agentId) {
      await onTurnComplete($, s, e);
      await publish($, c);
    }
    return r;
  });
  on("session.compact", async ($, e, next) => {
    const r = await next(e);
    if (!e.agentId) {
      s.compacted = true;
      s.ctx = 0;
      s.ackedAt = 0;
      s.held = null;
      await arm(io($), s);
      await publish($, c);
    }
    return r;
  });
}
const register = (on) => {
  const c = { s: freshState(), prefs: { isLight: false, noColor: false }, drawn: "", section: "" };
  wireBand(on, c);
  wireSession(on, c);
  wireCommands(on, c);
  wireTurns(on, c);
};

export { fmtDuration, freshState, parseDuration, register, resetForClear, seedFromResume };
