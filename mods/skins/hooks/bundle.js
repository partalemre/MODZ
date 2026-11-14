// Built by `bin/modz build` from the files beside it. Never edited by hand.
import { atom, update, memberOf, read } from 'claude-code';

const TURTLE = ["   .----.", " _/_\\__/_\\_(°>", '   "    "'];
const KOI_RIGHT = ["~><((((°>"];
const KOI_LEFT = ["<°))))><~"];
const JELLY = [' .-""-.', "(______)", " ) ) ) ", " ( ( ( "];
const JELLY_SMALL = [" .-.", "(___)", " )|("];
const BOAT = ["   |\\", " __|_\\__", " \\_____/"];
const MOON = ['  .-""""-.', " /    °   \\", "|  °       |", " \\      ° /", "  '-....-'"];
const CLOUD = ["    .--.", "  .(    )-.", " (___.__)__)"];
const CLOUD_SMALL = [" .-(  )-.", "(___.___)"];
const SCENES = [
  {
    name: "honu-lagoon",
    label: "Honu Lagoon",
    sky: ["#5fd6d6", "#1a8fa6"],
    field: { ramp: " .·:~≈", fill: [0.2, 0.6], colors: ["#c6f5f1", "#0f6f86"], glint: "˚°·", glintColor: "#ffffff", seconds: 48 },
    sprites: [
      { art: TURTLE, color: "#1f5e4a", motion: "right", seconds: 34, at: [[2, 18], [5, 76]] },
      { art: ["><(((°>"], color: "#ffd43b", motion: "right", seconds: 18, at: [[1, 52], [7, 8], [6, 100]] },
      { art: ["<°)))><"], color: "#ff8c69", motion: "left", seconds: 22, at: [[4, 40], [8, 90]] },
      { art: ["✿"], color: "#ff4d6d", motion: "float", seconds: 4, at: [[8, 30], [7, 64], [8, 112]] },
      { art: ["❀"], color: "#fff3c4", motion: "float", seconds: 5, at: [[8, 48], [7, 96]] }
    ]
  },
  {
    name: "koi-pond",
    label: "Koi Pond",
    sky: ["#12474b", "#082224"],
    field: { ramp: " .·~", fill: [0.25, 0.45], colors: ["#3a8f88", "#14504c"], glint: "·", glintColor: "#9fe3d6", seconds: 60 },
    sprites: [
      { art: KOI_RIGHT, color: "#ff7a3d", motion: "right", seconds: 28, at: [[2, 20], [6, 70]] },
      { art: KOI_LEFT, color: "#f4efe6", motion: "left", seconds: 32, at: [[4, 90], [7, 30]] },
      { art: KOI_RIGHT, color: "#e84a3a", motion: "right", seconds: 38, at: [[8, 100]] },
      { art: ["(_@_)"], color: "#5fae5a", motion: "float", seconds: 6, at: [[1, 8], [5, 46], [8, 84]] },
      { art: ["✿"], color: "#ff9fc4", motion: "float", seconds: 5, at: [[1, 10], [5, 48]] }
    ]
  },
  {
    name: "jellyfish",
    label: "Jellyfish",
    sky: ["#1b1f4b", "#070a22"],
    field: { ramp: " .·:", fill: [0.15, 0.4], colors: ["#5a63b8", "#262b6a"], glint: "˚°", glintColor: "#c9b6ff", seconds: 70 },
    sprites: [
      { art: JELLY, color: "#ff9bd2", motion: "rise", seconds: 26, at: [[2, 14], [6, 74]] },
      { art: JELLY, color: "#9be8ff", motion: "rise", seconds: 32, at: [[8, 44], [0, 104]] },
      { art: JELLY_SMALL, color: "#c7a6ff", motion: "rise", seconds: 20, at: [[4, 30], [1, 60], [7, 92]] }
    ]
  },
  {
    name: "paper-boats",
    label: "Paper Boats",
    sky: ["#f6d8c8", "#9ec9d9"],
    field: { ramp: " .-~≈", fill: [-0.4, 0.75], colors: ["#f2c4ae", "#4f88a3"], glint: "·", glintColor: "#ffffff", seconds: 54 },
    sprites: [
      { art: BOAT, color: "#ffffff", motion: "right", seconds: 44, at: [[4, 10], [5, 70]] },
      { art: BOAT, color: "#ffd1dc", motion: "right", seconds: 56, at: [[5, 40]] },
      { art: ["~v~"], color: "#7a6a73", motion: "left", seconds: 30, at: [[0, 60], [1, 100]] }
    ]
  },
  {
    name: "fireflies",
    label: "Fireflies",
    sky: ["#0d1a14", "#04090a"],
    field: { ramp: ` .,'"|`, fill: [-0.5, 0.85], colors: ["#1d3a2a", "#3b6e45"], glint: "", glintColor: "#000000", seconds: 80 },
    sprites: [
      {
        art: ["•"],
        color: "#e6ff7a",
        motion: "blink",
        seconds: 4,
        glows: true,
        at: [[1, 8], [3, 22], [0, 37], [5, 46], [2, 58], [4, 69], [1, 81], [6, 90], [3, 101], [0, 112], [5, 15], [2, 95]]
      },
      { art: ["·"], color: "#fff7b0", motion: "blink", seconds: 3, glows: true, at: [[2, 30], [4, 52], [1, 74], [3, 86], [6, 64]] }
    ]
  },
  {
    name: "moonlit",
    label: "Moonlit",
    sky: ["#141a3a", "#0a0e22"],
    field: { ramp: " .-~≈", fill: [-0.45, 0.65], colors: ["#3a4a8a", "#1f2a5c"], glint: "·˚", glintColor: "#e8e6ff", seconds: 64 },
    sprites: [
      { art: MOON, color: "#f3eecd", motion: "still", seconds: 1, glows: true, at: [[0, 90]] },
      { art: ["+"], color: "#fffbe0", motion: "blink", seconds: 5, glows: true, at: [[0, 8], [1, 24], [0, 41], [2, 57], [1, 73], [0, 112]] },
      { art: ["·"], color: "#fffbe0", motion: "blink", seconds: 3, at: [[1, 15], [0, 33], [2, 48], [1, 66], [2, 84], [1, 118]] }
    ]
  },
  {
    name: "cloud-drift",
    label: "Cloud Drift",
    sky: ["#8ccbf2", "#e6f4fb"],
    field: { ramp: " ·", fill: [0.05, 0.12], colors: ["#ffffff", "#ffffff"], glint: "", glintColor: "#000000", seconds: 90 },
    sprites: [
      { art: CLOUD, color: "#ffffff", motion: "right", seconds: 70, at: [[0, 10], [4, 64]] },
      { art: CLOUD_SMALL, color: "#f4fbff", motion: "right", seconds: 90, at: [[2, 38], [6, 100]] },
      { art: ["^v^"], color: "#4a5a6a", motion: "left", seconds: 26, at: [[1, 80], [3, 30]] }
    ]
  },
  {
    name: "ember",
    label: "Ember",
    sky: ["#2a1710", "#120a07"],
    field: { ramp: " .:;", fill: [0.1, 0.45], colors: ["#5a2e1c", "#8a4527"], glint: "*+·", glintColor: "#ff9a5a", seconds: 50 },
    sprites: [
      { art: ["*"], color: "#ff8a4c", motion: "rise", seconds: 9, glows: true, at: [[2, 12], [6, 28], [4, 44], [8, 60], [1, 76], [5, 92], [7, 108]] },
      { art: ["'"], color: "#ffc38a", motion: "rise", seconds: 7, glows: true, at: [[3, 20], [7, 52], [0, 84], [5, 116]] }
    ]
  }
];
const SCENE_NAMES = SCENES.map((scene) => scene.name);
const sceneNamed = (name) => SCENES.find((scene) => scene.name === name);
function nextScene(name) {
  const cycle = [...SCENE_NAMES, "off"];
  return cycle[(cycle.indexOf(name) + 1) % cycle.length] ?? "off";
}

let current = "en";
const langOf = (value) => typeof value === "string" && /^tr/i.test(value.trim()) ? "tr" : "en";
function setLang(value) {
  current = langOf(value);
  return current;
}
const pick$1 = (table) => table[current];

const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const EN$1 = {
  command: "Open the look settings (skin), or /skin <name | list | off>",
  usage: (head) => `write it as: /skin ${head} on|off`,
  iconsUsage: "write it as: /skin icons unicode|ascii",
  sceneUsage: (names) => `write it as: /skin scene ${[...names, "off"].join("|")}`,
  scene: (label) => `Scene: ${label}`,
  sceneOff: "Turn the scene off",
  sceneAlt: (label) => `${label}, a living scene`,
  unknown: (head) => `no look called "${head}". /skin list shows them all`,
  skinOff: "look off",
  replyWidth: (columns) => `reply width: ${count(columns, "column", "columns")}`,
  folderPinned: "this folder: pinned",
  folderFollows: "this folder: follows the default",
  pin: "this folder keeps its own look",
  unpin: (skin) => `this folder follows the default: ${skin}`,
  share: (skin) => `default look: ${skin}`,
  light: "light",
  dark: "dark",
  settingsTitle: "Look",
  galleryTitle: "Look gallery",
  galleryEmpty: "The gallery shows a look. Pick one with /skin first.",
  settingsElsewhere: "Open the look settings in the terminal or the desktop app.",
  compactFailed: (why) => `Could not summarize the chat (compact): ${why}`,
  copied: "Copied",
  notCopied: "Could not copy here",
  copy: "Copy",
  moreLines: (n) => `${count(n, "more line", "more lines")}`,
  lineAt: (n) => `line ${n}`,
  code: "code",
  newFile: "new file",
  output: "Output",
  noOutput: "no output",
  stopped: "stopped",
  timedOut: "timed out",
  failed: "error",
  ok: "ok",
  context: "memory",
  fiveHour: "5h",
  sevenDay: "week",
  percent: (n) => `${n}%`,
  contextFull: (n) => `Chat memory ${n}% full`,
  compactNow: "Summarize now",
  compact: "Summarize",
  tools: (n) => count(n, "tool", "tools"),
  samplePrompt: "add rate limiting to the hub api",
  sampleHeader: ["Route", "Limit", "Window"],
  minute: "1 min",
  toggles: { rail: "Reply line", tables: "Table cards", shimmer: "Shimmer", band: "Usage line", clip: "Clip long output" },
  off: "Off",
  icons: (style) => `Icons: ${style}`,
  theme: "Theme",
  skins: (n) => count(n, "look", "looks"),
  options: "Options",
  colors: "Colors",
  colorsHint: "pick a slot, type a hex color",
  color: "Color",
  paint: "paint",
  askClaude: "Or ask Claude: ",
  askExample: "“make a look that feels like a sunset”",
  openGallery: "Open the gallery"
};
const TR$1 = {
  command: "Görünüm ayarlarını (skin) aç ya da /skin <ad | list | off>",
  usage: (head) => `şöyle yazılır: /skin ${head} on|off`,
  iconsUsage: "şöyle yazılır: /skin icons unicode|ascii",
  sceneUsage: (names) => `şöyle yazılır: /skin scene ${[...names, "off"].join("|")}`,
  scene: (label) => `Sahne: ${label}`,
  sceneOff: "Sahneyi kapat",
  sceneAlt: (label) => `${label}, canlı bir sahne`,
  unknown: (head) => `"${head}" adında bir görünüm yok. /skin list hepsini gösterir`,
  skinOff: "görünüm kapalı",
  replyWidth: (columns) => `yanıt genişliği: ${columns} sütun`,
  folderPinned: "bu klasör: sabitlendi",
  folderFollows: "bu klasör: varsayılanı izler",
  pin: "bu klasör kendi görünümünü korur",
  unpin: (skin) => `bu klasör varsayılanı izler: ${skin}`,
  share: (skin) => `varsayılan görünüm: ${skin}`,
  light: "açık",
  dark: "koyu",
  settingsTitle: "Görünüm",
  galleryTitle: "Görünüm galerisi",
  galleryEmpty: "Galeri bir görünüm gösterir. Önce /skin ile birini seç.",
  settingsElsewhere: "Görünüm ayarlarını terminalde ya da masaüstü uygulamasında aç.",
  compactFailed: (why) => `Sohbet özetlenemedi (compact): ${why}`,
  copied: "Kopyalandı",
  notCopied: "Burada kopyalanamadı",
  copy: "Kopyala",
  moreLines: (n) => `${n} satır daha`,
  lineAt: (n) => `satır ${n}`,
  code: "kod",
  newFile: "yeni dosya",
  output: "Çıktı",
  noOutput: "çıktı yok",
  stopped: "durduruldu",
  timedOut: "zaman aşımı",
  failed: "hata",
  ok: "tamam",
  context: "hafıza",
  fiveHour: "5s",
  sevenDay: "hafta",
  percent: (n) => `%${n}`,
  contextFull: (n) => `Sohbet hafızası %${n} dolu`,
  compactNow: "Şimdi özetle",
  compact: "Özetle",
  tools: (n) => `${n} araç`,
  samplePrompt: "hub api'ye hız sınırı ekle",
  sampleHeader: ["Yol", "Sınır", "Pencere"],
  minute: "1 dk",
  toggles: { rail: "Yanıt çizgisi", tables: "Tablo kartları", shimmer: "Parıltı", band: "Kullanım satırı", clip: "Uzun çıktıyı kırp" },
  off: "Kapalı",
  icons: (style) => `İkonlar: ${style}`,
  theme: "Tema",
  skins: (n) => `${n} görünüm`,
  options: "Seçenekler",
  colors: "Renkler",
  colorsHint: "bir yuva seç, hex renk kodu yaz",
  color: "Renk",
  paint: "boya",
  askClaude: "Ya da Claude'a sor: ",
  askExample: "“gün batımı gibi hissettiren bir görünüm yap”",
  openGallery: "Galeriyi aç"
};
const say = () => pick$1({ en: EN$1, tr: TR$1 });

const DEFAULT_PREFS = {
  skin: "tidemark",
  icons: "unicode",
  rail: true,
  tables: true,
  shimmer: true,
  band: false,
  clipOutput: false,
  scene: "off"
};
const TOGGLES = {
  rail: "rail",
  tables: "tables",
  shimmer: "shimmer",
  band: "band",
  clip: "clipOutput"
};
const flagOr = (value, fallback) => typeof value === "boolean" ? value : fallback;
function parsePrefs(raw, names) {
  const saved = typeof raw === "object" && raw !== null ? raw : {};
  const skin = saved.skin;
  return {
    skin: typeof skin === "string" && (skin === "off" || names.includes(skin)) ? skin : DEFAULT_PREFS.skin,
    icons: saved.icons === "ascii" ? "ascii" : "unicode",
    rail: flagOr(saved.rail, DEFAULT_PREFS.rail),
    tables: flagOr(saved.tables, DEFAULT_PREFS.tables),
    shimmer: flagOr(saved.shimmer, DEFAULT_PREFS.shimmer),
    band: flagOr(saved.band, DEFAULT_PREFS.band),
    clipOutput: flagOr(saved.clipOutput, DEFAULT_PREFS.clipOutput),
    scene: typeof saved.scene === "string" && SCENE_NAMES.includes(saved.scene) ? saved.scene : DEFAULT_PREFS.scene
  };
}
const changed = (prefs, message) => ({ prefs, message, channel: "toast" });
const refused = (prefs, message) => ({ prefs, message, channel: "row" });
const onOff = (on) => on ? "on" : "off";
const listing = (current, names) => [
  ...names.map((name) => `${name === current.skin ? "●" : "○"} ${name}`),
  `${current.skin === "off" ? "●" : "○"} off`,
  [
    `icons ${current.icons}`,
    `rail ${onOff(current.rail)}`,
    `tables ${onOff(current.tables)}`,
    `shimmer ${onOff(current.shimmer)}`,
    `band ${onOff(current.band)}`,
    `clip ${onOff(current.clipOutput)}`,
    `scene ${current.scene}`
  ].join(" · ")
].join(`
`);
const isToggle = (word) => Object.hasOwn(TOGGLES, word);
function runSkinCommand(args, current, names) {
  const [head = "", value] = args.trim().toLowerCase().split(/\s+/);
  if (isToggle(head)) {
    const field = TOGGLES[head];
    return value === "on" || value === "off" ? changed({ ...current, [field]: value === "on" }, `${head} ${value}`) : refused(current, say().usage(head));
  }
  switch (head) {
    case "list":
      return refused(current, listing(current, names));
    case "off":
    case "default":
    case "stock":
      return changed({ ...current, skin: "off" }, say().skinOff);
    case "on":
      return current.skin === "off" ? changed({ ...current, skin: DEFAULT_PREFS.skin }, `skin: ${DEFAULT_PREFS.skin}`) : changed(current, `skin: ${current.skin}`);
    case "icons":
      return value === "unicode" || value === "ascii" ? changed({ ...current, icons: value }, `icons: ${value}`) : refused(current, say().iconsUsage);
    case "scene":
      return value !== undefined && (value === "off" || SCENE_NAMES.includes(value)) ? changed({ ...current, scene: value }, `scene: ${value}`) : refused(current, say().sceneUsage(SCENE_NAMES));
    default:
      return names.includes(head) ? changed({ ...current, skin: head }, `skin: ${head}`) : refused(current, say().unknown(head));
  }
}
function rowReply(message, { args, isPinned, columns }) {
  if (args.trim() !== "list") {
    return message;
  }
  const width = columns === undefined ? "" : `
${say().replyWidth(columns)}`;
  const folder = isPinned ? say().folderPinned : say().folderFollows;
  return `${message}
${folder}${width}`;
}

const skin$7 = {
  name: "catppuccin",
  label: "Catppuccin Mocha",
  palette: {
    read: "#89dceb",
    write: "#fab387",
    run: "#f9e2af",
    search: "#cba6f7",
    web: "#74c7ec",
    mcp: "#94e2d5",
    other: "#bac2de",
    user: "#cba6f7",
    fg: "#cdd6f4",
    muted: "#7f849c",
    surface: "#252536",
    zebra: "#232334",
    ok: "#a6e3a1",
    err: "#f38ba8",
    warn: "#f9e2af"
  },
  spinner: ["Purring", "Napping", "Pouncing", "Kneading", "Stretching", "Nuzzling"],
  done: ["Pounced", "Purred", "Napped", "Curled up"]
};

const skin$6 = {
  name: "dracula",
  label: "Dracula",
  palette: {
    read: "#8be9fd",
    write: "#ffb86c",
    run: "#f1fa8c",
    search: "#bd93f9",
    web: "#ff79c6",
    mcp: "#50fa7b",
    other: "#f8f8f2",
    user: "#bd93f9",
    fg: "#f8f8f2",
    muted: "#6272a4",
    surface: "#2b2d3a",
    zebra: "#2a2c37",
    ok: "#50fa7b",
    err: "#ff5555",
    warn: "#f1fa8c"
  },
  spinner: ["Brooding", "Haunting", "Conjuring", "Lurking", "Scheming", "Unliving"],
  done: ["Risen", "Conjured", "Bitten", "Vanquished"]
};

const skin$5 = {
  name: "gruvbox",
  label: "Gruvbox",
  palette: {
    read: "#83a598",
    write: "#fe8019",
    run: "#b8bb26",
    search: "#d3869b",
    web: "#8ec07c",
    mcp: "#fabd2f",
    other: "#ebdbb2",
    user: "#fabd2f",
    fg: "#ebdbb2",
    muted: "#928374",
    surface: "#32302f",
    zebra: "#2f2c2a",
    ok: "#b8bb26",
    err: "#fb4934",
    warn: "#fe8019"
  },
  spinner: ["Brewing", "Roasting", "Simmering", "Toasting", "Percolating", "Kindling"],
  done: ["Brewed", "Roasted", "Toasted", "Served"]
};

const skin$4 = {
  name: "mono",
  label: "Monochrome",
  palette: {
    read: "#9e9e9e",
    write: "#e0e0e0",
    run: "#bdbdbd",
    search: "#9e9e9e",
    web: "#9e9e9e",
    mcp: "#9e9e9e",
    other: "#9e9e9e",
    user: "#e0e0e0",
    fg: "#e0e0e0",
    muted: "#7a7a7a",
    surface: "#262626",
    zebra: "#222222",
    ok: "#e0e0e0",
    err: "#ffffff",
    warn: "#bdbdbd"
  },
  spinner: ["Working", "Thinking", "Reading", "Writing", "Checking"],
  done: ["Done", "Finished", "Completed"]
};

const skin$3 = {
  name: "noir",
  label: "Noir",
  palette: {
    read: "#ededed",
    write: "#ededed",
    run: "#ededed",
    search: "#ededed",
    web: "#ededed",
    mcp: "#ededed",
    other: "#ededed",
    user: "#f5f5f5",
    fg: "#ededed",
    muted: "#8c8c8c",
    surface: "#151515",
    zebra: "#1c1c1c",
    ok: "#ededed",
    err: "#f87171",
    warn: "#a3a3a3"
  },
  light: {
    read: "#111111",
    write: "#111111",
    run: "#111111",
    search: "#111111",
    web: "#111111",
    mcp: "#111111",
    other: "#111111",
    user: "#111111",
    fg: "#151515",
    muted: "#6b6b6b",
    surface: "#ffffff",
    zebra: "#f2f2f2",
    ok: "#151515",
    err: "#c42b2b",
    warn: "#6b6b6b"
  },
  spinner: ["Thinking", "Working", "Composing", "Considering", "Weighing"],
  done: ["Done", "Finished", "Settled"]
};

const skin$2 = {
  name: "nord",
  label: "Nord",
  palette: {
    read: "#8fbcbb",
    write: "#d08770",
    run: "#ebcb8b",
    search: "#b48ead",
    web: "#5e81ac",
    mcp: "#88c0d0",
    other: "#d8dee9",
    user: "#88c0d0",
    fg: "#e5e9f0",
    muted: "#7b88a1",
    surface: "#3b4252",
    zebra: "#353b49",
    ok: "#a3be8c",
    err: "#bf616a",
    warn: "#ebcb8b"
  },
  spinner: ["Drifting", "Frosting", "Chilling", "Thawing", "Skiing", "Gliding"],
  done: ["Frozen", "Thawed", "Charted", "Crossed"]
};

const skin$1 = {
  name: "tidemark",
  label: "Tidemark",
  palette: {
    read: "#7fb6e8",
    write: "#e58a5f",
    run: "#b19cf3",
    search: "#7fb6e8",
    web: "#e07bc0",
    mcp: "#6fc593",
    other: "#c2beb4",
    user: "#e58a5f",
    fg: "#f0eee8",
    muted: "#8e8a80",
    surface: "#1f1f1c",
    zebra: "#1a1a18",
    ok: "#6fc593",
    err: "#f2727f",
    warn: "#e9b949"
  },
  light: {
    read: "#2464a0",
    write: "#a94a26",
    run: "#6243c4",
    search: "#2464a0",
    web: "#a8337f",
    mcp: "#1f6e43",
    other: "#4f4b44",
    user: "#a94a26",
    fg: "#1c1b19",
    muted: "#77726a",
    surface: "#f6f4ef",
    zebra: "#faf8f3",
    ok: "#1f6e43",
    err: "#c0263a",
    warn: "#8a6000"
  },
  get spinner() {
    return pick$1({ en: ["Working", "Weighing", "Weaving", "Writing", "Trying"], tr: ["Düşünüyor", "Tartıyor", "Örüyor", "Yazıyor", "Deniyor"] });
  },
  get done() {
    return pick$1({ en: ["Done", "Finished", "Settled"], tr: ["Bitti", "Tamamlandı", "Yerleşti"] });
  }
};

const skin = {
  name: "tokyo-night",
  label: "Tokyo Night",
  palette: {
    read: "#7dcfff",
    write: "#ff9e64",
    run: "#e0af68",
    search: "#bb9af7",
    web: "#7aa2f7",
    mcp: "#73daca",
    other: "#a9b1d6",
    user: "#7aa2f7",
    fg: "#c0caf5",
    muted: "#737aa2",
    surface: "#1f2335",
    zebra: "#1d2030",
    ok: "#9ece6a",
    err: "#f7768e",
    warn: "#e0af68"
  },
  spinner: ["Neon-ing", "Drizzling", "Glowing", "Wiring", "Night-driving", "Rain-checking"],
  done: ["Lit up", "Wired", "Shipped", "Landed"]
};

const SKINS = [skin$1, skin$3, skin, skin$6, skin$2, skin$5, skin$7, skin$4];

const SLOTS = [
  "user",
  "fg",
  "muted",
  "surface",
  "zebra",
  "ok",
  "err",
  "warn",
  "read",
  "write",
  "run",
  "search",
  "web",
  "mcp",
  "other"
];
const SLOT_HELP = {
  user: "accent: the rail, your prompt marker, the spinner",
  fg: "body text",
  muted: "secondary text: commands, paths, timings",
  surface: "band behind a table header",
  zebra: "every other table row; keep it a step off the background",
  ok: "a finished call",
  err: "a failed call",
  warn: "an interrupted call",
  read: "Read",
  write: "Edit and Write",
  run: "Bash and PowerShell",
  search: "Glob and Grep",
  web: "WebFetch and WebSearch",
  mcp: "MCP tools",
  other: "anything else in a group"
};
const HEX$1 = /^#[0-9a-f]{6}$/i;
const NAME = /^[a-z0-9][a-z0-9-]{0,31}$/;
const MAX_WORDS = 12;
const MAX_WORD = 24;
const builtIn = (name) => SKINS.find((skin) => skin.name === name);
const skinNames = (custom) => [
  ...SKINS.map((skin) => skin.name),
  ...Object.keys(custom).filter((name) => builtIn(name) === undefined)
];
function resolveSkin(name, custom) {
  const own = builtIn(name);
  if (own !== undefined) {
    return own;
  }
  const made = custom[name];
  const base = made === undefined ? undefined : builtIn(made.base) ?? SKINS[0];
  if (made === undefined || base === undefined) {
    return;
  }
  return {
    name: made.name,
    label: made.label,
    palette: { ...base.palette, ...made.palette },
    spinner: made.spinner.length > 0 ? made.spinner : base.spinner,
    done: made.done.length > 0 ? made.done : base.done
  };
}
function words(value, field, fallback) {
  if (value === undefined) {
    return fallback;
  }
  const valid = Array.isArray(value) && value.length <= MAX_WORDS && value.every((word) => typeof word === "string" && word.trim() !== "" && word.length <= MAX_WORD);
  return valid ? value.map((word) => word.trim()) : `${field} must be up to ${MAX_WORDS} words of 1-${MAX_WORD} characters`;
}
function palette(value, fallback) {
  if (value === undefined) {
    return fallback;
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return 'palette must be an object of slot: "#rrggbb"';
  }
  const entries = Object.entries(value);
  const bad = entries.filter(([slot, hex]) => !SLOTS.includes(slot) || typeof hex !== "string" || !HEX$1.test(hex));
  if (bad.length > 0) {
    return `bad palette entries: ${bad.map(([slot]) => slot).join(", ")}. Slots: ${SLOTS.join(", ")}; values #rrggbb`;
  }
  return { ...fallback, ...Object.fromEntries(entries.map(([slot, hex]) => [slot, hex.toLowerCase()])) };
}
function buildCustom(draft, existing) {
  const name = typeof draft.name === "string" ? draft.name.trim().toLowerCase() : "";
  if (!NAME.test(name)) {
    return "name must be 1-32 lowercase letters, digits or hyphens";
  }
  if (builtIn(name) !== undefined || name === "off") {
    return `"${name}" is taken by a built-in skin; pick another name`;
  }
  const base = typeof draft.base === "string" ? draft.base : existing?.base ?? SKINS[0]?.name ?? "";
  if (builtIn(base) === undefined) {
    return `base must be one of ${SKINS.map((skin) => skin.name).join(", ")}`;
  }
  const label = typeof draft.label === "string" && draft.label.trim() !== "" ? draft.label.trim().slice(0, 32) : existing?.label ?? name;
  const colours = palette(draft.palette, existing?.palette ?? {});
  const spinner = words(draft.spinner, "spinner", existing?.spinner ?? []);
  const done = words(draft.done, "done", existing?.done ?? []);
  for (const result of [colours, spinner, done]) {
    if (typeof result === "string") {
      return result;
    }
  }
  return {
    name,
    label,
    base,
    palette: colours,
    spinner,
    done
  };
}
function withSlot(current, custom, { slot, hex }) {
  if (!HEX$1.test(hex)) {
    return "use a colour like #7aa2f7";
  }
  const made = custom[current];
  const name = made === undefined ? `my-${current}` : current;
  const base = made?.base ?? current;
  const skin = buildCustom({ name, base, label: made?.label ?? `My ${current}`, palette: { [slot]: hex } }, custom[name]);
  return typeof skin === "string" ? skin : { name, skin };
}

const DESIGN_TOOL = {
  name: "design",
  description: [
    "Design, change and apply skins for the skins mod, which restyles this Claude Code transcript:",
    "tool rows on a timeline rail, tables, the spinner, the turn footer. Changes show at once.",
    'Call {"action":"show"} first: it returns the current skin, every slot with what it paints, and the names in use.',
    '"save" makes or updates a skin: name (lowercase, hyphens), base (a built-in skin it starts from),',
    'palette ({slot: "#rrggbb"}, only the slots to change), spinner (gerunds, like "Brewing"),',
    'done (past tense, like "Brewed"), apply (default true).',
    '"apply" switches to a skin by name, "delete" removes a made one,',
    '"settings" switches rail, tables, shimmer, band, clip (booleans) and icons ("unicode" or "ascii").',
    "Good skins keep fg and muted readable on a dark background, and surface and zebra one small step off it."
  ].join(" "),
  inputSchema: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["show", "save", "apply", "delete", "settings"] },
      name: { type: "string" },
      label: { type: "string" },
      base: { type: "string", enum: SKINS.map((skin) => skin.name) },
      palette: { type: "object", additionalProperties: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" } },
      spinner: { type: "array", items: { type: "string" }, maxItems: 12 },
      done: { type: "array", items: { type: "string" }, maxItems: 12 },
      apply: { type: "boolean" },
      settings: {
        type: "object",
        properties: {
          rail: { type: "boolean" },
          tables: { type: "boolean" },
          shimmer: { type: "boolean" },
          band: { type: "boolean" },
          clip: { type: "boolean" },
          icons: { type: "string", enum: ["unicode", "ascii"] }
        }
      }
    },
    required: ["action"]
  }
};
const DESIGN = `mcp__skins__${DESIGN_TOOL.name}`;
const fail = (state, text) => ({ text, state, isError: true });
const ok = (state, text) => ({ text, state, isError: false });
function show(state) {
  const skin = resolveSkin(state.prefs.skin, state.custom);
  return ok(state, JSON.stringify({
    current: state.prefs.skin,
    palette: skin?.palette ?? null,
    spinner: skin?.spinner ?? [],
    done: skin?.done ?? [],
    builtIn: SKINS.map((one) => one.name),
    made: Object.keys(state.custom),
    slots: SLOT_HELP,
    settings: state.prefs
  }));
}
function save(input, state) {
  const name = typeof input.name === "string" ? input.name.trim().toLowerCase() : "";
  const skin = buildCustom(input, state.custom[name]);
  if (typeof skin === "string") {
    return fail(state, skin);
  }
  const custom = { ...state.custom, [skin.name]: skin };
  const prefs = input.apply === false ? state.prefs : { ...state.prefs, skin: skin.name };
  return ok({ prefs, custom }, `saved ${skin.name}${input.apply === false ? "" : " and applied it"}`);
}
function settings(input, state) {
  const asked = typeof input.settings === "object" && input.settings !== null ? input.settings : {};
  const flag = (value, fallback) => typeof value === "boolean" ? value : fallback;
  const icons = asked.icons === "ascii" || asked.icons === "unicode" ? asked.icons : state.prefs.icons;
  const prefs = {
    ...state.prefs,
    rail: flag(asked.rail, state.prefs.rail),
    tables: flag(asked.tables, state.prefs.tables),
    shimmer: flag(asked.shimmer, state.prefs.shimmer),
    band: flag(asked.band, state.prefs.band),
    clipOutput: flag(asked.clip, state.prefs.clipOutput),
    icons
  };
  return ok({ ...state, prefs }, `settings: ${JSON.stringify(prefs)}`);
}
function runDesign(raw, state) {
  const input = typeof raw === "object" && raw !== null ? raw : {};
  const name = typeof input.name === "string" ? input.name.trim().toLowerCase() : "";
  switch (input.action) {
    case "show":
      return show(state);
    case "save":
      return save(input, state);
    case "apply":
      return skinNames(state.custom).includes(name) ? ok({ ...state, prefs: { ...state.prefs, skin: name } }, `applied ${name}`) : fail(state, `no skin named "${name}"; show lists them`);
    case "delete": {
      if (state.custom[name] === undefined) {
        return fail(state, `"${name}" is not a made skin; built-in skins cannot be deleted`);
      }
      const custom = Object.fromEntries(Object.entries(state.custom).filter(([key]) => key !== name));
      const prefs = state.prefs.skin === name ? { ...state.prefs, skin: DEFAULT_PREFS.skin } : state.prefs;
      return ok({ prefs, custom }, `deleted ${name}`);
    }
    case "settings":
      return settings(input, state);
    default:
      return fail(state, "action must be show, save, apply, delete or settings");
  }
}

const HUB_PANE = "skins";
const DETAIL_MAX = 40;
const OFF$1 = "off";
const EMPTY_HUB = { pane: HUB_PANE, detail: "", tone: "idle", at: 0 };
function hubDetail(skin, isLight) {
  const detail = skin === OFF$1 ? say().skinOff : `${skin} · ${isLight ? say().light : say().dark}`;
  return detail.length > DETAIL_MAX ? `${detail.slice(0, DETAIL_MAX - 1)}…` : detail;
}
const isOwnOpen = (value) => typeof value === "object" && value !== null && value.pane === HUB_PANE;

const ICONS = {
  unicode: {
    running: "○",
    ok: "●",
    err: "✕",
    interrupted: "◌",
    done: "◆",
    rail: "┃",
    branch: "─",
    prompt: "▍",
    frames: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
  },
  ascii: {
    running: "o",
    ok: "*",
    err: "x",
    interrupted: "-",
    done: ">",
    rail: "|",
    branch: "-",
    prompt: ">",
    frames: ["|", "/", "-", "\\"]
  }
};

const lookOf = ({ ui, active, surface, copy }) => ({
  ui,
  skin: active.skin,
  icons: ICONS[active.prefs.icons],
  prefs: active.prefs,
  surface,
  ...surface !== "terminal" && ui.Svg !== undefined ? { svg: ui.Svg } : {},
  ...copy === undefined ? {} : { copy }
});

const SIZE$1 = (name) => new RegExp(`^<svg\\b[^>]*?\\s${name}="([\\d.]+)"`);
const sizeOf = (source, name) => {
  const found = SIZE$1(name).exec(source);
  return found === null ? undefined : Number(found[1]);
};
function movingSvg(Svg, motion) {
  const seen = new Map;
  return (props) => {
    const nth = seen.get(props.alt) ?? 0;
    seen.set(props.alt, nth + 1);
    const key = `${props.alt}#${nth}`;
    const boxed = { ...props, width: props.width ?? sizeOf(props.source, "width"), height: props.height ?? sizeOf(props.source, "height") };
    return h(Svg, {
      key,
      ...motion.pic(key, boxed)
    });
  };
}
const movingLook = (look, motion) => look.svg === undefined ? look : { ...look, isFramed: true, svg: movingSvg(look.svg, motion) };
function opening(motion, open) {
  motion.reset();
  return open();
}

function parseFolders(raw, names) {
  const saved = typeof raw === "object" && raw !== null ? raw : {};
  return Object.fromEntries(Object.entries(saved).map(([folder, prefs]) => [folder, parsePrefs(prefs, names)]));
}
const prefsFor = (folder, folders, fallback) => (Object.hasOwn(folders, folder) ? folders[folder] : undefined) ?? fallback;
const withFolder = (folders, folder, prefs) => ({ ...folders, [folder]: prefs });
const withoutFolder = (folders, folder) => Object.fromEntries(Object.entries(folders).filter(([name]) => name !== folder));

const channels = (hex) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16)
];
const toHex = (rgb) => `#${rgb.map((value) => Math.round(Math.max(0, Math.min(255, value))).toString(16).padStart(2, "0")).join("")}`;
const deepen = (hex, amount) => toHex(channels(hex).map((value) => value * (1 - amount)));
function toLight(palette) {
  const deep = (hex) => deepen(hex, 0.45);
  return {
    read: deep(palette.read),
    write: deep(palette.write),
    run: deep(palette.run),
    search: deep(palette.search),
    web: deep(palette.web),
    mcp: deep(palette.mcp),
    other: deep(palette.other),
    user: deep(palette.user),
    fg: "#1f1f1f",
    muted: "#6b6b6b",
    surface: "#ffffff",
    zebra: "#f2f2f2",
    ok: deepen(palette.ok, 0.5),
    err: deepen(palette.err, 0.25),
    warn: deepen(palette.warn, 0.5)
  };
}
const forTheme = (skin, isLight) => isLight ? { ...skin, palette: skin.light ?? toLight(skin.palette) } : skin;
const named = (value) => {
  const name = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (name.includes("light")) {
    return true;
  }
  return name.includes("dark") ? false : undefined;
};
const terminalLight = (colorfgbg) => {
  const bg = Number(colorfgbg?.split(";").at(-1));
  return colorfgbg === undefined || Number.isNaN(bg) ? undefined : bg === 7 || bg === 15;
};
const resolveLight = (hints) => named(hints.override) ?? named(hints.theme) ?? terminalLight(hints.colorfgbg) ?? (hints.systemDark === undefined ? false : !hints.systemDark);
function macDark(probe) {
  if (probe.exitCode === 0) {
    return probe.stdout.trim() === "Dark";
  }
  return /does not exist|Could not find key/.test(probe.stderr) ? false : undefined;
}
const gnomeDark = (probe) => probe.exitCode === 0 ? probe.stdout.includes("dark") : undefined;

const BAND_OFF_KEY = "migrated.bandOff";
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const bandOff = (prefs) => isRecord(prefs) ? { ...prefs, band: false } : prefs;
const foldersBandOff = (folders) => isRecord(folders) ? Object.fromEntries(Object.entries(folders).map(([folder, prefs]) => [folder, bandOff(prefs)])) : folders;
function bandOffWrites(marker, prefs, folders) {
  if (marker === true) {
    return [];
  }
  return [
    ...isRecord(prefs) ? [["prefs", bandOff(prefs)]] : [],
    ...isRecord(folders) ? [["folders", foldersBandOff(folders)]] : [],
    [BAND_OFF_KEY, true]
  ];
}

async function activeSkin(host) {
  const prefs = await host.prefs();
  const custom = await host.custom();
  const skin = resolveSkin(prefs.skin, custom);
  return skin === undefined ? null : { prefs, skin: forTheme(skin, await host.isLight()), custom };
}
function parseCustom(raw) {
  const saved = typeof raw === "object" && raw !== null ? raw : {};
  return Object.fromEntries(Object.values(saved).map((draft) => buildCustom(draft, undefined)).filter((skin) => typeof skin !== "string").map((skin) => [skin.name, skin]));
}
async function migrateBandOff(host) {
  const writes = bandOffWrites(await host.storeGet(BAND_OFF_KEY), await host.storeGet("prefs"), await host.storeGet("folders"));
  for (const [key, value] of writes) {
    await host.storeSet(key, value);
  }
}
async function load(host) {
  await migrateBandOff(host);
  const custom = parseCustom(await host.storeGet("custom"));
  const names = skinNames(custom);
  const folders = parseFolders(await host.storeGet("folders"), names);
  const folder = await host.cwd();
  const prefs = prefsFor(folder, folders, parsePrefs(await host.storeGet("prefs"), names));
  await host.setCustom(custom);
  await host.setPrefs(prefs);
  await host.setPinned(Object.hasOwn(folders, folder));
}
async function savePrefs(host, prefs) {
  if (!await host.isPinned()) {
    await host.storeSet("prefs", prefs);
    return;
  }
  const names = skinNames(await host.custom());
  const folders = parseFolders(await host.storeGet("folders"), names);
  await host.storeSet("folders", withFolder(folders, await host.cwd(), prefs));
}
async function commit(host, state) {
  await host.setCustom(state.custom);
  await host.setPrefs(state.prefs);
  await host.storeSet("custom", state.custom);
  await savePrefs(host, state.prefs);
  await syncHub(host);
}
async function syncHub(host) {
  const detail = hubDetail((await host.prefs()).skin, await host.isLight());
  if ((await host.hub()).detail === detail)
    return;
  const at = await host.now();
  await host.setHub({ pane: HUB_PANE, detail, tone: "idle", at });
}
const FOLDER_WORDS = new Set(["pin", "unpin", "share"]);
const isFolderWord = (word) => FOLDER_WORDS.has(word);
async function runFolderCommand(host, word) {
  const folder = await host.cwd();
  const custom = await host.custom();
  const names = skinNames(custom);
  const folders = parseFolders(await host.storeGet("folders"), names);
  const prefs = await host.prefs();
  switch (word) {
    case "pin":
      await host.storeSet("folders", withFolder(folders, folder, prefs));
      await host.setPinned(true);
      return say().pin;
    case "unpin": {
      const fallback = parsePrefs(await host.storeGet("prefs"), names);
      await host.storeSet("folders", withoutFolder(folders, folder));
      await host.setPinned(false);
      await host.setPrefs(fallback);
      await syncHub(host);
      return say().unpin(fallback.skin);
    }
    default:
      await host.storeSet("prefs", prefs);
      return say().share(prefs.skin);
  }
}

const SEPARATOR = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;
const FENCE = /^\s*(```|~~~)\s*([\w+#.-]*)/;
function hardBreaks(markdown) {
  const lines = markdown.split(`
`);
  let inFence = false;
  return lines.map((line, i) => {
    if (FENCE.test(line)) {
      inFence = !inFence;
      return line;
    }
    const isParted = line.trim() === "" || (lines[i + 1] ?? "").trim() === "";
    return inFence || isParted || / {2}$/.test(line) || line.endsWith("\\") ? line : `${line}  `;
  }).join(`
`);
}
const clean = (cell) => cell.replace(/\*\*|__|`/g, "").replace(/\\\|/g, "|").trim();
function cellsOf(line) {
  const inner = line.trim().replace(/^\|/, "").replace(/(?<!\\)\|$/, "");
  return inner.split(/(?<!\\)\|/).map(clean);
}
const alignOf = (cell) => {
  const spec = cell.trim();
  if (spec.startsWith(":") && spec.endsWith(":")) {
    return "center";
  }
  return spec.endsWith(":") ? "right" : "left";
};
const fit = (cells, width) => Array.from({ length: width }, (_, i) => cells[i] ?? "");
function codeAt(lines, i, fence) {
  const close = lines.findIndex((other, j) => j > i && FENCE.test(other) && other.trim().replace(/[`~]/g, "") === "");
  if (close === -1) {
    return null;
  }
  return {
    segment: {
      kind: "code",
      lang: (fence[2] ?? "").toLowerCase(),
      code: lines.slice(i + 1, close).join(`
`),
      raw: lines.slice(i, close + 1).join(`
`)
    },
    end: close
  };
}
function tableAt(lines, i) {
  const line = lines[i] ?? "";
  const next = lines[i + 1] ?? "";
  const header = cellsOf(line);
  const isTable = line.includes("|") && SEPARATOR.test(next) && header.length > 1 && cellsOf(next).length === header.length;
  if (!isTable) {
    return null;
  }
  const rows = [];
  let end = i + 2;
  while (end < lines.length && (lines[end] ?? "").includes("|") && (lines[end] ?? "").trim() !== "") {
    rows.push(fit(cellsOf(lines[end] ?? ""), header.length));
    end++;
  }
  return { segment: { kind: "table", header, align: cellsOf(next).map(alignOf), rows }, end: end - 1 };
}
function splitReply(markdown) {
  const lines = markdown.split(`
`);
  const segments = [];
  let text = [];
  let inFence = false;
  const flush = () => {
    if (text.join(`
`).trim() !== "") {
      segments.push({ kind: "text", text: text.join(`
`) });
    }
    text = [];
  };
  for (let i = 0;i < lines.length; i++) {
    const fence = FENCE.exec(lines[i] ?? "");
    const code = fence === null || inFence ? null : codeAt(lines, i, fence);
    if (fence !== null && code === null) {
      inFence = !inFence;
    }
    const found = code ?? (inFence ? null : tableAt(lines, i));
    if (found === null) {
      text.push(lines[i] ?? "");
      continue;
    }
    flush();
    segments.push(found.segment);
    i = found.end;
  }
  flush();
  return segments;
}
const WIDE = [
  [4352, 4447],
  [11904, 12350],
  [12353, 13311],
  [13312, 19903],
  [19968, 40959],
  [40960, 42191],
  [43360, 43391],
  [44032, 55203],
  [63744, 64255],
  [65040, 65049],
  [65072, 65135],
  [65280, 65376],
  [65504, 65510],
  [127744, 128591],
  [128640, 128767],
  [129280, 129535],
  [129648, 129791],
  [131072, 262141]
];
const charWidth = (char) => {
  const code = char.codePointAt(0) ?? 0;
  if (/\p{Mn}|\p{Me}|\u200d|[\ufe00-\ufe0f]|\p{Emoji_Modifier}/u.test(char)) {
    return 0;
  }
  return WIDE.some(([from, to]) => code >= from && code <= to) ? 2 : 1;
};
const widthOf$1 = (text) => [...text].reduce((sum, char) => sum + charWidth(char), 0);
function columnWidths(table, maxWidth, gap) {
  const widths = table.header.map((cell, col) => Math.max(widthOf$1(cell), ...table.rows.map((row) => widthOf$1(row[col] ?? ""))));
  const budget = maxWidth - gap * (widths.length - 1);
  while (widths.reduce((sum, width) => sum + width, 0) > budget) {
    const widest = widths.indexOf(Math.max(...widths));
    if ((widths[widest] ?? 0) <= 3) {
      break;
    }
    widths[widest] = (widths[widest] ?? 0) - 1;
  }
  return widths;
}
function breakWord(word, width, measure) {
  const pieces = [];
  let piece = "";
  for (const char of word) {
    if (piece !== "" && measure(piece + char) > width) {
      pieces.push(piece);
      piece = char;
    } else {
      piece += char;
    }
  }
  return piece === "" ? pieces : [...pieces, piece];
}
function wrapLines(text, width, { maxLines = 1 / 0, measure = widthOf$1 } = {}) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line === "" ? word : `${line} ${word}`;
    if (measure(candidate) <= width) {
      line = candidate;
      continue;
    }
    if (line !== "") {
      lines.push(line);
    }
    const pieces = measure(word) <= width ? [word] : breakWord(word, width, measure);
    lines.push(...pieces.slice(0, -1));
    line = pieces.at(-1) ?? "";
  }
  const all = line === "" ? lines : [...lines, line];
  if (all.length <= maxLines) {
    return all.length === 0 ? [""] : all;
  }
  const kept = all.slice(0, maxLines);
  const chars = [...kept[maxLines - 1] ?? ""];
  while (chars.length > 0 && measure(`${chars.join("")}…`) > width) {
    chars.pop();
  }
  return [...kept.slice(0, -1), `${chars.join("")}…`];
}

const FONT = `ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Inter, sans-serif`;
const MONO = `ui-monospace, 'Cascadia Code', 'JetBrains Mono', Consolas, monospace`;
const escape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function measure$1(text, isMono, size) {
  if (isMono) {
    return [...text].reduce((sum, char) => sum + charWidth(char), 0) * size * 0.6;
  }
  return [...text].reduce((sum, char) => {
    const cells = charWidth(char);
    if (cells !== 1) {
      return sum + cells * size * 0.5;
    }
    if ("iljtf.,:;|!'` ".includes(char)) {
      return sum + size * 0.3;
    }
    if ("mwMW@%".includes(char)) {
      return sum + size * 0.82;
    }
    return sum + (char >= "A" && char <= "Z" ? size * 0.64 : size * 0.54);
  }, 0);
}
function fitText(text, width, { isMono, size }) {
  if (measure$1(text, isMono, size) <= width) {
    return text;
  }
  const chars = [...text];
  while (chars.length > 1 && measure$1(`${chars.join("")}…`, isMono, size) > width) {
    chars.pop();
  }
  return `${chars.join("")}…`;
}
const PX_PER_COLUMN = 7.2;
const cardWidth = (columns, min = 480, max = 1600) => Math.round(Math.min(max, Math.max(min, columns * PX_PER_COLUMN)));
const MOTION = [
  ".rise{opacity:0;animation:rise .45s cubic-bezier(.2,.8,.2,1) forwards}",
  ".card{animation:fade .3s ease-out}",
  "@keyframes rise{from{opacity:0;transform:translateY(5px)}to{opacity:1}}",
  "@keyframes fade{from{opacity:0}to{opacity:1}}",
  "@media (prefers-reduced-motion:reduce){.rise,.card{animation:none;opacity:1}}"
].join("");
const SETTLED = "<style>.rise,.card,.row,.rule{animation:none!important;opacity:1!important}.rule{stroke-dashoffset:0!important}</style>";
const settled = (source) => source.replace(/<\/svg>\s*$/, `${SETTLED}</svg>`);
const riseDelay = (index, stepMs, startMs = 80) => `style="animation-delay:${startMs + index * stepMs}ms"`;
const RADIUS$1 = 12;
const CONTROL_SLOT = 84;
const HEADER_MID = 29;
function svgCard({ width, height, palette, style = "", body }) {
  const clip = `corners-${width}x${height}`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<defs><clipPath id="${clip}"><rect width="${width}" height="${height}" rx="${RADIUS$1}"/></clipPath></defs>`,
    `<style>text{fill:${palette.fg}}text:not([font-family]){font-family:${FONT}}${MOTION}${style}</style>`,
    `<g class="card"><g clip-path="url(#${clip})">${body}</g>`,
    `<rect x=".5" y=".5" width="${width - 1}" height="${height - 1}" rx="${RADIUS$1 - 0.5}" fill="none" stroke="${palette.fg}" stroke-opacity=".16"/></g>`,
    `</svg>`
  ].join("");
}
const tint = (palette, { y, width, height, opacity = 0.05 }) => `<rect y="${y}" width="${width}" height="${height}" fill="${palette.fg}" fill-opacity="${opacity}"/>`;
function pill(palette, { right, y, text, color }) {
  const width = Math.ceil(measure$1(text, true, 11) + 16);
  const left = right - width;
  return `<rect x="${left}" y="${y}" width="${width}" height="20" rx="10" fill="${color}" fill-opacity=".14"/><text x="${left + width / 2}" y="${y + 14}" text-anchor="middle" font-family="${MONO}" font-size="11" style="fill:${color}">${escape(text)}</text>`;
}
const strokeIcon = (path, { x, y, size, color }) => `<g transform="translate(${x} ${y}) scale(${size / 24})" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${path}</g>`;

const HEADER_H$3 = 56;
const LINE_H$3 = 20;
const CODE$4 = 12.5;
const MAX_LINES$1 = 80;
const KEYWORDS = new Set([
  "const",
  "let",
  "var",
  "function",
  "return",
  "if",
  "else",
  "for",
  "while",
  "switch",
  "case",
  "break",
  "continue",
  "import",
  "from",
  "export",
  "default",
  "class",
  "new",
  "async",
  "await",
  "try",
  "catch",
  "throw",
  "type",
  "interface",
  "extends",
  "implements",
  "def",
  "fn",
  "pub",
  "struct",
  "impl",
  "enum",
  "match",
  "use",
  "mod",
  "true",
  "false",
  "null",
  "undefined",
  "None",
  "True",
  "False",
  "self",
  "this",
  "in",
  "of",
  "as",
  "with",
  "lambda",
  "yield",
  "static",
  "public",
  "private",
  "protected",
  "void"
]);
const HASH_COMMENTS = new Set(["py", "python", "sh", "bash", "zsh", "shell", "yaml", "yml", "toml", "ps1", "powershell", "rb", "ruby", "r"]);
const GROUP_ROLES = ["comment", "string", "number"];
function roleOf(match, text) {
  const group = GROUP_ROLES.find((_, i) => match[i + 1] !== undefined);
  if (group !== undefined) {
    return group;
  }
  return KEYWORDS.has(text) ? "keyword" : "plain";
}
function tokenize(line, lang) {
  const comment = HASH_COMMENTS.has(lang) ? "#.*$" : "\\/\\/.*$|--\\s.*$";
  const pattern = new RegExp(`(${comment})|("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*'|\`[^\`]*\`)|(\\b\\d[\\d_.]*\\b)|([A-Za-z_][\\w]*)`, "g");
  const tokens = [];
  let last = 0;
  for (const match of line.matchAll(pattern)) {
    const at = match.index ?? 0;
    const plain = line.slice(last, at);
    if (plain !== "") {
      tokens.push({ text: plain, role: "plain" });
    }
    const [text = ""] = match;
    tokens.push({ text, role: roleOf(match, text) });
    last = at + text.length;
  }
  return line.slice(last) === "" ? tokens : [...tokens, { text: line.slice(last), role: "plain" }];
}
function cutTokens(tokens, max) {
  let room = max;
  const kept = [];
  for (const token of tokens) {
    if (room <= 0) {
      break;
    }
    const chars = [...token.text];
    if (chars.length <= room) {
      kept.push(token);
      room -= chars.length;
    } else {
      kept.push({ text: `${chars.slice(0, Math.max(0, room - 1)).join("")}…`, role: token.role });
      room = 0;
    }
  }
  return kept;
}
function codeSvg(code, lang, { palette, width, hasControl = false }) {
  const all = code.replace(/\t/g, "  ").split(`
`);
  const lines = all.slice(0, MAX_LINES$1);
  const gutter = String(all.length).length * 8 + 24;
  const maxChars = Math.floor((width - gutter - 24) / (CODE$4 * 0.6));
  const color = {
    plain: palette.fg,
    comment: palette.muted,
    string: palette.read,
    number: palette.warn,
    keyword: palette.user
  };
  const rows = lines.map((line, i) => {
    const top = HEADER_H$3 + 8 + i * LINE_H$3;
    const spans = cutTokens(tokenize(line, lang), maxChars).map((token) => `<tspan style="fill:${color[token.role]}${token.role === "keyword" ? ";font-weight:600" : ""}${token.role === "comment" ? ";font-style:italic" : ""}">${escape(token.text)}</tspan>`).join("");
    return `<g class="rise" ${riseDelay(i, 12, 60)}><text x="${gutter - 12}" y="${top + 14}" text-anchor="end" font-family="${MONO}" font-size="11" style="fill:${palette.muted};fill-opacity:.7">${i + 1}</text><text x="${gutter}" y="${top + 14}" font-family="${MONO}" font-size="${CODE$4}" xml:space="preserve">${spans}</text></g>`;
  });
  const hidden = all.length - lines.length;
  const footer = hidden > 0 ? `<text x="${gutter}" y="${HEADER_H$3 + 8 + lines.length * LINE_H$3 + 14}" font-size="11.5" style="fill:${palette.muted}">${escape(say().moreLines(hidden))}</text>` : "";
  const height = HEADER_H$3 + 8 + lines.length * LINE_H$3 + (hidden > 0 ? 28 : 10);
  const header = [
    `<text x="16" y="${HEADER_MID + 4}" font-size="12" style="fill:${palette.muted};font-weight:600">${escape(lang || say().code)}</text>`,
    `<text x="${width - 16 - (hasControl ? CONTROL_SLOT : 0)}" y="${HEADER_MID + 4}" text-anchor="end" font-size="11" style="fill:${palette.muted}">${all.length} line${all.length === 1 ? "" : "s"}</text>`,
    `<line x1="0" y1="${HEADER_H$3 - 0.5}" x2="${width}" y2="${HEADER_H$3 - 0.5}" stroke="${palette.muted}" stroke-opacity=".3"/>`,
    `<g transform="translate(0 ${HEADER_H$3})">${tint(palette, { y: 0, width: gutter - 4, height: height - HEADER_H$3, opacity: 0.04 })}</g>`
  ].join("");
  return {
    source: svgCard({ width, height, palette, body: header + rows.join("") + footer }),
    width,
    height,
    alt: `${lang || "code"}:
${fitText(code, 4000, { isMono: true, size: CODE$4 })}`
  };
}

const MAX_MARKDOWN = 9000;
const MAX_PROMPT = 4000;
const TYPED = new Set(["composer", "bridge", "sdk"]);
const isOwnPrompt = ({ origin, text }) => TYPED.has(origin.kind) && text.length <= MAX_PROMPT;
function cardSegments(text) {
  if (!/\||```|~~~/.test(text)) {
    return null;
  }
  const segments = splitReply(text);
  const fits = segments.every((segment) => segment.kind === "table" || (segment.kind === "text" ? hardBreaks(segment.text) : segment.raw).length <= MAX_MARKDOWN);
  const isCodeWhole = segments.every((segment) => segment.kind !== "code" || segment.code.split(`
`).length <= MAX_LINES$1);
  return fits && isCodeWhole && segments.some((segment) => segment.kind !== "text") ? segments : null;
}
const headersOf = (questions) => questions.map((question) => question?.header).filter((header) => typeof header === "string" && header !== "");

const RING_R = 9;
const ITEM_W = 132;
const contextLabel = () => say().context;
function limitLabel(kind) {
  const name = kind.toLowerCase();
  if (name.includes("five") || name.includes("5h") || name.includes("5_h")) {
    return say().fiveHour;
  }
  if (name.includes("seven") || name.includes("7d") || name.includes("week")) {
    return say().sevenDay;
  }
  return name.replace(/_/g, " ");
}
function contextPercent(context) {
  const compactsAt = context.breakdown?.rawMaxTokens;
  if (context.tokens !== undefined && compactsAt !== undefined && compactsAt > 0 && compactsAt < context.window) {
    return Math.min(100, Math.round(context.tokens / compactsAt * 100));
  }
  return context.percent ?? null;
}
const usageSnap = (usage) => ({
  context: contextPercent(usage.context),
  limits: usage.rateLimits.map((limit) => ({ label: limitLabel(limit.kind), percent: limit.percentUsed }))
});
function metersOf(usage) {
  return [
    ...usage.context === null ? [] : [{ label: contextLabel(), percent: usage.context }],
    ...usage.limits.map((limit) => ({ label: limit.label, percent: limit.percent }))
  ].map((meter) => ({ ...meter, percent: Math.max(0, Math.min(100, Math.round(meter.percent))) }));
}
function meterColor(percent, palette) {
  if (percent >= 95) {
    return palette.err;
  }
  return percent >= 80 ? palette.warn : palette.user;
}
function usageSvg(meters, palette) {
  const width = meters.length * ITEM_W;
  const height = 30;
  const circumference = 2 * Math.PI * RING_R;
  const items = meters.map((meter, i) => {
    const x = i * ITEM_W + RING_R + 4;
    const filled = circumference * meter.percent / 100;
    const color = meterColor(meter.percent, palette);
    return [
      `<circle cx="${x}" cy="15" r="${RING_R}" fill="none" stroke="${palette.muted}" stroke-opacity=".25" stroke-width="3"/>`,
      `<circle class="fill" cx="${x}" cy="15" r="${RING_R}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-dasharray="${filled} ${circumference}" transform="rotate(-90 ${x} 15)" style="--len:${filled}"/>`,
      `<text x="${x + RING_R + 8}" y="19.5" font-size="12.5"><tspan style="fill:${palette.fg};font-weight:600">${say().percent(meter.percent)}</tspan><tspan style="fill:${palette.muted}"> ${escape(meter.label)}</tspan></text>`
    ].join("");
  }).join("");
  const style = [
    `text{font-family:${FONT}}`,
    ".fill{animation:fill .9s cubic-bezier(.2,.8,.2,1)}",
    "@keyframes fill{from{stroke-dasharray:0 100}}",
    "@media (prefers-reduced-motion:reduce){.fill{animation:none}}"
  ].join("");
  return {
    source: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><style>${style}</style>${items}</svg>`,
    width,
    height,
    alt: meters.map((meter) => `${meter.label} ${say().percent(meter.percent)}`).join(", ")
  };
}
function usageLine(meters) {
  return meters.map((meter) => {
    const filled = Math.round(meter.percent / 12.5);
    return { label: meter.label, bar: "▰".repeat(filled) + "▱".repeat(8 - filled), percent: meter.percent };
  });
}

const COMPACT_NUDGE = 70;
const COMPACT_HOTKEY = "0";
function meterView(look, meters) {
  const { Box, Text } = look.ui;
  const { palette } = look.skin;
  if (look.svg !== undefined) {
    const Svg = look.svg;
    const built = usageSvg(meters, palette);
    return h(Svg, {
      source: built.source,
      alt: built.alt,
      width: built.width,
      height: built.height
    });
  }
  return h(Box, {
    flexDirection: "row",
    columnGap: 3
  }, usageLine(meters).map((meter) => h(Text, {
    color: palette.muted
  }, h(Text, {
    color: palette.user
  }, meter.bar), ` ${say().percent(meter.percent)} ${meter.label}`)));
}
function usageBand(look, { meters, canCompact, compact }) {
  const { Box, Text, Button } = look.ui;
  const { palette } = look.skin;
  const context = meters.find((meter) => meter.label === contextLabel())?.percent ?? 0;
  const isNudge = context >= COMPACT_NUDGE;
  return h(Box, {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 2,
    paddingRight: 5
  }, meterView(look, meters), h(Box, {
    flexGrow: 1
  }), canCompact && isNudge ? h(Text, {
    color: palette.warn
  }, say().contextFull(context)) : "", canCompact ? h(Button, {
    key: "compact",
    label: isNudge ? say().compactNow : say().compact,
    hotkey: COMPACT_HOTKEY,
    plain: true,
    ...isNudge ? { variant: "primary" } : { dimColor: true },
    onPress: compact
  }) : "");
}

const oneLine = (text) => (text.split(`
`, 1)[0] ?? "").replace(/\s+/g, " ").trim();
const slashed = (path) => path.replace(/\\/g, "/");
function shortenPath(path, cwd) {
  const full = slashed(path);
  const root = slashed(cwd).replace(/\/+$/, "");
  if (root === "" || !full.toLowerCase().startsWith(`${root.toLowerCase()}/`)) {
    return path;
  }
  return full.slice(root.length + 1);
}
function formatDuration(ms) {
  const seconds = Math.round(ms / 1000);
  if (seconds < 1) {
    return "<1s";
  }
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}
function formatMs(ms) {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return ms < 60000 ? `${(ms / 1000).toFixed(1)}s` : formatDuration(ms);
}
function diffstat(output) {
  const patch = output?.structuredPatch;
  if (!Array.isArray(patch)) {
    return null;
  }
  const lines = patch.flatMap((hunk) => {
    const hunkLines = hunk?.lines;
    return Array.isArray(hunkLines) ? hunkLines.filter((line) => typeof line === "string") : [];
  });
  return {
    added: lines.filter((line) => line.startsWith("+")).length,
    removed: lines.filter((line) => line.startsWith("-")).length
  };
}
function pick(items, seed) {
  let hash = 5381;
  for (let i = 0;i < seed.length; i++) {
    hash = hash * 33 + seed.charCodeAt(i) >>> 0;
  }
  return items[hash % items.length];
}
function clipLines(text, head, tail) {
  const lines = text.split(`
`);
  const hidden = lines.length - head - tail;
  if (hidden <= 1) {
    return text;
  }
  return [
    ...lines.slice(0, head),
    `… ${hidden} lines hidden`,
    ...lines.slice(lines.length - tail)
  ].join(`
`);
}

const PATHS = {
  run: '<path d="M5 7l5 5-5 5"/><path d="M12 18h7"/>',
  write: '<path d="M4 20h4L18.5 9.5a2.83 2.83 0 0 0-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
  read: '<path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/><path d="M9 13h6M9 17h4"/>',
  search: '<circle cx="10" cy="10" r="6.5"/><path d="M20 20l-5.2-5.2"/>',
  web: '<circle cx="12" cy="12" r="8.5"/><path d="M3.8 9.5h16.4M3.8 14.5h16.4"/><path d="M11.5 3.5a15 15 0 0 0 0 17M12.5 3.5a15 15 0 0 1 0 17"/>',
  mcp: '<path d="M9.8 6.2l8 8-2 2a5.66 5.66 0 0 1-8-8z"/><path d="M4 20l3.6-3.6M15 4l-3.4 3.4M20 9l-3.4 3.4"/>',
  other: '<circle cx="12" cy="12" r="3"/>'
};
const SPIN = [
  ".spin{transform-box:view-box;transform-origin:12px 12px;animation:spin .9s linear infinite}",
  "@keyframes spin{to{transform:rotate(360deg)}}"
].join("");
const svg = (size, style, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"><style>${style}</style>${body}</svg>`;
function toolIcon(kind, color, isRunning) {
  const stroke = `<g fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${PATHS[kind]}</g>`;
  if (!isRunning) {
    return svg(16, "", stroke);
  }
  const shrunk = `<g transform="translate(5 5) scale(.58)">${stroke}</g>`;
  const arc = `<circle class="spin" cx="12" cy="12" r="10.5" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="18 48"/>`;
  return svg(16, SPIN, shrunk + arc);
}
const fillOf = (color) => `fill="${color}"`;
const thinkingIcon = (color) => svg(20, [
  ".core,.wave{transform-box:view-box;transform-origin:12px 12px}",
  ".core{animation:breathe 1.6s ease-in-out infinite}",
  ".wave{animation:wave 1.6s ease-out infinite}",
  "@keyframes breathe{0%,100%{transform:scale(.75);opacity:.7}50%{transform:scale(1.05);opacity:1}}",
  "@keyframes wave{from{transform:scale(1);opacity:.55}to{transform:scale(2.7);opacity:0}}"
].join(""), `<circle class="wave" cx="12" cy="12" r="4" fill="none" stroke="${color}" stroke-width="1"/><circle class="core" cx="12" cy="12" r="4" ${fillOf(color)}/>`);
const toolUseIcon = (color) => svg(20, SPIN, `<circle cx="12" cy="12" r="8" fill="none" stroke="${color}" stroke-opacity=".18" stroke-width="2"/><circle class="spin" cx="12" cy="12" r="8" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-dasharray="14 40"/>`);
const respondingIcon = (color) => svg(20, [
  ".bar{transform-box:fill-box;transform-origin:center bottom;animation:eq .9s ease-in-out infinite}",
  ".b2{animation-delay:.15s}.b3{animation-delay:.3s}",
  "@keyframes eq{0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1)}}"
].join(""), [5, 10.5, 16].map((x, i) => `<rect class="bar b${i + 1}" x="${x}" y="5" width="3" height="14" rx="1.5" ${fillOf(color)}/>`).join(""));
const waitingIcon = (color) => svg(20, [
  ".dot{transform-box:fill-box;transform-origin:center;animation:hop 1.1s ease-in-out infinite}",
  ".d2{animation-delay:.15s}.d3{animation-delay:.3s}",
  "@keyframes hop{0%,60%,100%{transform:translateY(0);opacity:.45}30%{transform:translateY(-4px);opacity:1}}"
].join(""), [6, 12, 18].map((x, i) => `<circle class="dot d${i + 1}" cx="${x}" cy="13" r="2.2" ${fillOf(color)}/>`).join(""));
const SPINNERS = {
  thinking: thinkingIcon,
  "tool-use": toolUseIcon,
  responding: respondingIcon
};
function spinnerIcon(mode, color) {
  return (SPINNERS[mode] ?? waitingIcon)(color);
}

function desktopSpinnerRow(look, { Svg, mode, text }) {
  const { Box, Text } = look.ui;
  return h(Box, {
    flexDirection: "row",
    columnGap: 1,
    alignItems: "center"
  }, h(Svg, {
    source: spinnerIcon(mode, look.skin.palette.user),
    alt: mode,
    width: 20,
    height: 20
  }), h(Text, {
    color: look.skin.palette.muted
  }, text));
}
function promptRow(look, text, images) {
  const { Box, Text } = look.ui;
  return h(Box, {
    flexDirection: "column",
    alignItems: "flex-start",
    marginY: 1
  }, h(Box, {
    borderStyle: "round",
    borderColor: look.skin.palette.muted,
    paddingX: 1,
    flexShrink: 1
  }, h(Text, {
    color: look.skin.palette.fg
  }, text)), images ?? "");
}
const shadeOf = (palette, distance) => [palette.fg, palette.user][distance] ?? palette.muted;
function shadeRuns(palette, letters, head) {
  const runs = [];
  for (const [i, letter] of letters.entries()) {
    const color = shadeOf(palette, Math.abs(i - head));
    const last = runs.at(-1);
    if (last?.color === color) {
      last.text += letter;
    } else {
      runs.push({ color, text: letter });
    }
  }
  return runs;
}
function spinnerRow(look, { word, frame, elapsedMs }) {
  const { Text } = look.ui;
  const { palette } = look.skin;
  const letters = [...word];
  const head = frame % (letters.length + 8) - 4;
  const runs = shadeRuns(palette, letters, head);
  return h(Text, null, h(Text, {
    color: palette.user
  }, `${look.icons.frames[frame % look.icons.frames.length] ?? ""} `), runs.map((run) => h(Text, {
    color: run.color
  }, run.text)), h(Text, {
    color: palette.muted
  }, `…  ${formatDuration(elapsedMs)}`));
}
function footerRow(look, { word, durationMs, stats }) {
  const { Text } = look.ui;
  const { palette } = look.skin;
  const facts = [
    ...stats === undefined || stats.tools === 0 ? [] : [say().tools(stats.tools)]
  ];
  const hasDiff = stats !== undefined && stats.added + stats.removed > 0;
  return h(Text, {
    color: palette.muted
  }, h(Text, {
    color: palette.user
  }, `${look.icons.done} `), `${word} · ${formatDuration(durationMs)}`, facts.length > 0 ? `  ·  ${facts.join("  ·  ")}` : "", hasDiff ? "  ·  " : "", hasDiff ? h(Text, {
    color: palette.ok
  }, `+${stats.added}`) : "", hasDiff ? h(Text, {
    color: palette.err
  }, ` −${stats.removed}`) : "");
}
function askBand(look, headers) {
  const { Text } = look.ui;
  const { palette } = look.skin;
  return h(Text, {
    color: palette.muted
  }, h(Text, {
    color: palette.user
  }, `${look.icons.prompt} `), headers.map((header, i) => h(Text, {
    color: i === 0 ? palette.fg : palette.muted,
    bold: i === 0
  }, `${i === 0 ? "" : "  ·  "}${header}`)));
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

const COLS = 120;
const ROWS = 9;
const CELL = 8;
const LINE = 13;
const FONT_SIZE = 12;
const SPRITE_SIZE = 15;
const BASELINE = LINE - 3;
const RADIUS = 12;
const EDGE = 200;
const TAIL = 40;
const TOP_OUT = 70;
const GLINT_RATE = 0.035;
const WAVE = 0.25;
const GRAIN = 0.3;
const SCENE_WIDTH = COLS * CELL;
const SCENE_HEIGHT = ROWS * LINE + 3;
const KEYFRAMES = [
  `@keyframes sr{from{transform:translateX(-${EDGE}px)}to{transform:translateX(${SCENE_WIDTH + TAIL}px)}}`,
  `@keyframes sl{from{transform:translateX(${SCENE_WIDTH + TAIL}px)}to{transform:translateX(-${EDGE}px)}}`,
  `@keyframes up{from{transform:translateY(${SCENE_HEIGHT + 10}px)}to{transform:translateY(-${TOP_OUT}px)}}`,
  "@keyframes bob{from{transform:translateY(0)}to{transform:translateY(-4px)}}",
  "@keyframes sway{from{transform:translateX(-5px)}to{transform:translateX(5px)}}",
  "@keyframes tw{0%,100%{opacity:.1}50%{opacity:1}}",
  `@keyframes fl{from{transform:translateX(0)}to{transform:translateX(-${SCENE_WIDTH}px)}}`,
  `@keyframes fr{from{transform:translateX(-${SCENE_WIDTH}px)}to{transform:translateX(0)}}`,
  "@media (prefers-reduced-motion:reduce){*{animation:none!important}}"
].join("");
const GLOW = '<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.5" result="b"/>' + '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
function grain(x, y, seed) {
  const h = Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263) ^ Math.imul(seed, 1274126177);
  return (Math.imul(h ^ h >>> 13, 1103515245) >>> 0) / 2 ** 32;
}
function mix(from, to, t) {
  const channel = (hex, at) => parseInt(hex.slice(at, at + 2), 16);
  const parts = [1, 3, 5].map((at) => Math.round(channel(from, at) * (1 - t) + channel(to, at) * t));
  return `#${parts.map((part) => part.toString(16).padStart(2, "0")).join("")}`;
}
function fieldRow(field, y, seed) {
  const ramp = Array.from(field.ramp);
  const depth = field.fill[0] + (field.fill[1] - field.fill[0]) * (y / (ROWS - 1));
  const cells = Array.from({ length: COLS * 2 }, (_, x) => {
    const c = x % COLS;
    const wave = Math.sin(6 * Math.PI * c / COLS + y * 0.9) * Math.sin(14 * Math.PI * c / COLS - y * 0.5);
    const d = depth + WAVE * wave + GRAIN * (grain(c, y, seed) - 0.5);
    return ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(d * ramp.length)))];
  });
  return cells.join("");
}
function glintRow(field, y, seed) {
  const glints = Array.from(field.glint);
  const cells = Array.from({ length: COLS * 2 }, (_, x) => {
    const c = x % COLS;
    return grain(c, y, seed + 1) < GLINT_RATE ? glints[c % glints.length] : " ";
  });
  return cells.join("");
}
const textRow = (text, y, fill) => `<text y="${y * LINE + BASELINE}" textLength="${SCENE_WIDTH * 2}" lengthAdjust="spacing"${fill === undefined ? "" : ` fill="${fill}"`}>${escape(text)}</text>`;
function fieldLayers(field, seed) {
  const rows = Array.from({ length: ROWS }, (_, y) => textRow(fieldRow(field, y, seed), y, mix(field.colors[0], field.colors[1], y / (ROWS - 1))));
  const drifting = `<g opacity=".85" style="animation:fl ${field.seconds}s linear infinite">${rows.join("")}</g>`;
  if (field.glint === "")
    return drifting;
  const glints = Array.from({ length: ROWS }, (_, y) => textRow(glintRow(field, y, seed), y));
  return `${drifting}<g fill="${field.glintColor}" style="animation:fr ${field.seconds * 1.5}s linear infinite">${glints.join("")}</g>`;
}
const loop = (name, seconds, share, timing = "linear", tail = "") => `animation:${name} ${seconds.toFixed(2)}s ${timing} -${(share * seconds).toFixed(2)}s infinite${tail}`;
function spriteAt(sprite, [row, col], i) {
  const x = col * CELL;
  const y = row * LINE;
  const art = sprite.art.map((line, k) => `<text y="${BASELINE + k * SPRITE_SIZE}">${escape(line)}</text>`).join("");
  const breath = 3 + i % 3;
  const bob = (inner) => `<g style="${loop("bob", breath, i / 3, "ease-in-out", " alternate")}">${inner}</g>`;
  switch (sprite.motion) {
    case "right":
    case "left": {
      const span = SCENE_WIDTH + TAIL + EDGE;
      const share = sprite.motion === "right" ? (x + EDGE) / span : (SCENE_WIDTH + TAIL - x) / span;
      return `<g transform="translate(0 ${y})"><g transform="translate(${x} 0)" style="${loop(sprite.motion === "right" ? "sr" : "sl", sprite.seconds, share)}">${bob(art)}</g></g>`;
    }
    case "rise": {
      const share = (SCENE_HEIGHT + 10 - y) / (SCENE_HEIGHT + 10 + TOP_OUT);
      const sway = `<g style="${loop("sway", breath, i / 3, "ease-in-out", " alternate")}">${art}</g>`;
      return `<g transform="translate(${x} 0)"><g transform="translate(0 ${y})" style="${loop("up", sprite.seconds, share)}">${sway}</g></g>`;
    }
    case "blink":
      return `<g transform="translate(${x} ${y})" style="${loop("tw", sprite.seconds, grain(col, row, i), "ease-in-out")}">${bob(art)}</g>`;
    case "float":
      return `<g transform="translate(${x} ${y})">${bob(art)}</g>`;
    case "still":
      return `<g transform="translate(${x} ${y})">${art}</g>`;
  }
}
const spriteLayer = (sprite) => `<g fill="${sprite.color}"${sprite.glows === true ? ' filter="url(#glow)"' : ""}>${sprite.at.map((at, i) => spriteAt(sprite, at, i)).join("")}</g>`;
function build(scene) {
  const seed = Array.from(scene.name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const box = `width="${SCENE_WIDTH}" height="${SCENE_HEIGHT}"`;
  const source = `<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" ${box} viewBox="0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}">` + `<style>:root{color-scheme:light dark}${KEYFRAMES}</style>` + `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${scene.sky[0]}"/><stop offset="1" stop-color="${scene.sky[1]}"/></linearGradient>` + `<clipPath id="edge"><rect ${box} rx="${RADIUS}"/></clipPath>${GLOW}</defs>` + `<g clip-path="url(#edge)" font-family="${MONO}" font-size="${FONT_SIZE}">` + `<rect ${box} fill="url(#sky)"/>${fieldLayers(scene.field, seed)}` + `<g font-size="${SPRITE_SIZE}" font-weight="700">${scene.sprites.map(spriteLayer).join("")}</g></g></svg>`;
  return { source, width: SCENE_WIDTH, height: SCENE_HEIGHT };
}
const built = new Map;
function sceneSvg(scene) {
  const cached = built.get(scene.name) ?? build(scene);
  built.set(scene.name, cached);
  return cached;
}

function sceneView(look, name) {
  const scene = sceneNamed(name);
  if (scene === undefined || look.svg === undefined)
    return;
  const Svg = look.svg;
  return h(Svg, {
    key: "scene",
    ...sceneSvg(scene),
    alt: say().sceneAlt(scene.label),
    isInteractive: true
  });
}
async function abovePromptView({ view, e, pass }) {
  const active = await view.active();
  if (active === null || e.props.hasSurvey) {
    return pass(e);
  }
  const look = view.look(active);
  const scene = sceneView(look, active.prefs.scene);
  const meters = active.prefs.band ? metersOf(await view.usage()) : [];
  if (scene === undefined && meters.length === 0) {
    return pass(e);
  }
  const { Box } = look.ui;
  const theirs = await pass(e);
  const isCompacting = await view.isCompacting();
  return pinned(e, h(Box, {
    flexDirection: "column"
  }, scene ?? "", meters.length === 0 ? "" : usageBand(look, { meters, canCompact: !e.props.isWorking && !isCompacting, compact: view.compact }), theirs));
}
async function askView({ view, e, pass }) {
  const active = await view.active();
  const theirs = await pass(e);
  if (active === null) {
    return theirs;
  }
  const headers = headersOf(e.props.questions);
  const look = view.look(active);
  const { Box } = look.ui;
  return headers.length === 0 ? theirs : h(Box, {
    flexDirection: "column"
  }, askBand(look, headers), theirs);
}

const CELL_PAD = 1;
const JUSTIFY = { left: "flex-start", right: "flex-end", center: "center" };
const NATURAL_SHARE = 0.55;
function cellSize({ widths, isFluid }, i) {
  return isFluid ? { width: 0, flexGrow: (widths[i] ?? 0) + CELL_PAD * 2, flexShrink: 1 } : { width: (widths[i] ?? 0) + CELL_PAD * 2, flexShrink: 0 };
}
function gridRow(look, columns, { cells, isHeader, band }) {
  const { Box, Text } = look.ui;
  const { table, widths } = columns;
  return h(Box, {
    flexDirection: "row",
    ...band === undefined ? {} : { backgroundColor: band }
  }, cells.map((cell, i) => h(Box, {
    ...cellSize(columns, i),
    flexDirection: "column",
    paddingX: CELL_PAD,
    alignItems: JUSTIFY[table.align[i] ?? "left"]
  }, wrapLines(cell, widths[i] ?? 0).map((line) => h(Text, {
    color: look.skin.palette.fg,
    bold: isHeader,
    wrap: "truncate-end"
  }, line)))));
}
function tableRows(look, table, { maxWidth, control }) {
  const { Box } = look.ui;
  const { palette } = look.skin;
  const widths = columnWidths(table, maxWidth - 4, CELL_PAD * 2);
  const natural = widths.reduce((sum, width) => sum + width + CELL_PAD * 2, 2);
  const columns = { table, widths, isFluid: natural > maxWidth * NATURAL_SHARE };
  return h(Box, {
    flexDirection: "column",
    marginY: 1,
    ...columns.isFluid ? { width: "100%" } : { alignSelf: "flex-start" }
  }, h(Box, {
    flexDirection: "column",
    borderStyle: "round",
    borderColor: palette.muted
  }, gridRow(look, columns, { cells: table.header, isHeader: true, band: palette.surface }), table.rows.map((cells, i) => gridRow(look, columns, { cells, isHeader: false, band: i % 2 === 1 ? palette.zebra : undefined }))), control === undefined ? "" : h(Box, {
    position: "absolute",
    top: 0,
    right: 2
  }, control));
}
const tableMarkdown = (table) => [table.header, table.header.map(() => "---"), ...table.rows].map((cells) => `| ${cells.join(" | ")} |`).join(`
`);
function copyButton(look, key, text) {
  const { Button } = look.ui;
  const copy = look.copy;
  return copy === undefined ? undefined : h(Button, {
    key,
    label: ` ${say().copy} `,
    plain: true,
    dimColor: true,
    onPress: () => copy(text)
  });
}
function copyRow(look, key, text) {
  const { Box, Button } = look.ui;
  const copy = look.copy;
  if (copy === undefined) {
    return "";
  }
  return h(Box, {
    flexDirection: "row",
    justifyContent: "flex-end"
  }, h(Button, {
    key,
    label: say().copy,
    plain: true,
    dimColor: true,
    onPress: () => copy(text)
  }));
}

const HEADER_H$2 = 44;
const LINE_H$2 = 22;
const GAP_H = 20;
const CODE$3 = 12.5;
const MAX_LINES = 30;
const CODE_X = 112;
const PENCIL = '<path d="M4 20h4L18.5 9.5a2.83 2.83 0 0 0-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>';
const NEW_FILE = '<path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/><path d="M12 11v6M9 14h6"/>';
function diffLines(hunks) {
  return hunks.flatMap((hunk, h) => {
    let oldNo = hunk.oldStart;
    let newNo = hunk.newStart;
    const lines = h === 0 ? [] : [{ kind: "gap", at: hunk.newStart }];
    for (const raw of hunk.lines) {
      if (raw.startsWith("\\")) {
        continue;
      }
      const text = raw.slice(1).replace(/\t/g, "  ");
      if (raw.startsWith("+")) {
        lines.push({ kind: "add", text, new: newNo++ });
      } else if (raw.startsWith("-")) {
        lines.push({ kind: "del", text, old: oldNo++ });
      } else {
        lines.push({ kind: "ctx", text, old: oldNo++, new: newNo++ });
      }
    }
    return lines;
  });
}
function hunksOf(output) {
  const record = typeof output === "object" && output !== null ? output : {};
  const path = typeof record.filePath === "string" ? record.filePath : "";
  const isNewFile = record.type === "create";
  const patch = Array.isArray(record.structuredPatch) ? record.structuredPatch : [];
  if (path === "") {
    return null;
  }
  if (patch.length > 0) {
    return { path, hunks: patch, isNewFile };
  }
  if (isNewFile && typeof record.content === "string") {
    return { path, hunks: [{ oldStart: 0, newStart: 1, lines: record.content.split(`
`).map((line) => `+${line}`) }], isNewFile };
  }
  return null;
}
const MARKS = {
  add: { sign: "+", color: "ok" },
  del: { sign: "−", color: "err" },
  ctx: { sign: "" }
};
function diffRows(shown, { palette, width }) {
  const codeWidth = width - CODE_X - 16;
  let y = HEADER_H$2;
  const rows = shown.map((line, i) => {
    const top = y;
    if (line.kind === "gap") {
      y += GAP_H;
      return `<g ${riseDelay(i, 18)} class="rise"><text x="${CODE_X}" y="${top + 14}" font-size="11" style="fill:${palette.muted}">⋯  ${say().lineAt(line.at)}</text></g>`;
    }
    y += LINE_H$2;
    const mark = MARKS[line.kind];
    const tint = mark.color === undefined ? undefined : palette[mark.color];
    const band = tint === undefined ? "" : `<rect y="${top}" width="${width}" height="${LINE_H$2}" fill="${tint}" fill-opacity=".1"/><rect y="${top}" width="2" height="${LINE_H$2}" fill="${tint}"/>`;
    const number = (value, x) => value === undefined ? "" : `<text x="${x}" y="${top + 15}" text-anchor="end" font-family="${MONO}" font-size="11" style="fill:${palette.muted}">${value}</text>`;
    return `<g ${riseDelay(i, 18)} class="rise">${band}${number(line.old, 44)}${number(line.new, 80)}<text x="96" y="${top + 15}" font-family="${MONO}" font-size="${CODE$3}" style="fill:${tint ?? palette.muted}">${mark.sign}</text><text x="${CODE_X}" y="${top + 15}" font-family="${MONO}" font-size="${CODE$3}" style="fill:${line.kind === "ctx" ? palette.muted : palette.fg}" xml:space="preserve">${escape(fitText(line.text, codeWidth, { isMono: true, size: CODE$3 }))}</text></g>`;
  });
  return { rows, bottom: y };
}
function diffSvg(input, shownPath, frame) {
  const { palette, width } = frame;
  const all = diffLines(input.hunks);
  const shown = all.slice(0, MAX_LINES);
  const hidden = all.length - shown.length;
  const added = all.filter((line) => line.kind === "add").length;
  const removed = all.filter((line) => line.kind === "del").length;
  const { rows, bottom: y } = diffRows(shown, frame);
  const footer = hidden > 0 ? `<text x="${CODE_X}" y="${y + 18}" font-size="11.5" style="fill:${palette.muted}">${escape(say().moreLines(hidden))}</text>` : "";
  const height = y + (hidden > 0 ? 30 : 8);
  const tag = input.isNewFile ? pill(palette, { right: width - 16, y: 12, text: say().newFile, color: palette.user }) : "";
  const counts = `<text x="${width - (input.isNewFile ? 100 : 16)}" y="27" text-anchor="end" font-family="${MONO}" font-size="12.5"><tspan style="fill:${palette.ok}">+${added}</tspan><tspan style="fill:${palette.muted}">  </tspan><tspan style="fill:${palette.err}">−${removed}</tspan></text>`;
  const header = [
    strokeIcon(input.isNewFile ? NEW_FILE : PENCIL, { x: 16, y: 13, size: 18, color: palette.fg }),
    `<text x="44" y="27" font-family="${MONO}" font-size="13" style="fill:${palette.fg}">${escape(fitText(shownPath, width - 220, { isMono: true, size: 13 }))}</text>`,
    counts,
    tag,
    `<line x1="0" y1="${HEADER_H$2 - 0.5}" x2="${width}" y2="${HEADER_H$2 - 0.5}" stroke="${palette.muted}" stroke-opacity=".3"/>`
  ].join("");
  return {
    source: svgCard({ width, height, palette, body: header + rows.join("") + footer }),
    height,
    alt: `${shownPath}: +${added} −${removed}`
  };
}

const SIZE = 15;
const LINE_H$1 = 21;
const HEADER_H$1 = 58;
const HEAD_SIZE = 12;
const HEAD_LINE_H = 16;
const ROW_PAD_Y = 12;
const MIN_ROW_H = 44;
const PAD_X = 24;
const COL_GAP = 28;
const MIN_COL = 56;
const MIN_WIDTH = 420;
const MAX_WIDTH = 1600;
const STAGGER_MS$1 = 60;
const HEX = /^#[0-9a-f]{6}$/i;
const DIFF$1 = /^\+(\d+)\s*[−-](\d+)$/;
const NUMBER = /^[+−-]?[$€£]?\d[\d.,]*\s?(%|ms|s|min|h|kb|mb|gb|x|×)?$/i;
const CODE$2 = /^[^\s]*[/_.:@][^\s]*$/;
const kindOfCell = (cell) => {
  const text = cell.trim();
  if (HEX.test(text)) {
    return "colour";
  }
  if (DIFF$1.test(text)) {
    return "diff";
  }
  if (NUMBER.test(text)) {
    return "number";
  }
  return CODE$2.test(text) && text.length > 1 ? "code" : "text";
};
const measure = (text, isMono) => measure$1(text, isMono, SIZE);
const measureHead = (text) => measure$1(text, false, HEAD_SIZE) + [...text].length * HEAD_SIZE * 0.1;
const isMonoKind = (kind) => kind !== "text";
const wrapCell = (text, width, { isMono, maxLines = 1 / 0 }) => wrapLines(text, width, { maxLines, measure: (line) => measure(line, isMono) });
const longestWord = (text, widthOf) => Math.max(0, ...text.split(/\s+/).filter(Boolean).map(widthOf));
function cellWidths(cell) {
  const kind = kindOfCell(cell);
  const isMono = isMonoKind(kind);
  const natural = measure(cell, isMono) + (kind === "colour" ? 22 : 0);
  const isWrapped = kind === "text" || kind === "code";
  return { natural, least: isWrapped ? longestWord(cell, (line) => measure(line, isMono)) : natural };
}
function naturalWidths(table) {
  return table.header.map((header, col) => {
    const cells = table.rows.map((row) => cellWidths(row[col] ?? "").natural);
    return Math.max(MIN_COL, Math.ceil(Math.max(measureHead(header.toUpperCase()), ...cells)));
  });
}
function leastWidths(table) {
  return table.header.map((header, col) => {
    const cells = table.rows.map((row) => cellWidths(row[col] ?? "").least);
    return Math.max(MIN_COL, Math.ceil(Math.max(longestWord(header.toUpperCase(), measureHead), ...cells)));
  });
}
function fitColumns(natural, width, { reserve = 0, least = [] } = {}) {
  const room = width - PAD_X * 2 - reserve - COL_GAP * (natural.length - 1);
  const total = natural.reduce((sum, w) => sum + w, 0);
  if (total <= room) {
    return natural.map((w) => w + (room - total) * w / total);
  }
  const fair = room / natural.length;
  const starts = natural.map((w, i) => w <= fair ? w : Math.min(fair, Math.max(MIN_COL, least[i] ?? MIN_COL)));
  const spare = Math.max(0, room - starts.reduce((sum, w) => sum + w, 0));
  const wants = natural.map((w, i) => w <= fair ? 0 : Math.max(0, w - (starts[i] ?? 0)));
  const wanted = wants.reduce((sum, w) => sum + w, 0);
  return starts.map((w, i) => w + (wanted === 0 ? 0 : spare * (wants[i] ?? 0) / wanted));
}
const ANCHORS = { left: "start", center: "middle", right: "end" };
const anchorOf = (align) => ANCHORS[align];
const ANCHOR_SHARE = { left: 0, center: 0.5, right: 1 };
const xOf = (left, width, align) => left + width * ANCHOR_SHARE[align];
function layoutCell(text, width) {
  const kind = kindOfCell(text);
  const isWrapped = kind === "text" || kind === "code";
  return { kind, text, lines: isWrapped ? wrapCell(text, width, { isMono: kind === "code" }) : [text] };
}
function cellMarkup(cell, { left, width, align, rowH, palette }) {
  const isMono = isMonoKind(cell.kind);
  const font = isMono ? `font-family="${MONO}" font-size="${SIZE - 0.5}"` : "";
  const blockH = cell.lines.length * LINE_H$1;
  const firstY = (rowH - blockH) / 2 + LINE_H$1 / 2 + 5;
  const middle = rowH / 2;
  if (cell.kind === "colour") {
    const x = align === "right" ? left + width - measure(cell.text, true) - 22 : left;
    return `<circle cx="${x + 6}" cy="${middle}" r="6" fill="${cell.text}" stroke="${palette.muted}"/><text x="${x + 22}" y="${middle + 5}" ${font} fill="${palette.fg}">${escape(cell.text)}</text>`;
  }
  if (cell.kind === "diff") {
    const [, added = "0", removed = "0"] = DIFF$1.exec(cell.text.trim()) ?? [];
    return `<text x="${xOf(left, width, align)}" y="${middle + 5}" text-anchor="${anchorOf(align)}" ${font}><tspan fill="${palette.ok}">+${added}</tspan><tspan fill="${palette.muted}"> </tspan><tspan fill="${palette.err}">−${removed}</tspan></text>`;
  }
  return cell.lines.map((line, i) => `<text x="${xOf(left, width, align)}" y="${firstY + i * LINE_H$1}" text-anchor="${anchorOf(align)}" ${font} fill="${palette.fg}" class="${cell.kind === "number" ? "num" : ""}">${escape(line)}</text>`).join("");
}
const tableStyle = (palette, cardWidth) => [
  `text{font-size:${SIZE}px}`,
  `.head{font-size:${HEAD_SIZE}px;font-weight:600;letter-spacing:.1em;fill:${palette.muted}}`,
  `.num{font-variant-numeric:tabular-nums}`,
  `.row{opacity:0;animation:rise .5s cubic-bezier(.2,.8,.2,1) forwards}`,
  `.rule{stroke-dasharray:${cardWidth};stroke-dashoffset:${cardWidth};animation:draw .8s cubic-bezier(.6,0,.2,1) .05s forwards}`,
  `@keyframes rise{from{opacity:0;transform:translateY(6px)}to{opacity:1}}`,
  `@keyframes draw{to{stroke-dashoffset:0}}`,
  `@media (prefers-reduced-motion:reduce){.row,.rule{animation:none;opacity:1;stroke-dashoffset:0}}`
].join("");
function headerMarkup({ widths, lefts, align, labels }) {
  return labels.flatMap((lines, i) => lines.map((line, j) => `<text x="${xOf(lefts[i] ?? 0, widths[i] ?? 0, align(i))}" y="${HEADER_MID + 4 + j * HEAD_LINE_H}" text-anchor="${anchorOf(align(i))}" class="head">${escape(line)}</text>`)).join("");
}
function rowsMarkup(table, grid, { palette, width: cardWidth }) {
  const { widths, lefts, align, headerH } = grid;
  const laid = table.rows.map((row) => row.map((cell, i) => layoutCell(cell, (widths[i] ?? MIN_COL) - (kindOfCell(cell) === "colour" ? 22 : 0))));
  const heights = laid.map((cells) => Math.max(MIN_ROW_H, Math.max(...cells.map((cell) => cell.lines.length)) * LINE_H$1 + ROW_PAD_Y * 2));
  const tops = heights.map((_, r) => headerH + heights.slice(0, r).reduce((sum, h) => sum + h, 0));
  const rows = laid.map((cells, r) => {
    const rowH = heights[r] ?? MIN_ROW_H;
    const markup = cells.map((cell, i) => cellMarkup(cell, { left: lefts[i] ?? 0, width: widths[i] ?? 0, align: align(i), rowH, palette })).join("");
    const band = r % 2 === 1 ? `fill="${palette.fg}" fill-opacity=".05"` : 'fill="none"';
    return `<g transform="translate(0 ${tops[r] ?? 0})"><g class="row" style="animation-delay:${120 + r * STAGGER_MS$1}ms"><rect class="bg" x="0" y="0" width="${cardWidth}" height="${rowH}" ${band}/>${markup}</g></g>`;
  }).join("");
  return { rows, height: headerH + heights.reduce((sum, h) => sum + h, 0) + 6 };
}
function tableSvg(table, { palette, width, hasControl = false }) {
  const cardWidth = Math.round(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width)));
  const reserve = hasControl ? CONTROL_SLOT : 0;
  const widths = fitColumns(naturalWidths(table), cardWidth, { reserve, least: leastWidths(table) });
  const lefts = widths.map((_, i) => PAD_X + widths.slice(0, i).reduce((sum, w) => sum + w + COL_GAP, 0));
  const labels = table.header.map((cell, i) => wrapLines(cell.toUpperCase(), widths[i] ?? MIN_COL, { measure: measureHead }));
  const headerH = HEADER_H$1 + (Math.max(1, ...labels.map((lines) => lines.length)) - 1) * HEAD_LINE_H;
  const grid = { widths, lefts, align: (i) => table.align[i] ?? "left", labels, headerH };
  const { rows, height } = rowsMarkup(table, grid, { palette, width: cardWidth });
  const body = [
    headerMarkup(grid),
    `<line class="rule" x1="${PAD_X}" y1="${headerH - 1}" x2="${cardWidth - PAD_X - reserve}" y2="${headerH - 1}" stroke="${palette.user}" stroke-width="1" stroke-linecap="square"/>`,
    rows
  ].join("");
  return {
    source: svgCard({ width: cardWidth, height, palette, style: tableStyle(palette, cardWidth), body }),
    width: cardWidth,
    height,
    alt: [table.header.join(" | "), ...table.rows.map((row) => row.join(" | "))].join(`
`)
  };
}

const HEADER_H = 56;
const LINE_H = 20;
const CODE$1 = 12.5;
const MAX_CARD_LINES = 24;
const PROMPT = '<path d="M5 7l5 5-5 5"/><path d="M12 18h7"/>';
const ANSI = /\u001b\[[0-9;?]*[A-Za-z]/g;
function shellOutputOf(output) {
  const record = typeof output === "object" && output !== null ? output : {};
  if (typeof record.stdout !== "string" || typeof record.stderr !== "string") {
    return null;
  }
  return {
    stdout: record.stdout,
    stderr: record.stderr,
    interrupted: record.interrupted === true,
    ...typeof record.timedOutAfterMs === "number" ? { timedOutAfterMs: record.timedOutAfterMs } : {},
    ...typeof record.returnCodeInterpretation === "string" ? { returnCodeInterpretation: record.returnCodeInterpretation } : {}
  };
}
function streamLines(text, isErr) {
  const lines = text.replace(ANSI, "").replace(/\r/g, "").replace(/\t/g, "  ").split(`
`);
  const end = lines.length - [...lines].reverse().findIndex((line) => line.trim() !== "");
  return lines.every((line) => line.trim() === "") ? [] : lines.slice(0, end).map((line) => ({ text: line, isErr }));
}
const outputLines = (output) => [...streamLines(output.stdout, false), ...streamLines(output.stderr, true)];
const fitsCard = (output) => outputLines(output).length <= MAX_CARD_LINES;
function statusOf(output, isErrored, palette) {
  if (output.interrupted) {
    return { text: say().stopped, color: palette.warn };
  }
  if (output.timedOutAfterMs !== undefined) {
    return { text: say().timedOut, color: palette.warn };
  }
  return isErrored ? { text: say().failed, color: palette.err } : { text: say().ok, color: palette.ok };
}
function lineColor(line, palette) {
  if (line.isNote === true) {
    return palette.muted;
  }
  return line.isErr ? palette.err : palette.fg;
}
function outputRow(line, i, { palette, width }) {
  const top = HEADER_H + 6 + i * LINE_H;
  return `<g class="rise" ${riseDelay(i, 22)}><text x="20" y="${top + 14}" font-family="${MONO}" font-size="${CODE$1}" style="fill:${lineColor(line, palette)}" xml:space="preserve">${escape(fitText(line.text, width - 40, { isMono: true, size: CODE$1 }))}</text></g>`;
}
function terminalSvg(output, isErrored, frame) {
  const { palette, width, hasControl = false } = frame;
  const lines = outputLines(output);
  const status = statusOf(output, isErrored, palette);
  const shown = lines.length === 0 ? [{ text: say().noOutput, isErr: false, isNote: true }] : lines;
  const rows = shown.map((line, i) => outputRow(line, i, frame));
  const height = HEADER_H + 6 + Math.max(1, lines.length) * LINE_H + 10;
  const note = output.returnCodeInterpretation === undefined ? say().output : `${say().output} · ${output.returnCodeInterpretation}`;
  const header = [
    strokeIcon(PROMPT, { x: 16, y: HEADER_MID - 9, size: 18, color: palette.fg }),
    `<text x="42" y="${HEADER_MID + 4}" font-size="12" style="fill:${palette.muted}">${escape(note)}</text>`,
    pill(palette, { right: width - 16 - (hasControl ? CONTROL_SLOT : 0), y: HEADER_MID - 10, text: status.text, color: status.color }),
    `<line x1="0" y1="${HEADER_H - 0.5}" x2="${width}" y2="${HEADER_H - 0.5}" stroke="${palette.muted}" stroke-opacity=".3"/>`
  ].join("");
  return {
    source: svgCard({ width, height, palette, body: header + rows.join("") }),
    width,
    height,
    alt: lines.map((line) => line.text).join(`
`) || say().noOutput
  };
}

const sourceFor = (look, built) => look.isFramed === true ? built.source : settled(built.source);
function cardWithCopy(look, { Svg, built, key, text }) {
  const { Box, Button } = look.ui;
  const copy = look.copy;
  return h(Box, {
    marginY: 1,
    alignSelf: "flex-start"
  }, h(Svg, {
    source: sourceFor(look, built),
    alt: built.alt
  }), copy === undefined ? "" : h(Box, {
    position: "absolute",
    top: 1,
    right: 3
  }, h(Button, {
    key,
    label: say().copy,
    plain: true,
    dimColor: true,
    onPress: () => copy(text)
  })));
}
function tableCard(look, table, { Svg, columns, key }) {
  const card = tableSvg(table, { palette: look.skin.palette, width: cardWidth(columns), hasControl: look.copy !== undefined });
  return cardWithCopy(look, { Svg, built: card, key, text: tableMarkdown(table) });
}
function card(look, Svg, built) {
  const { Box } = look.ui;
  return h(Box, {
    marginY: 1
  }, h(Svg, {
    source: sourceFor(look, built),
    alt: built.alt
  }));
}
function codeCard(look, { lang, code, Svg, columns, key = "copy-code" }) {
  const built = codeSvg(code, lang, { palette: look.skin.palette, width: cardWidth(columns), hasControl: look.copy !== undefined });
  return cardWithCopy(look, { Svg, built, key, text: code });
}
function diffCard(look, { Svg, input, shownPath, columns }) {
  return card(look, Svg, diffSvg(input, shownPath, { palette: look.skin.palette, width: cardWidth(columns) }));
}
function terminalCard(look, { Svg, output, isErrored, columns }) {
  const text = [output.stdout, output.stderr].filter((part) => part.trim() !== "").join(`
`);
  const withCopy = text === "" ? { ...look, copy: undefined } : look;
  const built = terminalSvg(output, isErrored, { palette: look.skin.palette, width: cardWidth(columns), hasControl: withCopy.copy !== undefined });
  return cardWithCopy(withCopy, { Svg, built, key: "copy-output", text });
}
function codeSegment(look, segment, { Svg, maxWidth, key }) {
  const { Box, Markdown } = look.ui;
  return Svg === undefined ? h(Box, {
    flexDirection: "column"
  }, h(Markdown, {
    text: segment.raw
  }), copyRow(look, key, segment.code)) : codeCard(look, { lang: segment.lang, code: segment.code, Svg, columns: maxWidth, key });
}
function replyRows(look, { segments, maxWidth, Svg }) {
  const { Box, Markdown } = look.ui;
  return h(Box, {
    flexDirection: "column"
  }, segments.map((segment, i) => {
    if (segment.kind === "text") {
      return h(Markdown, {
        text: hardBreaks(segment.text)
      });
    }
    if (segment.kind === "code") {
      return codeSegment(look, segment, { Svg, maxWidth, key: `copy-${i}` });
    }
    return Svg === undefined ? tableRows(look, segment, { maxWidth, control: copyButton(look, `copy-${i}`, tableMarkdown(segment)) }) : tableCard(look, segment, { Svg, columns: maxWidth, key: `copy-${i}` });
  }));
}

const isEngine = (node) => typeof node === "object" && node !== null && node.type === "engine";
function ownOf(beneath) {
  if (isEngine(beneath))
    return null;
  const node = beneath;
  if (node.type !== "Box" || !Array.isArray(node.children) || !node.children.some(isEngine))
    return beneath;
  const kept = node.children.filter((child) => !isEngine(child));
  return kept.length === 0 ? null : { ...beneath, children: kept };
}
function withBeneath(look, row, beneath) {
  const { Box } = look.ui;
  const own = ownOf(beneath);
  return own === null ? row : h(Box, {
    flexDirection: "column",
    gap: 1
  }, row, own);
}

const DEFAULT_COLUMNS = 100;

const FRAME_MS = 90;
async function userMessageView({ view, e, pass }) {
  const active = await view.active();
  if (active === null || e.surface !== "terminal" || !isOwnPrompt(e.props)) {
    return pass(e);
  }
  const look = view.look(active);
  const hasImages = await view.hasImages();
  if (hasImages)
    return promptRow(look, e.props.text, await pass({ ...e, props: { ...e.props, text: "" } }));
  return withBeneath(look, promptRow(look, e.props.text), await pass(e));
}
async function replyView({ view, e, pass }) {
  const active = await view.active();
  const segments = active?.prefs.tables === true ? cardSegments(e.props.text) : null;
  if (active === null || segments === null) {
    return pass(e);
  }
  view.drewAt(e.viewport?.columns);
  const look = view.look(active, true);
  return withBeneath(look, pinned(e, replyRows(look, { segments, maxWidth: e.viewport?.columns ?? DEFAULT_COLUMNS, Svg: look.svg })), await pass(e));
}
async function spinnerView({ view, e, pass }) {
  const active = await view.active();
  if (active === null) {
    return pass(e);
  }
  if (e.surface !== "terminal") {
    const look = view.look(active);
    if (look.svg === undefined)
      return pass(e);
    return withBeneath(look, desktopSpinnerRow(look, { Svg: look.svg, mode: e.props.mode, text: e.props.message ?? e.props.word }), await pass(e));
  }
  const word = pick(active.skin.spinner, e.props.word) ?? e.props.word;
  if (!active.prefs.shimmer || e.props.message !== null) {
    return pass({ ...e, props: { ...e.props, word } });
  }
  const frame = await view.frame();
  const startedAt = await view.startedAt();
  const elapsedMs = startedAt === 0 ? 0 : await view.now() - startedAt;
  const look = view.look(active);
  return withBeneath(look, spinnerRow(look, { word, frame, elapsedMs }), await pass(e));
}
async function turnDurationView({ view, e, pass }) {
  const active = await view.active();
  if (active === null) {
    return pass(e);
  }
  const turns = await view.turns();
  const word = pick(active.skin.done, e.props.word) ?? e.props.word;
  const look = view.look(active);
  return withBeneath(look, footerRow(look, { word, durationMs: e.props.durationMs, stats: turns[String(e.props.durationMs)] }), await pass(e));
}

const BUILTIN = {
  Bash: "run",
  PowerShell: "run",
  Read: "read",
  Edit: "write",
  MultiEdit: "write",
  Write: "write",
  NotebookEdit: "write",
  Glob: "search",
  Grep: "search",
  WebFetch: "web",
  WebSearch: "web"
};
const MAX_TARGET = 120;
function kindOf(tool) {
  return BUILTIN[tool] ?? null;
}
const groupKindOf = (tool) => kindOf(tool) ?? (tool.startsWith("mcp__") ? "mcp" : "other");
const mcpServer = (tool) => tool.split("__")[1] ?? "";
function toolLabel(tool) {
  if (!tool.startsWith("mcp__")) {
    return tool;
  }
  const [, server = "", ...name] = tool.split("__");
  return `${server}:${name.join("__")}`;
}
const fieldsOf = (input) => typeof input === "object" && input !== null ? input : {};
const textOf = (value) => typeof value === "string" ? value : "";
const firstString = (fields) => Object.values(fields).map(textOf).find((value) => value !== "") ?? "";
function summarize(tool, input, cwd) {
  const fields = fieldsOf(input);
  const summary = (() => {
    switch (tool) {
      case "Bash":
      case "PowerShell":
        return textOf(fields.command);
      case "Read":
      case "Edit":
      case "MultiEdit":
      case "Write":
        return shortenPath(textOf(fields.file_path), cwd);
      case "NotebookEdit":
        return shortenPath(textOf(fields.notebook_path), cwd);
      case "Glob":
        return textOf(fields.pattern);
      case "Grep": {
        const where = textOf(fields.path);
        return where === "" ? textOf(fields.pattern) : `${textOf(fields.pattern)} in ${shortenPath(where, cwd)}`;
      }
      case "WebFetch":
        return textOf(fields.url).replace(/^https?:\/\//, "");
      case "WebSearch":
        return textOf(fields.query);
      default:
        return firstString(fields);
    }
  })();
  return oneLine(summary).slice(0, MAX_TARGET);
}

const KIND_LABEL = {
  read: "Read",
  write: "Edit",
  run: "Run",
  search: "Search",
  web: "Web",
  mcp: "MCP",
  other: "Other"
};
function status({ skin, icons }, calls) {
  if (calls.some((call) => call.isInterrupted)) {
    return { glyph: icons.interrupted, color: skin.palette.warn };
  }
  if (calls.some((call) => call.isErrored)) {
    return { glyph: icons.err, color: skin.palette.err };
  }
  if (calls.some((call) => call.isRunning)) {
    return { glyph: icons.running, color: skin.palette.muted };
  }
  return { glyph: icons.ok, color: skin.palette.ok };
}
function railLine(look) {
  const { Text } = look.ui;
  return h(Text, {
    color: look.skin.palette.user
  }, look.icons.rail);
}
function node(look, calls) {
  const { Text } = look.ui;
  const { glyph, color } = status(look, calls);
  const branch = look.prefs.rail && look.surface === "terminal" ? look.icons.branch : "";
  return h(Text, {
    color
  }, `${glyph}`, h(Text, {
    color: look.skin.palette.muted
  }, `${branch} `));
}
function metaSpans(look, meta) {
  const { Text } = look.ui;
  const { palette } = look.skin;
  const spans = [];
  if (meta.added !== undefined && meta.removed !== undefined && meta.added + meta.removed > 0) {
    spans.push(h(Text, {
      color: palette.ok
    }, `+${meta.added}`));
    spans.push(h(Text, {
      color: palette.err
    }, ` −${meta.removed}`));
  }
  if (meta.ms !== undefined) {
    spans.push(h(Text, {
      color: palette.muted
    }, `${spans.length > 0 ? "  " : ""}${formatMs(meta.ms)}`));
  }
  return spans;
}
function withMeta(look, main, meta) {
  const { Box, Text } = look.ui;
  const spans = metaSpans(look, meta);
  if (spans.length === 0) {
    return main;
  }
  if (look.surface !== "terminal") {
    return h(Text, {
      wrap: "truncate-end"
    }, main, "   ", spans);
  }
  return h(Box, {
    flexDirection: "row"
  }, h(Box, {
    flexGrow: 1,
    flexShrink: 1
  }, main), h(Box, {
    flexShrink: 0,
    paddingLeft: 2
  }, h(Text, null, spans)));
}
function stack(look, line) {
  const { Box } = look.ui;
  return look.prefs.rail && look.surface === "terminal" ? h(Box, {
    flexDirection: "column"
  }, railLine(look), line) : line;
}
function iconRow(look, { Svg, kind, calls, line }) {
  const { Box } = look.ui;
  const { color } = status(look, calls);
  const source = toolIcon(kind, color, calls.some((call) => call.isRunning));
  return h(Box, {
    flexDirection: "row",
    columnGap: 1,
    alignItems: "center"
  }, h(Svg, {
    source,
    alt: kind,
    width: 16,
    height: 16
  }), line);
}
function outcomeWord(look, call) {
  const { Text } = look.ui;
  if (call.isInterrupted)
    return h(Text, {
      color: look.skin.palette.warn
    }, `  · ${say().stopped}`);
  if (call.isErrored)
    return h(Text, {
      color: look.skin.palette.err
    }, `  · ${say().failed}`);
  return null;
}
function toolRow(look, { call, kind, target, meta }) {
  const { Text } = look.ui;
  const { palette } = look.skin;
  if (look.svg !== undefined) {
    const line = h(Text, {
      wrap: "truncate-end"
    }, h(Text, {
      color: palette[kind],
      bold: true
    }, toolLabel(call.tool)), h(Text, {
      color: call.isErrored ? palette.err : palette.muted
    }, `  ${target}`), outcomeWord(look, call));
    return iconRow(look, { Svg: look.svg, kind, calls: [call], line: withMeta(look, line, meta) });
  }
  const main = h(Text, {
    wrap: "truncate-end"
  }, node(look, [call]), h(Text, {
    color: palette[kind]
  }, toolLabel(call.tool)), h(Text, {
    color: call.isErrored ? palette.err : palette.muted
  }, `  ${target}`));
  return stack(look, withMeta(look, main, meta));
}
function groupRow(look, calls) {
  const { Text } = look.ui;
  const { palette } = look.skin;
  const counts = new Map;
  for (const call of calls) {
    const kind = groupKindOf(call.tool);
    const label = kind === "mcp" ? `${KIND_LABEL.mcp} ${mcpServer(call.tool)}` : KIND_LABEL[kind];
    const seen = counts.get(label);
    counts.set(label, { kind, count: (seen?.count ?? 0) + 1 });
  }
  const parts = [...counts].flatMap(([label, { kind, count }], i) => [
    ...i === 0 ? [] : [h(Text, {
      color: palette.muted
    }, " · ")],
    h(Text, {
      color: palette[kind]
    }, label),
    h(Text, {
      color: palette.muted
    }, ` ${count}`)
  ]);
  if (look.svg !== undefined) {
    const lead = [...counts.values()].sort((a, b) => b.count - a.count)[0]?.kind ?? "other";
    return iconRow(look, { Svg: look.svg, kind: lead, calls, line: h(Text, {
      wrap: "truncate-end"
    }, parts) });
  }
  return stack(look, h(Text, {
    wrap: "truncate-end"
  }, node(look, calls), parts));
}

const EN = {
  back: "← Looks",
  prompt: "Your message",
  tools: "Tool rows: done, running, failed",
  group: "Folded group of reads and searches",
  diff: "Card for a file’s changes",
  diffNote: "Desktop only; the terminal keeps Claude Code’s own view of the changes.",
  shell: "Command output card",
  shellNote: "Desktop only.",
  shellStates: "Command output card: passed, failed",
  code: "Code block card",
  codeNote: "Desktop only; the terminal keeps Claude Code’s own formatting (markdown).",
  table: "Table",
  spinner: "Busy words (spinner)",
  spinnerModes: "Busy words: thinking, running a tool, writing, waiting",
  band: "Band above your message box: normal, then a nudge to summarize the chat",
  ask: "Band above a question",
  footer: "Line under each turn (terminal)"
};
const TR = {
  back: "← Görünüm",
  prompt: "Senin mesajın",
  tools: "Araç satırları: bitti, çalışıyor, başarısız",
  group: "Okuma ve aramaların katlanmış grubu",
  diff: "Dosya değişiklikleri kartı",
  diffNote: "Yalnızca masaüstü; terminal Claude Code'un kendi değişiklik görünümünü korur.",
  shell: "Komut çıktısı kartı",
  shellNote: "Yalnızca masaüstü.",
  shellStates: "Komut çıktısı kartı: başarılı, başarısız",
  code: "Kod bloğu kartı",
  codeNote: "Yalnızca masaüstü; terminal Claude Code'un kendi biçimlendirmesini (markdown) korur.",
  table: "Tablo",
  spinner: "Meşgul sözcükleri (spinner)",
  spinnerModes: "Meşgul sözcükleri: düşünüyor, araç çalışıyor, yazıyor, bekliyor",
  band: "Mesaj kutusu üstü bant: normal, sonra sohbeti özetleme önerisi",
  ask: "Soru üstü bant",
  footer: "Tur altı satırı (terminal)"
};
const galleryWords = () => pick$1({ en: EN, tr: TR });

const done$1 = { isRunning: false, isErrored: false, isInterrupted: false };
const TABLE = {
  kind: "table",
  header: ["Skin", "Accent", "Time"],
  align: ["left", "left", "right"],
  rows: [
    ["noir", "#f5f5f5", "41s"],
    ["tokyo-night", "#7aa2f7", "2.1s"],
    ["dracula", "#bd93f9", "340ms"]
  ]
};
const CODE = ["// Rate limit per route, keyed by user", "export function limit(route: string, perMinute = 60) {", "  return (used: number) => used < perMinute", "}"].join(`
`);
const DIFF = {
  path: "/work/apps/hub/src/server.ts",
  isNewFile: false,
  hunks: [{ oldStart: 12, newStart: 12, lines: [" const app = fastify()", "-app.listen(7447)", "+app.register(rateLimit, { max: 60 })", "+app.listen(7447)"] }]
};
function rowSections(look) {
  const words = galleryWords();
  return [
    [words.prompt, promptRow(look, say().samplePrompt)],
    [
      words.tools,
      toolRow(look, { call: { tool: "Bash", input: {}, ...done$1 }, kind: "run", target: "pnpm test --filter hub", meta: { ms: 2140 } }),
      toolRow(look, { call: { tool: "Read", input: {}, ...done$1, isRunning: true }, kind: "read", target: "docs/protocols.md", meta: {} }),
      toolRow(look, { call: { tool: "Edit", input: {}, ...done$1, isErrored: true }, kind: "write", target: "apps/hub/src/server.ts", meta: {} })
    ],
    [words.group, groupRow(look, [{ tool: "Read", input: {}, ...done$1 }, { tool: "Read", input: {}, ...done$1 }, { tool: "Grep", input: {}, ...done$1 }])]
  ];
}
function terminalSections(look, width) {
  const { Text } = look.ui;
  const { palette } = look.skin;
  const words = galleryWords();
  return [
    [words.diff, h(Text, {
      color: palette.muted
    }, words.diffNote)],
    [words.shell, h(Text, {
      color: palette.muted
    }, words.shellNote)],
    [words.code, h(Text, {
      color: palette.muted
    }, words.codeNote)],
    [words.table, replyRows(look, { segments: [TABLE], maxWidth: width })],
    [words.spinner, spinnerRow(look, { word: look.skin.spinner[0] ?? "Working", frame: 3, elapsedMs: 12000 })]
  ];
}
function desktopSections(look, svg, width) {
  const words = galleryWords();
  return [
    [words.diff, diffCard(look, { Svg: svg, input: DIFF, shownPath: "apps/hub/src/server.ts", columns: width })],
    [
      words.shellStates,
      terminalCard(look, { Svg: svg, output: { stdout: `Test Files  12 passed (12)
     Tests  148 passed (148)`, stderr: "", interrupted: false }, isErrored: false, columns: width }),
      terminalCard(look, { Svg: svg, output: { stdout: "", stderr: "error TS2322: Type string is not assignable to number", interrupted: false }, isErrored: true, columns: width })
    ],
    [words.code, codeCard(look, { lang: "ts", code: CODE, Svg: svg, columns: width })],
    [words.table, replyRows(look, { segments: [TABLE], maxWidth: width, Svg: svg })],
    [
      words.spinnerModes,
      desktopSpinnerRow(look, { Svg: svg, mode: "thinking", text: "Thinking" }),
      desktopSpinnerRow(look, { Svg: svg, mode: "tool-use", text: "Running pnpm test" }),
      desktopSpinnerRow(look, { Svg: svg, mode: "responding", text: "Writing the reply" }),
      desktopSpinnerRow(look, { Svg: svg, mode: "requesting", text: "Waiting for the model" })
    ]
  ];
}
function bandSections(look) {
  const words = galleryWords();
  return [
    [
      words.band,
      usageBand(look, { meters: [{ label: contextLabel(), percent: 42 }, { label: say().fiveHour, percent: 18 }], canCompact: true, compact: () => {
        return;
      } }),
      usageBand(look, { meters: [{ label: contextLabel(), percent: 85 }, { label: say().fiveHour, percent: 61 }], canCompact: true, compact: () => {
        return;
      } })
    ],
    [words.ask, askBand(look, ["Approach", "Store"])],
    [words.footer, footerRow(look, { word: look.skin.done[0] ?? "Done", durationMs: 41000, stats: { tools: 6, added: 18, removed: 3 } })]
  ];
}
function galleryPane(look, { columns, back }) {
  const { Box, Button, Text } = look.ui;
  const width = Math.max(40, columns - 4);
  const cards = look.svg === undefined ? terminalSections(look, width) : desktopSections(look, look.svg, width);
  return h(Box, {
    flexDirection: "column"
  }, h(Box, {
    key: "back",
    flexDirection: "row",
    marginLeft: -1,
    marginBottom: 1
  }, h(Button, {
    key: "gallery-back",
    label: galleryWords().back,
    plain: true,
    dimColor: true,
    onPress: back
  })), [...rowSections(look), ...cards, ...bandSections(look)].map(([title, ...items], i) => h(Box, {
    flexDirection: "column",
    marginBottom: 1
  }, h(Text, {
    dimColor: true,
    bold: true
  }, `${i + 1}  ${title}`), items)));
}

const FILL = /<rect\b[^>]*\bdata-m-fill\b[^>]*>/g;
const DONE = /<path\b[^>]*\bdata-m-done\b[^>]*>/g;
const HAS_DONE = /\bdata-m-done\b/;
const WIDTH = /\swidth="([\d.]+)"/;
const CLASS = /\sclass="([^"]*)"/;
const STYLE = /\sstyle="([^"]*)"/;
const MIN_RATIO_STEP = 0.02;
const RATIO_DIGITS = 3;
const widthOf = (tag) => Number(WIDTH.exec(tag)?.[1] ?? 0);
function withClass(tag, name, extra = "") {
  const tagged = CLASS.test(tag) ? tag.replace(CLASS, (_, classes) => ` class="${classes} ${name}"`) : tag.replace(/\s*\/?>$/, ` class="${name}"$&`);
  return tagged.replace(/\s*\/?>$/, `${extra}$&`);
}
function slideFills(before, now) {
  const old = before.match(FILL) ?? [];
  if (old.length !== (now.match(FILL) ?? []).length)
    return now;
  let index = 0;
  return now.replace(FILL, (tag) => {
    const was = old[index++];
    const from = was === undefined ? 0 : widthOf(was);
    const to = widthOf(tag);
    if (from <= 0 || to <= 0 || Math.abs(from - to) / to < MIN_RATIO_STEP)
      return tag;
    const slide = `--m-from:${(from / to).toFixed(RATIO_DIGITS)}`;
    const styled = STYLE.test(tag) ? tag.replace(STYLE, (_, rules) => ` style="${slide};${rules}"`) : tag.replace(/\s*\/?>$/, ` style="${slide}"$&`);
    return withClass(styled, "m-from");
  });
}
function drawDone(before, now) {
  if (HAS_DONE.test(before))
    return now;
  return now.replace(DONE, (tag) => withClass(tag, "m-draw", ' pathLength="1"'));
}
function markChanges(before, now) {
  return drawDone(before, slideFills(before, now));
}

const STAGGER_MS = 45;
const EASE = "cubic-bezier(.2,.8,.2,1)";
const SHEEN = "#A39E93";
const RULES = {
  "m-in": `.m-in{animation:m-in .42s ${EASE} both}@keyframes m-in{from{opacity:0;transform:translateY(8px)}}`,
  "m-fade": `.m-fade{animation:m-fade .5s ${EASE} both}@keyframes m-fade{from{opacity:0}}`,
  "m-grow": `.m-grow{transform-box:fill-box;transform-origin:left center;animation:m-grow .7s ${EASE} both}@keyframes m-grow{from{transform:scaleX(0)}}`,
  "m-px": `.m-px{transform-box:fill-box;transform-origin:center;animation:m-px .34s ${EASE} both}@keyframes m-px{from{opacity:0;transform:translateY(-10px) scale(.6)}}`,
  "m-flash": ".m-flash{opacity:0;animation:m-flash 1.6s ease-out both}@keyframes m-flash{from{opacity:.9}to{opacity:0}}",
  "m-from": `.m-from{transform-box:fill-box;transform-origin:left center;animation:m-from .32s ${EASE} both}@keyframes m-from{from{transform:scaleX(var(--m-from))}}`,
  "m-draw": `.m-draw{stroke-dasharray:1;animation:m-draw .32s ${EASE} .12s both}@keyframes m-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}`,
  "m-breathe": ".m-breathe{animation:m-breathe 1.8s ease-in-out infinite}@keyframes m-breathe{50%{opacity:.4}}",
  "m-ring": ".m-ring{transform-box:fill-box;transform-origin:center;animation:m-ring 1.8s ease-out infinite}@keyframes m-ring{from{opacity:.55;transform:scale(1)}to{opacity:0;transform:scale(2.8)}}",
  "m-wash": `.m-wash{fill:#8E8A80;opacity:0;transition:opacity .12s ${EASE}}svg:hover .m-wash{opacity:.12}`,
  "m-tile": `.m-tile{transform-box:fill-box;transform-origin:center;transition:transform .2s ${EASE}}svg:hover .m-tile{transform:translateY(-1px) scale(1.06)}`
};
const REDUCED = "@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}";
function motionCss(body) {
  const used = Object.keys(RULES).filter((name) => new RegExp(`\\b${name}\\b`).test(body));
  return used.length === 0 ? "" : `${used.map((name) => RULES[name]).join("")}${REDUCED}`;
}
Object.values(RULES).join("");
const isEntering = (cue) => cue.phase === "enter";
function entering(body, cue, kind = "in") {
  if (!isEntering(cue))
    return body;
  return `<g class="m-${kind}" style="animation-delay:${cue.order * STAGGER_MS}ms">${body}</g>`;
}
const FLASH = `<rect x="0" y="0" width="100%" height="100%" rx="10" fill="${SHEEN}" fill-opacity=".22" class="m-flash"/>`;
const WASH = '<rect x="0" y="0" width="100%" height="100%" rx="10" class="m-wash"/>';

function stableDrawings() {
  const kept = new Map;
  return {
    reset: () => kept.clear(),
    draw: (key, what, build) => {
      const signature = typeof what === "string" ? what : JSON.stringify(what);
      const before = kept.get(key);
      if (before !== undefined && before.what === signature)
        return before.drawing;
      const drawing = build(before === undefined ? "enter" : "change");
      kept.set(key, { what: signature, drawing });
      return drawing;
    }
  };
}

const TAG_WIDTH = /^[\s\S]*?<svg\b[^>]*?\swidth="([\d.]+)"/;
const SVG = /^([\s\S]*?<svg\b[^>]*>)([\s\S]*)(<\/svg>\s*)$/;
const SCHEME = "<style>:root{color-scheme:light dark}</style>";
const SAYS_SCHEME = /(^|[^-\w])color-scheme\s*:/;
const PASS_MS = 120;
const MAX_ORDER = 12;
const LIVE_MS = 30000;
function animate(source, spec) {
  const moved = spec.cue.phase === "change" && spec.before !== undefined ? markChanges(spec.before, source) : source;
  const parts = SVG.exec(moved);
  if (parts === null)
    return source;
  const [, open, inner = "", close] = parts;
  const scheme = SAYS_SCHEME.test(inner) ? "" : SCHEME;
  const lit = `${spec.isRow === true ? WASH : ""}${spec.cue.phase === "change" && spec.isLive !== true ? FLASH : ""}${inner}`;
  const body = entering(lit, spec.cue);
  const css = motionCss(body);
  return `${open}${scheme}${css === "" ? "" : `<style>${css}</style>`}${body}${close}`;
}
function paneMotion() {
  const drawings = stableDrawings();
  const shown = new Map;
  const pass = { at: Number.NEGATIVE_INFINITY, entered: 0 };
  const begin = () => {
    const now = Date.now();
    if (now - pass.at > PASS_MS)
      pass.entered = 0;
    pass.at = now;
  };
  return {
    reset: () => {
      drawings.reset();
      shown.clear();
    },
    pic: (key, pic, opts = {}) => {
      begin();
      const what = `${opts.isRow === true ? "row:" : ""}${pic.source}`;
      const now = { shows: opts.shows === undefined ? what : JSON.stringify(opts.shows), width: String(pic.width ?? TAG_WIDTH.exec(pic.source)?.[1]), source: pic.source };
      const source = drawings.draw(key, what, (built) => {
        const order = built === "enter" ? Math.min(MAX_ORDER, pass.entered++) : 0;
        const before = shown.get(key);
        const isQuiet = before !== undefined && (before.shows === now.shows || before.width !== now.width);
        const phase = built === "change" && isQuiet ? "still" : built;
        const lastChange = before?.changedAt ?? Number.NEGATIVE_INFINITY;
        const isLive = phase === "change" && pass.at - lastChange < LIVE_MS;
        shown.set(key, { ...now, changedAt: phase === "change" ? pass.at : lastChange });
        return animate(pic.source, { cue: { phase, order }, isRow: opts.isRow, before: before?.source, isLive });
      });
      return { ...pic, source, isInteractive: true };
    }
  };
}

const HOME_LABEL = "← modz";
function HomeButton(ui, onPress) {
  const { Box, Button } = ui;
  return h(Box, {
    key: "modz-home-row",
    flexDirection: "row",
    marginLeft: -1
  }, h(Button, {
    key: "modz-home",
    label: HOME_LABEL,
    plain: true,
    dimColor: true,
    onPress
  }));
}

const SWATCH_SLOTS = ["user", "ok", "err"];
function swatchesOf(skins) {
  return Object.fromEntries(skins.map((skin) => [skin.name, SWATCH_SLOTS.map((slot) => skin.palette[slot])]));
}
const sample = () => ({
  kind: "table",
  header: say().sampleHeader,
  align: ["left", "right", "left"],
  rows: [
    ["/chat", "60", say().minute],
    ["/upload", "10", say().minute],
    ["/search", "120", say().minute]
  ]
});
const done = { isRunning: false, isErrored: false, isInterrupted: false };
function preview(look, width) {
  const { Box } = look.ui;
  const word = look.skin.done[0] ?? "Done";
  return h(Box, {
    flexDirection: "column",
    borderStyle: "round",
    borderColor: look.skin.palette.muted,
    paddingX: 1
  }, promptRow(look, say().samplePrompt), toolRow(look, { call: { tool: "Bash", input: {}, ...done }, kind: "run", target: "pnpm test", meta: { ms: 2140 } }), toolRow(look, {
    call: { tool: "Edit", input: {}, ...done },
    kind: "write",
    target: "src/server.ts",
    meta: { ms: 380, added: 18, removed: 3 }
  }), groupRow(look, [
    { tool: "Read", input: {}, ...done },
    { tool: "Read", input: {}, ...done },
    { tool: "Grep", input: {}, ...done }
  ]), tableRows(look, sample(), { maxWidth: Math.max(20, width - 4) }), footerRow(look, { word, durationMs: 41000, stats: { tools: 6, added: 18, removed: 3 } }));
}
const OFF = "off";
const HOTKEYS = 9;
function section(look, head, body) {
  const { Box, Text } = look.ui;
  return h(Box, {
    key: `section-${head.title}`,
    flexDirection: "column"
  }, h(Box, {
    flexDirection: "row",
    columnGap: 2
  }, h(Text, {
    dimColor: true,
    bold: true
  }, head.title), head.hint === undefined ? null : h(Text, {
    dimColor: true
  }, head.hint)), body);
}
function skinButton(parts, name, i) {
  const { Box, Button, Text } = parts.ui;
  const isOn = name === parts.look.prefs.skin;
  const dots = (parts.model.swatches[name] ?? []).map((hex, k) => h(Text, {
    key: `dot-${k}`,
    color: hex
  }, "●"));
  const look = isOn ? { variant: "secondary" } : { plain: true, dimColor: true };
  const hotkey = i < HOTKEYS ? { hotkey: String(i + 1) } : {};
  return h(Box, {
    key: `skin-swatch-${name}`,
    flexDirection: "row",
    columnGap: 1,
    alignItems: "center"
  }, h(Box, {
    flexDirection: "row"
  }, dots), h(Button, {
    key: `skin-${name}`,
    label: `${name}${isOn ? " ✓" : ""}`,
    ...look,
    ...hotkey,
    onPress: () => parts.actions.pick(name)
  }));
}
function skinButtons(parts) {
  const { Box, Button } = parts.ui;
  const isOff = parts.look.prefs.skin === OFF;
  return h(Box, {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 2,
    rowGap: 1
  }, parts.model.names.map((name, i) => skinButton(parts, name, i)), h(Button, {
    key: "skin-off",
    label: isOff ? `${say().off} ✓` : say().off,
    hotkey: "0",
    ...isOff ? { variant: "secondary" } : { plain: true, dimColor: true },
    onPress: () => parts.actions.pick(OFF)
  }));
}
function optionButtons({ look, ui, actions }) {
  const { Box, Button } = ui;
  const { prefs } = look;
  const labels = say().toggles;
  const toggle = (word, hotkey, on) => h(Button, {
    key: `toggle-${word}`,
    label: `${on ? "●" : "○"} ${labels[word]}`,
    hotkey,
    plain: true,
    dimColor: !on,
    onPress: () => actions.toggle(word)
  });
  return h(Box, {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 2
  }, toggle("rail", "r", prefs.rail), toggle("tables", "t", prefs.tables), toggle("shimmer", "s", prefs.shimmer), toggle("band", "b", prefs.band), toggle("clip", "c", prefs.clipOutput), h(Button, {
    key: "icons",
    label: say().icons(prefs.icons),
    hotkey: "i",
    plain: true,
    onPress: () => actions.icons()
  }), h(Button, {
    key: "scene",
    label: say().scene(sceneNamed(prefs.scene)?.label ?? say().off),
    hotkey: "w",
    plain: true,
    dimColor: prefs.scene === "off",
    onPress: () => actions.scene()
  }), prefs.scene === "off" ? null : h(Button, {
    key: "scene-off",
    label: say().sceneOff,
    plain: true,
    onPress: () => actions.sceneOff()
  }));
}
function colorControls({ look, ui, model, actions }) {
  const { Box, Text, Input, Select } = ui;
  const { palette } = look.skin;
  return h(Box, {
    flexDirection: "column"
  }, h(Box, {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 2
  }, SLOTS.map((slot) => h(Text, {
    key: `swatch-${slot}`
  }, h(Text, {
    backgroundColor: palette[slot]
  }, "  "), h(Text, {
    dimColor: slot !== model.editing,
    bold: slot === model.editing
  }, ` ${slot}`)))), h(Box, {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 2,
    rowGap: 1,
    marginTop: 1
  }, h(Select, {
    key: "slot",
    label: say().color,
    value: model.editing,
    options: SLOTS.map((slot) => ({ value: slot, label: slot })),
    onSelect: (value) => actions.edit(value)
  }), h(Input, {
    key: "hex",
    label: palette[model.editing],
    placeholder: "#rrggbb",
    value: "",
    submitLabel: say().paint,
    onSubmit: (value) => actions.paint(value.trim())
  })));
}
function settingsPane(parts) {
  const { look, ui, model, actions, home } = parts;
  const { Box, Button, Text } = ui;
  const count = model.names.length;
  return h(Box, {
    flexDirection: "column",
    rowGap: 1
  }, home === undefined ? null : HomeButton(ui, home), section(look, { title: say().theme, hint: say().skins(count) }, skinButtons(parts)), preview(look, model.width), section(look, { title: say().options }, optionButtons(parts)), section(look, { title: say().colors, hint: say().colorsHint }, colorControls(parts)), h(Box, {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 2,
    alignItems: "center"
  }, h(Text, {
    dimColor: true
  }, say().askClaude, h(Text, null, say().askExample)), h(Button, {
    key: "gallery",
    label: say().openGallery,
    hotkey: "g",
    plain: true,
    onPress: () => actions.gallery()
  })));
}

function settingsActions({ prefs, custom, editing }, ports) {
  const state = { prefs, custom };
  return {
    gallery: ports.gallery,
    pick: (name) => ports.commit({ ...state, prefs: { ...prefs, skin: name } }),
    toggle: (word) => ports.commit({ ...state, prefs: { ...prefs, [TOGGLES[word]]: !prefs[TOGGLES[word]] } }),
    icons: () => ports.commit({ ...state, prefs: { ...prefs, icons: prefs.icons === "unicode" ? "ascii" : "unicode" } }),
    scene: () => ports.commit({ ...state, prefs: { ...prefs, scene: nextScene(prefs.scene) } }),
    sceneOff: () => ports.commit({ ...state, prefs: { ...prefs, scene: "off" } }),
    edit: ports.edit,
    paint: (hex) => {
      const made = withSlot(prefs.skin === "off" ? DEFAULT_PREFS.skin : prefs.skin, custom, { slot: editing, hex });
      if (typeof made === "string") {
        ports.toast(made);
        return;
      }
      ports.commit({ prefs: { ...prefs, skin: made.name }, custom: { ...custom, [made.name]: made.skin } });
    }
  };
}

const settingsMotion = paneMotion();
const galleryMotion = paneMotion();
const settingsTitle = () => say().settingsTitle;
async function galleryView({ view, e, back }) {
  const active = await view.active();
  if (active === null) {
    const { Text } = view.ui();
    return h(Text, null, say().galleryEmpty);
  }
  const look = movingLook(view.look(active), galleryMotion);
  return pinned(e, galleryPane(look, { columns: e.props.bodyColumns, back }));
}
async function settingsView(host, e) {
  const prefs = await host.prefs();
  const custom = await host.custom();
  const editing = await host.editing();
  const base = resolveSkin(prefs.skin, custom) ?? resolveSkin(DEFAULT_PREFS.skin, custom);
  const skin = base === undefined ? undefined : forTheme(base, await host.isLight());
  const ui = host.ui();
  if (skin === undefined || e.surface === "mobile" || !("Input" in ui)) {
    return h(ui.Text, null, say().settingsElsewhere);
  }
  const look = movingLook(lookOf({ ui, active: { prefs, custom, skin }, surface: e.surface }), settingsMotion);
  const isLight = await host.isLight();
  const names = skinNames(custom);
  const skins = names.flatMap((name) => resolveSkin(name, custom) ?? []).map((one) => forTheme(one, isLight));
  const model = { names, editing, width: e.props.bodyColumns, swatches: swatchesOf(skins) };
  const home = await host.isHubOn() ? host.ports.home : undefined;
  return pinned(e, settingsPane({ look, ui, model, home, actions: settingsActions({ prefs, custom, editing }, host.ports) }));
}

const EDITS = new Set(["Edit", "MultiEdit", "Write"]);
const CLIP_HEAD = 8;
const CLIP_TAIL = 4;
async function resultCard(look, Svg, { props, columns, cwd }) {
  if (EDITS.has(props.tool) && !props.isErrored) {
    const diff = hunksOf(props.output);
    if (diff !== null && diffLines(diff.hunks).length <= MAX_LINES) {
      return diffCard(look, { Svg, input: diff, shownPath: shortenPath(diff.path, await cwd()), columns });
    }
  }
  if (props.tool === "Bash") {
    const shell = shellOutputOf(props.output);
    if (shell !== null && fitsCard(shell)) {
      return terminalCard(look, { Svg, output: shell, isErrored: props.isErrored, columns });
    }
  }
  return null;
}
function clippedOutput(props, isClipping) {
  const output = props.output;
  if (!isClipping || props.isErrored || props.tool !== "Bash" || typeof output?.stdout !== "string") {
    return;
  }
  const stdout = clipLines(output.stdout, CLIP_HEAD, CLIP_TAIL);
  return stdout === output.stdout ? undefined : { ...output, stdout };
}
const metaOf = (props, ms) => ({
  ...ms >= 0 && !props.isRunning ? { ms } : {},
  ...diffstat(props.output) ?? {}
});

async function toolUseView({ view, e, pass }) {
  const kind = kindOf(e.props.tool);
  const active = await view.active();
  if (kind === null || active === null) {
    return pass(e);
  }
  const ms = await view.duration();
  const target = summarize(e.props.tool, e.props.input, await view.cwd());
  const look = view.look(active);
  return withBeneath(look, toolRow(look, { call: e.props, kind, target, meta: metaOf(e.props, ms) }), await pass(e));
}
async function toolGroupView({ view, e, pass }) {
  const active = await view.active();
  if (active === null || e.props.isExpanded) {
    return pass(e);
  }
  const look = view.look(active);
  return withBeneath(look, groupRow(look, e.props.calls), await pass(e));
}
async function toolResultView({ view, e, pass }) {
  const active = await view.active();
  const look = active === null ? undefined : view.look(active, true);
  if (look?.svg !== undefined) {
    const card = await resultCard(look, look.svg, { props: e.props, columns: e.viewport?.columns ?? DEFAULT_COLUMNS, cwd: view.cwd });
    if (card !== null) {
      return withBeneath(look, pinned(e, card), await pass(e));
    }
  }
  const output = clippedOutput(e.props, active?.prefs.clipOutput === true);
  return output === undefined ? pass(e) : pass({ ...e, props: { ...e.props, output } });
}

const skinCommand = () => ({
  name: "skin",
  description: say().command,
  argumentHint: "[gallery | name | list | off | pin | unpin | share | rail | tables | shimmer | band | clip | icons | scene]",
  immediate: true
});
async function runSkinWord(host, word) {
  if (word === "") {
    await host.openSettings();
  } else if (word === "gallery") {
    await host.openGallery();
  } else if (isFolderWord(word)) {
    host.toast(await runFolderCommand(host, word));
  }
  return word === "" || word === "gallery" || isFolderWord(word);
}
async function runSkin(host, args) {
  if (await runSkinWord(host, args.trim().toLowerCase())) {
    return {};
  }
  const current = await host.prefs();
  const custom = await host.custom();
  const outcome = runSkinCommand(args, current, skinNames(custom));
  if (outcome.prefs !== current) {
    await commit(host, { prefs: outcome.prefs, custom });
  }
  if (outcome.channel === "row") {
    return { text: rowReply(outcome.message, { args, isPinned: await host.isPinned(), columns: host.columns() }) };
  }
  host.toast(outcome.message);
  return {};
}

const messageOf = (error) => error instanceof Error ? error.message : String(error);
function sessionLoad() {
  let loadedFor;
  let isThemePending = false;
  async function retryTheme(host) {
    if (!isThemePending)
      return;
    isThemePending = false;
    await host.theme().catch((error) => {
      isThemePending = true;
      host.log(`skins: theme not read yet: ${messageOf(error)}`);
    });
  }
  async function loadFor(host, id) {
    loadedFor = id;
    try {
      await host.load();
    } catch (error) {
      if (loadedFor === id)
        loadedFor = undefined;
      host.log(`skins: not loaded yet: ${messageOf(error)}`);
      return;
    }
    isThemePending = true;
    await retryTheme(host);
  }
  return {
    start: async (host, known) => loadFor(host, known ?? await host.id()),
    turn: async (host) => {
      const id = await host.id();
      if (id !== undefined && id !== loadedFor)
        return loadFor(host, id);
      await retryTheme(host);
    }
  };
}
const DESIGN_WAIT_MS = 1000;
function waitAtMost(work, ms, after) {
  return new Promise((resolve) => {
    const cap = after(ms, resolve);
    work.then(() => {
      cap.cancel();
      resolve();
    });
  });
}

const PROBE_MS = 2000;
async function systemDark(host) {
  try {
    return macDark(await host.probe(["defaults", "read", "-g", "AppleInterfaceStyle"]));
  } catch {}
  try {
    return gnomeDark(await host.probe(["gsettings", "get", "org.gnome.desktop.interface", "color-scheme"]));
  } catch {
    return;
  }
}
async function refreshTheme(host) {
  const hints = await host.hints();
  const needsSystem = resolveLight(hints) !== resolveLight({ ...hints, systemDark: false });
  const isLight = resolveLight({ ...hints, systemDark: needsSystem ? await systemDark(host) : undefined });
  await host.setLight(isLight);
}

const KEPT_TURNS = 40;
const NO_STATS = { tools: 0, added: 0, removed: 0 };
const addCall = (stats, diff) => ({
  tools: stats.tools + 1,
  added: stats.added + (diff?.added ?? 0),
  removed: stats.removed + (diff?.removed ?? 0)
});
const withTurn = (turns, durationMs, stats) => Object.fromEntries([...Object.entries(turns), [String(durationMs), stats]].slice(-KEPT_TURNS));

const durationAtom$1 = atom({ plugin: "skins", key: "duration" }, -1);
const imagesAtom$1 = atom({ plugin: "skins", key: "images" }, false);
function onCalls(on, live) {
  on("session.append", async ($, e, next) => {
    const stored = await next(e);
    const hasImage = e.door === "prompt" && e.message.content.some((block) => block.type === "image");
    if (hasImage && stored.uuid !== undefined)
      await update($, memberOf(imagesAtom$1, { requestId: stored.uuid }), () => true);
    return stored;
  });
  on("tool.call", async ($, e, next) => {
    const startedAt = await $.clock.now();
    const ran = await next(e);
    const ms = await $.clock.now() - startedAt;
    await update($, memberOf(durationAtom$1, { requestId: e.tool_use_id }), () => ms);
    if (e.agentId === undefined && e.tool !== DESIGN && ran.deny === undefined)
      live.stats = addCall(live.stats, diffstat(ran.result));
    return ran;
  });
}

const paneOf$1 = (value) => {
  if (typeof value !== "object" || value === null)
    return null;
  const pane = value.pane;
  return typeof pane === "string" && pane !== "" ? pane : null;
};
function isOffStage(value, pane) {
  const staged = paneOf$1(value);
  return staged !== null && staged !== pane;
}
const shownOf = (pane, at) => ({ pane, at });

const SETTINGS = "skins-settings";
const GALLERY = "skins-gallery";
const DESIGN_MATCH = /^mcp__skins__design$/;
const NEXT_TICK_MS = 1;
const prefsAtom = atom({ plugin: "skins", key: "prefs" }, DEFAULT_PREFS);
const customAtom = atom({ plugin: "skins", key: "custom" }, {});
const startedAtom = atom({ plugin: "skins", key: "startedAt" }, 0);
const frameAtom = atom({ plugin: "skins", key: "frame" }, 0);
const turnsAtom = atom({ plugin: "skins", key: "turns" }, {});
const durationAtom = atom({ plugin: "skins", key: "duration" }, -1);
const editingAtom = atom({ plugin: "skins", key: "editing" }, "user");
const lightAtom = atom({ plugin: "skins", key: "isLight" }, false);
const imagesAtom = atom({ plugin: "skins", key: "images" }, false);
const usageAtom = atom({ plugin: "skins", key: "usage" }, { context: null, limits: [] });
const compactingAtom = atom({ plugin: "skins", key: "compacting" }, false);
const pinnedAtom = atom({ plugin: "skins", key: "pinned" }, false);
const hubAtom = atom({ plugin: "skins", key: "hub" }, EMPTY_HUB);
function storeOf($) {
  return {
    storeGet: (key) => $.store.get(key),
    storeSet: (key, value) => $.store.set(key, value),
    cwd: () => $.session.cwd(),
    now: () => $.clock.now(),
    prefs: () => read($, prefsAtom),
    setPrefs: (prefs) => update($, prefsAtom, () => prefs),
    custom: () => read($, customAtom),
    setCustom: (custom) => update($, customAtom, () => custom),
    isPinned: () => read($, pinnedAtom),
    setPinned: (isPinned) => update($, pinnedAtom, () => isPinned),
    isLight: () => read($, lightAtom),
    hub: () => read($, hubAtom),
    setHub: (card) => update($, hubAtom, () => card)
  };
}
function themeOf($) {
  return {
    hints: async () => {
      const rows = await $.config.list();
      return { override: await $.env.get("SKINS_THEME"), theme: rows.find((row) => row.key === "theme")?.value, colorfgbg: await $.env.get("COLORFGBG") };
    },
    probe: (argv) => $.process.run(argv, { timeoutMs: PROBE_MS }),
    setLight: (isLight) => update($, lightAtom, () => isLight)
  };
}
async function refreshUsage($) {
  const snap = usageSnap(await $.session.usage({ breakdown: "summary" }));
  await update($, usageAtom, () => snap);
}
async function openSettings($, isAsked) {
  const opened = await opening(settingsMotion, () => $.ui.open({ id: SETTINGS, title: settingsTitle(), closeOnEscape: true, ...{ focus: true }  }));
  await $.ui.close({ id: GALLERY });
  if (opened.isPlaced)
    await reportShown($);
}
async function reportShown($) {
  try {
    if ((await $.state.get({ plugin: "modz", key: "isOn" })).value !== true)
      return;
    await $.state.set({ plugin: "skins", key: "shown" }, shownOf(HUB_PANE, await $.clock.now()));
  } catch {
    $.ui.log("skins: could not tell the hub the settings are shown", { to: "debug" });
  }
}
async function openGallery($) {
  await opening(galleryMotion, () => $.ui.open({ id: GALLERY, title: say().galleryTitle, focus: true, closeOnEscape: true }));
  await $.ui.close({ id: SETTINGS });
}
function compact($) {
  update($, compactingAtom, () => true);
  $.clock.after(NEXT_TICK_MS, () => $.command.run({ command: "compact" }).catch((error) => $.ui.toast(say().compactFailed(error instanceof Error ? error.message : String(error)))).finally(() => update($, compactingAtom, () => false)));
}
function viewOf($, e, live) {
  const copy = (text) => void $.ui.copy({ text, surface: e.surface }).then((result) => $.ui.toast(result.isCopied ? say().copied : say().notCopied));
  return {
    active: () => activeSkin(storeOf($)),
    ui: () => $.ui.resolve(e),
    look: (active, isCopying = false) => lookOf({ ui: $.ui.resolve(e), active, surface: e.surface, ...isCopying ? { copy } : {} }),
    cwd: () => $.session.cwd(),
    now: () => $.clock.now(),
    duration: () => read($, memberOf(durationAtom, e)),
    hasImages: () => read($, memberOf(imagesAtom, e)),
    frame: () => read($, frameAtom),
    startedAt: () => read($, startedAtom),
    turns: () => read($, turnsAtom),
    usage: () => read($, usageAtom),
    isCompacting: () => read($, compactingAtom),
    compact: () => compact($),
    drewAt: (columns) => {
      live.lastColumns = columns;
    }
  };
}
function goHome($) {
  $.clock.now().then((at) => $.state.set({ plugin: "skins", key: "home" }, { at })).catch(() => $.ui.log("skins: could not go back to the hub", { to: "debug" }));
}
function paneOf($, e) {
  return {
    ...storeOf($),
    ui: () => $.ui.resolve(e),
    editing: () => read($, editingAtom),
    isHubOn: async () => (await $.state.get({ plugin: "modz", key: "isOn" })).value === true,
    ports: {
      home: () => goHome($),
      commit: (state) => void commit(storeOf($), state),
      edit: (slot) => void update($, editingAtom, () => slot),
      toast: (text) => $.ui.toast(text),
      gallery: () => void openGallery($)
    }
  };
}
const sessionOf = ($) => ({
  id: () => $.session.id().catch(() => {
    return;
  }),
  load: () => load(storeOf($)),
  theme: () => refreshTheme(themeOf($)).then(() => syncHub(storeOf($))),
  log: (text) => $.ui.log(text, { to: "debug" })
});
function onSession(on, live, loaded) {
  on("session.start", async ($, e, next) => {
    setLang(await $.env.get("MODZ_LANG").catch(() => {
      return;
    }));
    await $.command.register(skinCommand());
    const design = $.tool.register({ name: DESIGN_TOOL.name, description: DESIGN_TOOL.description, inputSchema: DESIGN_TOOL.inputSchema });
    await waitAtMost(design.catch((error) => $.ui.log(`skins: design tool: ${String(error)}`, { to: "debug" })), DESIGN_WAIT_MS, (ms, fn) => $.clock.after(ms, fn));
    await loaded.start(sessionOf($));
    await refreshUsage($);
    live.ticker?.cancel();
    const surfaces = await $.session.surfaces().catch(() => []);
    const isTicking = surfaces.length === 0 || surfaces.includes("terminal");
    live.ticker = isTicking ? $.clock.every(FRAME_MS, () => void (live.isWorking && update($, frameAtom, (frame) => frame + 1))) : undefined;
    return next(e);
  });
  on("classic.SessionStart", { source: ["clear", "resume", "fork"] }, async ($, e, next) => {
    await loaded.start(sessionOf($), typeof e.session_id === "string" && e.session_id !== "" ? e.session_id : undefined);
    return next(e);
  });
}
function onTurnStart(on, live, loaded) {
  on("turn.start", async ($, e, next) => {
    await loaded.turn(sessionOf($));
    live.stats = NO_STATS;
    live.isWorking = true;
    const now = await $.clock.now();
    await update($, startedAtom, () => now);
    return next(e);
  });
  on("config.set", async ($, e, next) => {
    const result = await next(e);
    if (e.key === "theme")
      await sessionOf($).theme();
    return result;
  });
}
function onTurnEnd(on, live) {
  on("session.measure", async ($, e, next) => {
    await refreshUsage($);
    return next(e);
  });
  on("turn.complete", async ($, e, next) => {
    if (e.agentId === undefined) {
      await refreshUsage($);
      live.isWorking = false;
      const finished = live.stats;
      await update($, turnsAtom, (turns) => withTurn(turns, e.durationMs, finished));
    }
    return next(e);
  });
  onCalls(on, live);
}
function onCommands(on, live) {
  on("tool.call", { tool: DESIGN_MATCH }, async ($, e) => {
    const outcome = runDesign(e, { prefs: await read($, prefsAtom), custom: await read($, customAtom) });
    if (outcome.isError)
      return { deny: outcome.text };
    await commit(storeOf($), outcome.state);
    return { result: outcome.text };
  });
  on("state.set", { plugin: "modz", key: "open" }, async ($, e, next) => {
    const done = await next(e);
    if (isOwnOpen(e.value))
      await openSettings($);
    return done;
  }).catch(($, e, next) => next(e));
  on("state.set", { plugin: "modz", key: "stage" }, async ($, e, next) => {
    const done = await next(e);
    if (isOffStage(e.value, HUB_PANE))
      for (const id of [SETTINGS, GALLERY])
        await $.ui.close({ id });
    return done;
  }).catch(($, e, next) => next(e));
  on("command.run", { command: "skin" }, ($, e) => runSkin({ ...storeOf($), openSettings: () => openSettings($), openGallery: () => openGallery($), toast: (text) => $.ui.toast(text), columns: () => live.lastColumns }, e.args));
}
function onRenders(on, live) {
  on("ui.render", { component: "Pane", requestId: SETTINGS }, ($, e) => settingsView(paneOf($, e), e));
  on("ui.render", { component: "Pane", requestId: GALLERY }, ($, e) => galleryView({ view: viewOf($, e, live), e, back: () => void openSettings($) }));
  on("ui.render", { component: "ToolUse" }, ($, e, next) => toolUseView({ view: viewOf($, e, live), e, pass: next }));
  on("ui.render", { component: "ToolGroup" }, ($, e, next) => toolGroupView({ view: viewOf($, e, live), e, pass: next }));
  on("ui.render", { component: "ToolResult" }, ($, e, next) => toolResultView({ view: viewOf($, e, live), e, pass: next }));
  on("ui.render", { component: "UserMessage" }, ($, e, next) => userMessageView({ view: viewOf($, e, live), e, pass: next }));
  on("ui.render", { component: "AssistantMessage" }, ($, e, next) => replyView({ view: viewOf($, e, live), e, pass: next }));
  on("ui.render", { component: "Spinner" }, ($, e, next) => spinnerView({ view: viewOf($, e, live), e, pass: next }));
  on("ui.render", { component: "TurnDuration" }, ($, e, next) => turnDurationView({ view: viewOf($, e, live), e, pass: next }));
  on("ui.render", { component: "AbovePrompt" }, ($, e, next) => abovePromptView({ view: viewOf($, e, live), e, pass: next }));
  on("ui.render", { component: "AskUserQuestion" }, ($, e, next) => askView({ view: viewOf($, e, live), e, pass: next }));
}
const register = (on) => {
  const live = { stats: NO_STATS, isWorking: false };
  const loaded = sessionLoad();
  onSession(on, live, loaded);
  onTurnStart(on, live, loaded);
  onTurnEnd(on, live);
  onCommands(on, live);
  onRenders(on, live);
};

export { register };
