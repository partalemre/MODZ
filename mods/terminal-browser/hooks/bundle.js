// Built by `bin/modz build` from the files beside it. Never edited by hand.
const isRecord = (value) => typeof value === "object" && value !== null;
const isFrame = (value) => isRecord(value) && typeof value.shm === "string" && (value.format === "rgba" || value.format === "rgb") && Number.isInteger(value.width) && Number.isInteger(value.height) && Number.isInteger(value.generation) && Number.isInteger(value.cols) && Number.isInteger(value.rows);
const isBridgeState = (value) => isRecord(value) && Number.isInteger(value.version) && typeof value.alive === "boolean" && ("frame" in value) && (value.frame === null || isFrame(value.frame));
const isLaunchReport = (value) => isRecord(value) && (typeof value.port === "number" || typeof value.error === "string");
const isSizeMessage = (data) => isRecord(data) && data.type === "size" && Number.isInteger(data.cols) && Number.isInteger(data.rows);
const isInputMessage = (data) => isRecord(data) && data.type === "input" && Array.isArray(data.events);
const isAgentText = (value) => isRecord(value) && typeof value.text === "string" && (value.screenshot === null || typeof value.screenshot === "string");
const takenItems = (value) => isRecord(value) && Array.isArray(value.items) ? value.items.filter(isAgentText) : [];

const PANE$1 = "browser";
const IMAGE_KEY = "view";
const START_URL$1 = "terminal-browser://start";
const state = {
  port: null,
  token: null,
  open: false,
  pendingUrl: null,
  requestedUrl: null,
  region: null,
  last: null,
  frame: null,
  mounted: null,
  watcher: 0,
  viewGeneration: 0,
  isOffTerminal: false
};
const bridgeUrl = (path) => `http://127.0.0.1:${state.port}${path}`;
const authHeaders = () => ({ authorization: `Bearer ${state.token}` });
const viewKey = () => `view${state.viewGeneration}`;

let current = "en";
const langOf = (value) => typeof value === "string" && /^tr/i.test(value.trim()) ? "tr" : "en";
function setLang(value) {
  current = langOf(value);
  return current;
}
const pick = (table) => table[current];

const EN = {
  command: "Opens a browser on the right",
  closed: "Browser closed",
  alreadyClosed: "The browser is already closed",
  opened: "Browser opened",
  startPage: "Start page",
  paneTitle: "Browser",
  eyebrow: "Browser",
  loading: "Loading the page…",
  died: "The browser closed",
  retry: "Try again with /browser · /browser close closes it",
  terminalOnly: "terminal-browser runs only in the terminal",
  upgrade: "This needs a newer terminal-browser: run terminal-browser upgrade",
  install: "Install terminal-browser first",
  noStart: "terminal-browser could not start",
  lost: "The terminal-browser connection was lost"
};
const TR = {
  command: "Sağda bir tarayıcı açar",
  closed: "Tarayıcı kapatıldı",
  alreadyClosed: "Tarayıcı zaten kapalı",
  opened: "Tarayıcı açıldı",
  startPage: "Başlangıç sayfası",
  paneTitle: "Tarayıcı",
  eyebrow: "Tarayıcı",
  loading: "Sayfa yükleniyor…",
  died: "Tarayıcı kapandı",
  retry: "/browser ile yeniden dene · /browser close kapatır",
  terminalOnly: "terminal-browser yalnızca terminalde çalışır",
  upgrade: "Daha yeni bir terminal-browser gerekiyor: terminal-browser upgrade çalıştır",
  install: "Önce terminal-browser'ı kur",
  noStart: "terminal-browser başlatılamadı",
  lost: "terminal-browser bağlantısı koptu"
};
const word = (key) => pick({ en: EN, tr: TR })[key];
function openedText(url, isStart) {
  const startPage = pick({ en: "start page", tr: "başlangıç sayfası" });
  return `${word("opened")}: ${isStart ? startPage : url}`;
}

function forgetBridge(cause) {
  state.port = null;
  state.token = null;
  state.last = state.last === null ? null : { ...state.last, alive: false, error: `${word("lost")}: ${String(cause)}` };
}
async function post(host, path, body) {
  if (state.port === null)
    return null;
  try {
    const response = await host.fetch(bridgeUrl(path), {
      method: "POST",
      headers: { "content-type": "application/json", ...authHeaders() },
      body: JSON.stringify(body)
    });
    return response.ok ? JSON.parse(response.text || "{}") : null;
  } catch {
    return null;
  }
}
async function fetchState(host, version) {
  if (state.port === null)
    return null;
  try {
    const response = await host.fetch(bridgeUrl(`/state?version=${version}`), { headers: authHeaders() });
    const parsed = response.ok ? JSON.parse(response.text) : null;
    return isBridgeState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

const MAX_IMAGE_CELLS = 255;

function paneStatus() {
  const last = state.last;
  return { url: state.requestedUrl ?? last?.url ?? null, error: last?.error ?? null, isAlive: last === null ? null : last.alive };
}
function imageSource(frame) {
  return { shm: frame.shm, format: frame.format, width: frame.width, height: frame.height, generation: frame.generation };
}
function imageGrid(frame, cols, rows) {
  return {
    cols: Math.max(1, Math.min(frame.cols, cols, MAX_IMAGE_CELLS)),
    rows: Math.max(1, Math.min(frame.rows, rows, MAX_IMAGE_CELLS))
  };
}
function fitsMounted(frame) {
  const mounted = state.mounted;
  if (!mounted || !state.region)
    return false;
  const grid = imageGrid(frame, state.region.cols, state.region.rows);
  return grid.cols === mounted.cols && grid.rows === mounted.rows;
}

async function deliverAgentText(host) {
  const oneLine = (text) => text.replace(/[\x00-\x1f\x7f-\x9f]/g, " ").replace(/\s+/g, " ").trim();
  const lines = takenItems(await post(host, "/inbox/take", {})).filter((item) => item.text.trim() !== "").flatMap((item) => [oneLine(item.text), ...item.screenshot ? [oneLine(item.screenshot)] : []]);
  if (lines.length === 0)
    return;
  const { isFilled } = await host.fill({ text: `${lines.join(`
`)}
` });
  if (!isFilled) {
    return;
  }
  state.viewGeneration += 1;
  host.redraw();
}

const WATCH_RETRY_MS = 250;
const DENIED_REDRAW_MS = 500;
const DENIALS_BEFORE_LOGGING = 3;
const TITLE_MAX_CHARS = 40;
async function refreshPane(host, previous, fresh) {
  const pictureGone = fresh.frame === null && state.frame !== null;
  if (pictureGone)
    state.frame = null;
  const paneChanged = !previous || pictureGone || previous.title !== fresh.title || previous.alive !== fresh.alive || previous.error !== fresh.error;
  if (paneChanged) {
    host.redraw();
    if (fresh.title)
      await host.open({ id: PANE$1, title: fresh.title.slice(0, TITLE_MAX_CHARS) });
  }
}
async function drawFrame(host, frame, denials) {
  const result = await host.blit({ requestId: PANE$1, key: IMAGE_KEY, source: imageSource(frame) });
  if (!result.deny) {
    denials.count = 0;
    return;
  }
  denials.count += 1;
  if (denials.count === DENIALS_BEFORE_LOGGING)
    host.log(`terminal-browser: a frame draw was refused: ${result.deny}`);
  const now = Date.now();
  if (now - denials.lastRedraw >= DENIED_REDRAW_MS) {
    denials.lastRedraw = now;
    host.redraw();
  }
}
async function watchBridge(host) {
  const watcher = ++state.watcher;
  const live = () => state.watcher === watcher && state.port !== null;
  let version = -1;
  const denials = { count: 0, lastRedraw: 0 };
  while (live()) {
    const fresh = await fetchState(host, version);
    if (!live())
      return;
    if (!fresh) {
      await host.sleep(WATCH_RETRY_MS);
      continue;
    }
    version = fresh.version;
    const previous = state.last;
    state.last = fresh;
    if (fresh.inbox > 0)
      await deliverAgentText(host);
    if (!state.open)
      continue;
    await refreshPane(host, previous, fresh);
    const frame = fresh.frame;
    if (!frame || frame.generation === state.frame?.generation)
      continue;
    state.frame = frame;
    if (!fitsMounted(frame)) {
      host.redraw();
      continue;
    }
    await drawFrame(host, frame, denials);
  }
}

const INSTALL_URL = "https://terminal-browser.sh";
const REQUIRED_CAPABILITIES = ["embedding", "image-frames"];
const CAPABILITIES_TIMEOUT_MS = 1e4;
const LAUNCH_TIMEOUT_MS = 20000;
async function terminalBrowserCommand(host) {
  const checkoutCli = `${host.root}/../cli/dist/main.js`;
  if (await host.exists(checkoutCli))
    return ["node", checkoutCli];
  return ["terminal-browser"];
}
async function checkCapabilities(host, command) {
  let result;
  try {
    result = await host.run([...command, "capabilities"], { timeoutMs: CAPABILITIES_TIMEOUT_MS });
  } catch {
    return { ok: false, installed: false };
  }
  let capabilities = [];
  if (result.exitCode === 0) {
    const line = result.stdout.split(`
`).find((text) => text.startsWith("{"));
    try {
      const parsed = line ? JSON.parse(line) : null;
      if (parsed && Array.isArray(parsed.capabilities))
        capabilities = parsed.capabilities;
    } catch (err) {
      host.log(`terminal-browser: capabilities yanıtı okunamadı: ${err}`, { to: "debug" });
    }
  }
  const ok = REQUIRED_CAPABILITIES.every((need) => capabilities.includes(need));
  return ok ? { ok: true } : { ok: false, installed: true };
}
async function launchReport(host, command) {
  try {
    const { stdout, stderr, exitCode } = await host.run([...command, "claude-bridge", "launch"], { timeoutMs: LAUNCH_TIMEOUT_MS });
    const line = stdout.split(`
`).find((text) => text.startsWith("{"));
    return line ? JSON.parse(line) : { error: stderr.trim() || `exit ${exitCode}`, code: "start" };
  } catch (err) {
    return { error: String(err), code: "start" };
  }
}
async function startBridge(host) {
  const command = await terminalBrowserCommand(host);
  const check = await checkCapabilities(host, command);
  if (!check.ok) {
    return {
      ok: false,
      error: check.installed ? word("upgrade") : `${word("install")}: ${INSTALL_URL}`
    };
  }
  const report = await launchReport(host, command);
  if (!isLaunchReport(report) || !("port" in report)) {
    const detail = isLaunchReport(report) && "error" in report ? report.error : word("noStart");
    return { ok: false, error: `${detail}` };
  }
  state.port = report.port;
  state.token = report.token;
  watchBridge(host).catch((cause) => forgetBridge(cause));
  return { ok: true };
}

const WITH_SLASHES = /^[a-z][a-z0-9+.-]*:\/\//i;
const BARE_SCHEMES = /^(about|data|file|mailto|view-source|terminal-browser):/i;
const LOCAL = /^(localhost|\d{1,3}(\.\d{1,3}){3}|\[[0-9a-f:]+\])(:\d+)?(\/|$)/i;
function normalizeUrl(raw) {
  const text = raw.trim();
  if (LOCAL.test(text))
    return `http://${text}`;
  if (WITH_SLASHES.test(text) || BARE_SCHEMES.test(text))
    return text;
  return `https://${text}`;
}

const PANE_ROWS = 24;
function targetUrl(raw) {
  if (raw)
    return normalizeUrl(raw);
  const alive = state.last?.alive === true;
  return alive && state.last?.url ? state.last.url : START_URL$1;
}
async function openBrowser(host, raw) {
  if (state.isOffTerminal)
    return { ok: false, error: word("terminalOnly") };
  if (state.port === null) {
    const started = await startBridge(host);
    if (!started.ok)
      return started;
  }
  const url = targetUrl(raw);
  state.pendingUrl = url;
  state.requestedUrl = url;
  state.open = true;
  await host.open({ id: PANE$1, title: word("paneTitle"), focus: true, rows: PANE_ROWS });
  host.redraw();
  if (state.region) {
    state.pendingUrl = null;
    await post(host, "/open", { url, ...state.region });
  }
  return { ok: true, url };
}
async function closeBrowser(host) {
  if (!state.open)
    return false;
  await host.close({ id: PANE$1 });
  return true;
}
async function browserClosed(host) {
  state.open = false;
  state.pendingUrl = null;
  state.requestedUrl = null;
  state.region = null;
  state.frame = null;
  state.mounted = null;
  await post(host, "/browser/close", {});
}

const START_URL = "terminal-browser://start";
function shownUrl(url) {
  return url === null || url === START_URL ? word("startPage") : url;
}
function lead(status) {
  if (status.error !== null && status.error !== "")
    return { text: status.error, color: "error" };
  if (status.isAlive === false)
    return { text: word("died"), color: "warning" };
  return { text: word("loading") };
}
function statusView(ui, status) {
  const { Box, Text } = ui;
  const line = lead(status);
  const isStuck = line.color !== undefined;
  return h(Box, {
    key: "tb-status",
    flexDirection: "column",
    paddingX: 1,
    paddingY: 1
  }, h(Text, {
    bold: true
  }, word("eyebrow")), h(Text, {
    dimColor: true,
    wrap: "truncate-middle"
  }, shownUrl(status.url)), h(Text, {
    color: line.color,
    dimColor: !isStuck
  }, line.text), isStuck ? h(Text, {
    dimColor: true
  }, word("retry")) : null);
}

const PANE = "browser";
const IMAGE_ALT = "";
const OPEN_TOOL = "mcp__terminal-browser__open";
const CLOSE_TOOL = "mcp__terminal-browser__close";
const MIN_BODY_ROWS = 8;
const PANE_CHROME_ROWS = 8;
const FALLBACK_VIEWPORT_ROWS = 30;
const FALLBACK_VIEWPORT_COLUMNS = 80;
const MAX_SCROLL_TICKS = 10;
function hostOf($) {
  return {
    root: $.plugin.root,
    exists: (path) => $.fs.exists(path),
    run: (argv, init) => $.process.run(argv, init),
    fetch: (url, init) => $.http.fetch(url, init),
    sleep: (ms) => $.clock.sleep(ms),
    log: (text, init) => $.ui.log(text, init),
    redraw: () => $.ui.invalidate("ui.render"),
    open: (request) => $.ui.open(request),
    close: (request) => $.ui.close(request),
    blit: (request) => $.ui.blit(request),
    fill: (request) => $.prompt.fill(request)
  };
}
function onBrowserNoun(on) {
  on("engine.create", async ($, e, next) => {
    const built = await next(e);
    const servedByHooks = () => {
      throw new Error("the browser noun is served by its hooks");
    };
    const browser = { open: servedByHooks, close: servedByHooks };
    return { ...built, browser };
  });
  on("browser.open", async ($, e) => {
    const opened = await openBrowser(hostOf($), e.url ?? null);
    return { value: opened };
  });
  on("browser.close", async ($) => {
    return { value: await closeBrowser(hostOf($)) };
  });
}
function onSessionStart(on, agentToolEnabled) {
  on("session.start", async ($, e, next) => {
    setLang(await $.env.get("MODZ_LANG").catch(() => {
      return;
    }));
    const r = await next(e);
    let surfaces = [];
    try {
      surfaces = await $.session.surfaces();
    } catch (err) {
      $.ui.log(`terminal-browser: yüzeyler okunamadı, terminal yok sayılıyor: ${err}`, { to: "debug" });
    }
    state.isOffTerminal = !surfaces.includes("terminal") || surfaces.includes("desktop");
    if (state.isOffTerminal)
      return r;
    await $.command.register({
      name: "browser",
      description: word("command"),
      argumentHint: "[url]",
      immediate: true
    }).catch((err) => $.ui.log(`terminal-browser: could not register /browser: ${err}`));
    if (agentToolEnabled) {
      await $.tool.register({
        name: "open",
        description: "Open terminal-browser directly inside claude code. Control the open page with the terminal-browser action CLI.",
        inputSchema: { type: "object", properties: { url: { type: "string", description: "The page to open, as a full url or a host name" } } }
      }).catch((err) => $.ui.log(`terminal-browser: could not register the open tool: ${err}`));
      await $.tool.register({ name: "close", description: "Close the terminal-browser pane." }).catch((err) => $.ui.log(`terminal-browser: could not register the close tool: ${err}`));
    }
    return r;
  });
}
function onCommands(on) {
  on("command.run", { command: "browser" }, async ($, e) => {
    const arg = e.args.trim();
    if (arg === "close" || !arg && state.open) {
      const wasOpen = await closeBrowser(hostOf($));
      return { text: word(wasOpen ? "closed" : "alreadyClosed") };
    }
    const opened = await openBrowser(hostOf($), arg || null);
    return { text: opened.ok ? openedText(opened.url, opened.url === START_URL$1) : opened.error };
  });
  on("tool.call", { tool: new RegExp(`^${OPEN_TOOL}$`) }, async ($, e) => {
    const url = e.url;
    const opened = await openBrowser(hostOf($), typeof url === "string" ? url : null);
    if (!opened.ok)
      return { deny: `could not open the browser: ${opened.error}` };
    return { result: [{ type: "text", text: `opened ${opened.url} ` }] };
  });
  on("tool.call", { tool: new RegExp(`^${CLOSE_TOOL}$`) }, async ($) => {
    const closed = await closeBrowser(hostOf($));
    return { result: [{ type: "text", text: closed ? "browser pane closed" : "no browser pane was open (maybe the user closed it?)" }] };
  });
}
function onPaneRender(on) {
  on("ui.render", { component: "Pane", requestId: PANE }, async ($, e) => {
    if (e.surface !== "terminal") {
      const { Box } = await $.ui.resolve(e);
      return h(Box, null);
    }
    const { Box, Client, Image, Text } = await $.ui.resolve(e);
    const rows = e.props.scroll.bodyRows > 0 ? e.props.scroll.bodyRows : Math.max(MIN_BODY_ROWS, (e.viewport?.rows ?? FALLBACK_VIEWPORT_ROWS) - PANE_CHROME_ROWS);
    const cols = Math.max(1, e.props.bodyColumns > 0 ? e.props.bodyColumns : e.viewport?.columns ?? FALLBACK_VIEWPORT_COLUMNS);
    const frame = state.frame;
    const grid = frame ? imageGrid(frame, cols, rows) : null;
    state.mounted = grid;
    return h(Box, {
      flexDirection: "column",
      width: cols,
      height: rows
    }, frame && grid ? h(Image, {
      key: IMAGE_KEY,
      source: imageSource(frame),
      columns: grid.cols,
      rows: grid.rows,
      alt: IMAGE_ALT
    }) : statusView({ Box, Text }, paneStatus()), h(Box, {
      position: "absolute",
      top: 0,
      left: 0,
      width: cols,
      height: rows
    }, h(Client, {
      key: viewKey(),
      module: "./surface.tsx",
      width: cols,
      height: rows
    })));
  });
}
function onPaneInput(on) {
  on("ui.message", async ($, e, next) => {
    if (e.requestId !== PANE || state.port === null)
      return next(e);
    if (isSizeMessage(e.data)) {
      state.region = { cols: e.data.cols, rows: e.data.rows };
      if (state.pendingUrl) {
        const url = state.pendingUrl;
        state.pendingUrl = null;
        await post(hostOf($), "/open", { url, ...state.region });
      } else {
        await post(hostOf($), "/size", state.region);
      }
    } else if (isInputMessage(e.data)) {
      await post(hostOf($), "/input", { events: e.data.events });
    }
    return next(e);
  });
  on("ui.scroll", { requestId: PANE }, async ($, e) => {
    if (state.port === null || !state.open || e.by === 0)
      return {};
    const kind = e.by < 0 ? "scrollup" : "scrolldown";
    const ticks = Math.min(Math.round(Math.abs(e.by)) || 1, MAX_SCROLL_TICKS);
    const x = e.pointer?.column ?? Math.floor((state.region?.cols ?? 0) / 2);
    const y = e.pointer?.row ?? Math.floor((state.region?.rows ?? 0) / 2);
    const events = Array.from({ length: ticks }, () => ({ type: "mouse", kind, x, y }));
    await post(hostOf($), "/input", { events });
    return {};
  });
}
const register = (on, options) => {
  const agentToolEnabled = options.agentTool === true;
  onBrowserNoun(on);
  onSessionStart(on, agentToolEnabled);
  onCommands(on);
  onPaneRender(on);
  onPaneInput(on);
  on("ui.close", { id: PANE }, async ($, e, next) => {
    const r = await next(e);
    await browserClosed(hostOf($));
    return r;
  });
};

export { register };
