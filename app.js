const APP_PASSWORD = "windfly2007";
const AUTH_KEY = "hsing-stock-ai-unlocked";
const HOLDINGS_KEY = "hsing-stock-ai-holdings";
const MARKET_DATA_URL = "./data/market-data.json";
let deferredInstallPrompt = null;

const holdings = [
  {
    symbol: "2330",
    name: "台積電",
    shares: 75,
    cost: 2069.04,
    price: 2365,
    priceDisplay: "2365.0",
    change: 14.3,
    pnl: 22197,
    score: 82,
    trend: "偏多",
    support: ["2300", "2200", "2150"],
    resistance: ["2400", "2450"],
    stop: "2150",
    add: "站回 2300 以上且量穩",
    advice: "2200 以上續抱，跌破 2150 才考慮調整。",
    detail: [
      "2300 以上屬於強勢。",
      "2200～2300 屬於正常修正。",
      "2200 以下警戒，2150 以下才進入危險區。"
    ],
    tech: { ma5: "2320", ma10: "2280", ma20: "2200", kd: "K 72 / D 66", macd: "高檔震盪", volume: "守 2200 則偏正常修正" }
  },
  {
    symbol: "2317",
    name: "鴻海",
    shares: 200,
    cost: 264.72,
    price: 284.5,
    priceDisplay: "284.5",
    change: 7.47,
    pnl: 3956,
    score: 68,
    trend: "中性",
    support: ["275", "270"],
    resistance: ["290", "300"],
    stop: "270",
    add: "突破 290 且法人買超",
    advice: "280 以上續抱，270 以下提高警覺。",
    detail: ["290 以上屬於強勢。", "275～290 屬於正常整理。", "270 以下進入警戒。"],
    tech: { ma5: "282", ma10: "276", ma20: "268", kd: "K 58 / D 55", macd: "接近零軸", volume: "280 以上續抱觀察" }
  },
  {
    symbol: "2382",
    name: "廣達",
    shares: 500,
    cost: 315.49,
    price: 390.5,
    priceDisplay: "390.5",
    change: 23.78,
    pnl: 37505,
    score: 55,
    trend: "偏弱整理",
    support: ["370", "360"],
    resistance: ["390", "400"],
    stop: "360",
    add: "站回 390 以上且量穩",
    advice: "跌破 360 且無法站回，可考慮減碼 100～200 股，不要一次賣 500 股。",
    detail: ["390 以上屬於強勢。", "370～390 屬於正常修正。", "360 是關鍵支撐，350 以下危險。"],
    tech: { ma5: "386", ma10: "372", ma20: "350", kd: "K 66 / D 61", macd: "高檔整理", volume: "跌破 360 且收不回才降部位" }
  },
  {
    symbol: "2027",
    name: "大成鋼",
    shares: 1000,
    cost: 42.69,
    price: 43.8,
    priceDisplay: "43.8",
    change: 2.6,
    pnl: 1110,
    score: 72,
    trend: "偏多",
    support: ["42", "41"],
    resistance: ["44", "46"],
    stop: "41",
    add: "站上 44 且量增",
    advice: "外資連買 8 天，優先續抱。",
    detail: ["44 以上屬於強勢。", "42～44 屬於正常整理。", "41 以下進入警戒。"],
    tech: { ma5: "43.2", ma10: "42.8", ma20: "42.0", kd: "K 61 / D 56", macd: "溫和偏多", volume: "外資連買 8 天，優先續抱" }
  }
];

let indicatorGroups = [
  { title: "AI / 半導體市場", items: [["台積電 ADR", "415.23 / -6.69%", "down"], ["輝達", "205.10 / -6.20%", "down"], ["費城半導體", "12222.33 / -10.26%", "down"], ["NASDAQ", "25713.68 / -4.18%", "down"]] },
  { title: "風險與美元", items: [["美債 10Y", "4.54 / +1.32%", "up"], ["VIX", "21.6", "up"], ["美元指數", "100.07 / +0.66%", "up"]] },
  { title: "台股相關", items: [["台指期夜盤", "待更新", "flat"], ["台幣匯率", "待更新", "flat"], ["外資期貨 OI", "待更新", "flat"], ["加權指數", "待更新", "flat"]] }
];

let impacts = [
  ["費半重挫", "-10.26%", "AI 族群獲利了結"],
  ["台積電 ADR 下跌", "-6.69%", "台積電看 2200 支撐"],
  ["VIX 21.6", "升高", "中大型修正，非股災"],
  ["修正判斷", "三檔守關鍵", "仍屬主升段修正"]
];

const timeline = [
  ["盤前", "判定為中大型修正，不是金融危機，也不是股災。"],
  ["09:10", "確認開盤方向與恐慌賣壓是否擴大。"],
  ["09:30", "確認台積電守 2200、廣達守 360、鴻海守 270。"],
  ["10:30", "確認盤勢與量價延續；三檔守住關鍵價，視為 AI 主升段中的修正。"],
  ["13:00", "若三檔跌破且收不回，判定中期修正開始。"]
];

const scores = [
  ["技術分數", 62],
  ["籌碼分數", 58],
  ["先行指標分數", 35],
  ["產業分數", 52],
  ["風險分數", 75]
];

const alerts = [
  { title: "跌破關鍵價減碼提醒", items: ["台積電跌破 2150：考慮調整", "廣達跌破 360 且站不回：減碼 100～200 股", "廣達跌破 350：危險提醒", "鴻海跌破 270：提高警覺", "大成鋼跌破 41：警戒"] },
  { title: "漲太多減碼提醒", items: ["台積電急漲站上 2450 且量縮：提醒獲利減碼", "廣達急漲站上 420 且量縮：提醒分批減碼", "鴻海急漲站上 300 且量縮：提醒獲利減碼", "大成鋼急漲站上 46 且量縮：提醒減碼觀察"] },
  { title: "後續加碼提醒", items: ["台積電回測 2200 不破並站回 2300：追蹤加碼", "廣達回測 360 不破並站回 390：追蹤加碼", "鴻海守住 270 並站回 290：追蹤加碼", "大成鋼守住 42 並站回 44：追蹤加碼"] },
  { title: "市場提醒", items: ["費半跌超過 10%", "台積電 ADR 跌超過 6%", "NASDAQ 跌超過 4%", "VIX 高於 21", "美元指數突破 100"] },
  { title: "AI 判斷提醒", items: ["三檔守住關鍵價：主升段修正", "三檔跌破且收不回：中期修正開始", "08:30 開盤前策略", "09:10 盤勢確認", "09:30 支撐確認", "10:30 盤勢確認", "13:00 收盤前判斷"] }
];

const scoreClass = (score) => score >= 72 ? "score-high" : score >= 60 ? "score-mid" : "score-low";
const changeClass = (change) => change > 0 ? "up" : change < 0 ? "down" : "flat";
const formatChange = (change) => `${change > 0 ? "+" : ""}${change.toFixed(2)}%`;
const formatNumber = (value, digits = 2) => Number(value).toLocaleString("zh-TW", { maximumFractionDigits: digits });

function recalcStock(stock) {
  const cost = Number(stock.cost) || 0;
  const price = Number(stock.price) || 0;
  const shares = Number(stock.shares) || 0;
  stock.pnl = Math.round((price - cost) * shares);
  stock.change = cost ? ((price - cost) / cost) * 100 : 0;
  stock.priceDisplay = price.toFixed(price >= 1000 ? 1 : 2).replace(/\.00$/, "");
}

function loadSavedHoldings() {
  try {
    const saved = JSON.parse(localStorage.getItem(HOLDINGS_KEY) || "[]");
    saved.forEach(savedStock => {
      const stock = holdings.find(item => item.symbol === savedStock.symbol);
      if (!stock) return;
      stock.shares = Number(savedStock.shares) || 0;
      stock.cost = Number(savedStock.cost) || 0;
      stock.price = Number(savedStock.price) || 0;
      recalcStock(stock);
    });
  } catch {
    localStorage.removeItem(HOLDINGS_KEY);
  }
}

function saveHoldingsFromSettings() {
  holdings.forEach(stock => {
    const shares = document.querySelector(`[name="shares-${stock.symbol}"]`);
    const cost = document.querySelector(`[name="cost-${stock.symbol}"]`);
    const price = document.querySelector(`[name="price-${stock.symbol}"]`);
    stock.shares = Number(shares.value) || 0;
    stock.cost = Number(cost.value) || 0;
    stock.price = Number(price.value) || 0;
    recalcStock(stock);
  });

  localStorage.setItem(HOLDINGS_KEY, JSON.stringify(holdings.map(stock => ({
    symbol: stock.symbol,
    shares: stock.shares,
    cost: stock.cost,
    price: stock.price
  }))));

  renderAll();
  const saved = document.querySelector("#settingsSaved");
  saved.textContent = "已儲存，首頁與持股頁已更新。";
  window.setTimeout(() => {
    saved.textContent = "";
  }, 2600);
}

function renderAll() {
  renderMarketSummary();
  renderHomeIndicators();
  renderHomeHoldings();
  renderHoldingCards();
  renderIndicators();
  renderStrategy();
  renderAlerts();
  renderHoldingSettings();
}

function renderMarketSummary() {
  const score = document.querySelector("#marketScore");
  if (score && !score.dataset.liveScore) score.textContent = "AI 總分 54";
}

function renderHomeIndicators() {
  const target = document.querySelector("#homeIndicators");
  if (!target) return;

  const homeItems = [
    ["台積電 ADR", "-6.69%", "down"],
    ["輝達", "-6.20%", "down"],
    ["費半", "-10.26%", "down"],
    ["NASDAQ", "-4.18%", "down"],
    ["VIX", "21.6", "up"],
    ["美元指數", "+0.66%", "up"]
  ];

  const fromMarketData = indicatorGroups.flatMap(group => group.items).filter(([name]) =>
    ["台積電 ADR", "輝達", "費城半導體", "NASDAQ", "VIX", "美元指數"].includes(name)
  );
  const items = fromMarketData.length ? fromMarketData : homeItems;

  target.innerHTML = items.map(([name, value, direction]) => `
    <div><b>${name === "費城半導體" ? "費半" : name}</b><span class="${direction}">${value}</span></div>
  `).join("");
}

function applyMarketData(data) {
  if (data.market) {
    const signal = document.querySelector("#marketSignal");
    const score = document.querySelector("#marketScore");
    const updated = document.querySelector("#marketUpdated");
    const advice = document.querySelector("#marketAdvice");

    if (signal && data.market.signal) {
      signal.textContent = data.market.signal;
      signal.className = `signal ${data.market.signalClass || "signal-risk"}`;
    }
    if (score && Number.isFinite(Number(data.market.score))) {
      score.textContent = `AI 總分 ${data.market.score}`;
      score.dataset.liveScore = "true";
    }
    if (updated && data.updatedAt) updated.textContent = `更新時間：${data.updatedAt}`;
    if (advice && data.market.advice) advice.textContent = `建議：${data.market.advice}`;
  }

  if (data.holdings) {
    holdings.forEach(stock => {
      const live = data.holdings[stock.symbol];
      if (!live) return;
      if (Number.isFinite(Number(live.price))) stock.price = Number(live.price);
      if (Number.isFinite(Number(live.score))) stock.score = Number(live.score);
      if (live.trend) stock.trend = live.trend;
      recalcStock(stock);
    });
  }

  if (Array.isArray(data.indicatorGroups)) {
    indicatorGroups = data.indicatorGroups;
  }

  if (Array.isArray(data.impacts)) {
    impacts = data.impacts;
  }

  renderAll();
}

async function loadMarketData() {
  try {
    const response = await fetch(`${MARKET_DATA_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    applyMarketData(data);
  } catch (error) {
    console.warn("Market data update failed", error);
  }
}

function renderHomeHoldings() {
  const target = document.querySelector("#homeHoldings");
  target.innerHTML = holdings.map((stock, index) => `
    <button class="holding-row" type="button" data-stock="${index}">
      <span><b>${stock.name}</b><small>${stock.symbol}</small></span>
      <span><b>${stock.priceDisplay ?? stock.price}</b><small>現價</small></span>
      <span class="${changeClass(stock.change)} hide-small"><b>${formatChange(stock.change)}</b><small>報酬</small></span>
      <span class="score-pill ${scoreClass(stock.score)}">${stock.score}</span>
    </button>
  `).join("");
}

function renderHoldingCards() {
  const target = document.querySelector("#holdingCards");
  target.innerHTML = holdings.map((stock, index) => `
    <article class="holding-card" data-stock="${index}" tabindex="0">
      <div class="card-head">
        <div>
          <h2>${stock.name}（${stock.symbol}）</h2>
          <small>趨勢：${stock.trend}</small>
        </div>
        <span class="score-pill ${scoreClass(stock.score)}">AI ${stock.score}</span>
      </div>
      <div class="card-grid">
        <div class="metric"><span>成本</span><b>${stock.cost}</b></div>
        <div class="metric"><span>現價</span><b>${stock.priceDisplay ?? stock.price}</b></div>
        <div class="metric"><span>損益</span><b class="${stock.pnl >= 0 ? "up" : "down"}">${stock.pnl ? `${stock.pnl > 0 ? "+" : ""}${stock.pnl.toLocaleString("zh-TW")}` : "-"}</b></div>
        <div class="metric"><span>支撐</span><b>${stock.support.slice(0, 2).join(" / ")}</b></div>
        <div class="metric"><span>壓力</span><b>${stock.resistance.join(" / ")}</b></div>
        <div class="metric"><span>停損</span><b>${stock.stop}</b></div>
      </div>
      <p class="advice">${stock.advice}</p>
    </article>
  `).join("");
}

function renderIndicators() {
  document.querySelector("#indicatorGroups").innerHTML = indicatorGroups.map(group => `
    <section class="section indicator-group">
      <h3>${group.title}</h3>
      <div class="indicator-grid">
        ${group.items.map(([name, value, direction]) => `
          <div class="indicator-cell"><b>${name}</b><span class="${direction}">${value}</span></div>
        `).join("")}
      </div>
    </section>
  `).join("");

  document.querySelector("#impactTable").innerHTML = impacts.map(([name, change, impact]) => `
    <div class="impact-row"><b>${name}</b><span class="${change.includes("-") ? "down" : "up"}">${change}<br>${impact}</span></div>
  `).join("");
}

function renderStrategy() {
  document.querySelector("#strategyTimeline").innerHTML = timeline.map(([time, text]) => `
    <div class="timeline-row"><time>${time}</time><span>${text}</span></div>
  `).join("");

  document.querySelector("#scoreBreakdown").innerHTML = scores.map(([name, value]) => `
    <div class="score-row">
      <b>${name}</b>
      <div class="score-bar" aria-hidden="true"><i style="width: ${value}%"></i></div>
      <span>${value}</span>
    </div>
  `).join("");
}

function renderAlerts() {
  document.querySelector("#alertGroups").innerHTML = alerts.map(group => `
    <section class="section alert-group">
      <h2>${group.title}</h2>
      ${group.items.map((item, index) => `
        <label class="alert-row">
          <span>${item}</span>
          <input type="checkbox" ${index < 2 ? "checked" : ""} />
        </label>
      `).join("")}
    </section>
  `).join("");
}

function renderHoldingSettings() {
  const target = document.querySelector("#holdingSettings");
  target.innerHTML = holdings.map(stock => `
    <article class="stock-setting-card">
      <div class="stock-setting-head">
        <b>${stock.symbol} ${stock.name}</b>
        <span>損益 ${stock.pnl > 0 ? "+" : ""}${formatNumber(stock.pnl, 0)}</span>
      </div>
      <div class="stock-setting-grid">
        <label>
          <span>股數</span>
          <input name="shares-${stock.symbol}" type="number" min="0" step="1" value="${stock.shares}" />
        </label>
        <label>
          <span>成本</span>
          <input name="cost-${stock.symbol}" type="number" min="0" step="0.01" value="${stock.cost}" />
        </label>
        <label>
          <span>現價</span>
          <input name="price-${stock.symbol}" type="number" min="0" step="0.01" value="${stock.price}" />
        </label>
      </div>
    </article>
  `).join("");
}

function openStockDialog(index) {
  const stock = holdings[index];
  const dialog = document.querySelector("#holdingDialog");
  document.querySelector("#dialogSymbol").textContent = `${stock.symbol}｜持股 ${stock.shares} 股`;
  document.querySelector("#dialogName").textContent = stock.name;
  document.querySelector("#dialogContent").innerHTML = `
    <div class="detail-grid">
      <section class="detail-block">
        <h3>基本資訊</h3>
        <p>成本：${stock.cost}｜現價：${stock.priceDisplay ?? stock.price}｜損益：${stock.pnl ? `${stock.pnl > 0 ? "+" : ""}${stock.pnl.toLocaleString("zh-TW")}` : "-"}</p>
        <p>AI 分數：${stock.score}｜目前趨勢：${stock.trend}</p>
      </section>
      <section class="detail-block">
        <h3>技術分析</h3>
        <p>MA5 / MA10 / MA20：${stock.tech.ma5} / ${stock.tech.ma10} / ${stock.tech.ma20}</p>
        <p>KD：${stock.tech.kd}</p>
        <p>MACD：${stock.tech.macd}</p>
        <p>成交量：${stock.tech.volume}</p>
      </section>
      <section class="detail-block">
        <h3>關鍵價位</h3>
        <p>支撐：${stock.support.join(" / ")}</p>
        <p>壓力：${stock.resistance.join(" / ")}</p>
        <p>停損價：${stock.stop}</p>
        <p>加碼價：${stock.add}</p>
      </section>
      <section class="detail-block">
        <h3>操作建議</h3>
        ${stock.detail.map(item => `<p>${item}</p>`).join("")}
      </section>
    </div>
  `;
  dialog.showModal();
}

function showPage(pageName) {
  document.querySelectorAll(".page").forEach(page => page.classList.remove("is-active"));
  document.querySelector(`#page-${pageName}`).classList.add("is-active");
  document.querySelectorAll(".nav-item").forEach(tab => tab.classList.toggle("is-active", tab.dataset.page === pageName));
}

function lockApp() {
  sessionStorage.removeItem(AUTH_KEY);
  document.body.classList.add("is-locked");
  document.querySelector("#passwordInput").value = "";
  document.querySelector("#passwordError").textContent = "";
  requestAnimationFrame(() => document.querySelector("#passwordInput").focus());
}

function unlockApp() {
  sessionStorage.setItem(AUTH_KEY, "true");
  document.body.classList.remove("is-locked");
}

function initPasswordGate() {
  const form = document.querySelector("#passwordForm");
  const input = document.querySelector("#passwordInput");
  const error = document.querySelector("#passwordError");

  if (sessionStorage.getItem(AUTH_KEY) === "true") {
    unlockApp();
  } else {
    lockApp();
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    if (input.value === APP_PASSWORD) {
      unlockApp();
      return;
    }

    error.textContent = "密碼不正確，請再試一次。";
    input.select();
  });

  document.querySelector("#logoutButton").addEventListener("click", lockApp);
}

function bindEvents() {
  document.querySelectorAll(".nav-item").forEach(tab => {
    tab.addEventListener("click", () => showPage(tab.dataset.page));
  });

  document.querySelector("#settingsButton").addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(tab => tab.classList.remove("is-active"));
    showPage("settings");
  });

  document.body.addEventListener("click", event => {
    const card = event.target.closest("[data-stock]");
    if (card) openStockDialog(Number(card.dataset.stock));
  });

  document.querySelector("#closeDialog").addEventListener("click", () => {
    document.querySelector("#holdingDialog").close();
  });

  document.querySelectorAll(".segmented button").forEach(button => {
    button.addEventListener("click", () => {
      button.parentElement.querySelectorAll("button").forEach(item => item.classList.remove("is-selected"));
      button.classList.add("is-selected");
    });
  });

  document.querySelector("#holdingSettingsForm").addEventListener("submit", event => {
    event.preventDefault();
    saveHoldingsFromSettings();
  });

  document.querySelector("#testNotificationButton").addEventListener("click", sendTestNotification);
}

async function sendTestNotification() {
  const status = document.querySelector("#notificationStatus");
  if (!("Notification" in window)) {
    status.textContent = "這個瀏覽器不支援通知。";
    return;
  }

  const permission = Notification.permission === "default"
    ? await Notification.requestPermission()
    : Notification.permission;

  if (permission !== "granted") {
    status.textContent = "通知尚未允許，請到瀏覽器設定開啟。";
    return;
  }

  new Notification("Hsing Stock AI", {
    body: "測試通知：跌破關鍵價、漲太多減碼、回測守住加碼，都會放在提醒規則裡。",
    icon: "./icon.svg"
  });
  status.textContent = "測試通知已送出。";
}

function initPwaInstall() {
  const installButton = document.querySelector("#installButton");

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installButton.hidden = false;
  });

  installButton.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installButton.hidden = true;
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    installButton.hidden = true;
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(error => {
      console.warn("Service worker registration failed", error);
    });
  });
}

loadSavedHoldings();
renderAll();
bindEvents();
initPasswordGate();
initPwaInstall();
registerServiceWorker();
loadMarketData();
