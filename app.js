// Permiscopio pilot: client-side demo using illustrative data from data.js.
const fmtNum = (n) => Number(n).toLocaleString("es-CL");
const fmtUSD = (n) => `US$ ${fmtNum(n)} MM`;

function fmtDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("es-CL", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

let appInitialized = false;
let proyectoActivo = null;
let lastDrawerTrigger = null;
const PROYECTO_POR_NOMBRE = new Map(PROYECTOS.map((p) => [p.nombre, p]));
const SENALES_POR_NOMBRE = new Map(SENALES_DOCUMENTALES.map((s) => [s.nombre, s]));

// ---------- ENTRY + NAVIGATION ----------
document.getElementById("login-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.getElementById("email").value || "jorge@ejemplo.cl";
  const name = email.split("@")[0];
  const displayName = name.charAt(0).toUpperCase() + name.slice(1);
  document.getElementById("user-name").textContent = displayName;
  document.getElementById("user-avatar").textContent = displayName.charAt(0);
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("app").classList.add("active");
  initApp();
  navigateTo("resumen");
  document.querySelector(".navlink.active")?.focus();
});

function logout() {
  closeDrawer(false);
  document.getElementById("app").classList.remove("active");
  document.getElementById("login-screen").style.display = "grid";
  document.getElementById("email").focus();
}

["logout-btn", "mobile-logout-btn"].forEach((id) => {
  document.getElementById(id).addEventListener("click", logout);
});

function navigateTo(view) {
  document.querySelectorAll(".navlink").forEach((button) => {
    const active = button.dataset.view === view;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  document.querySelectorAll(".view").forEach((section) => {
    section.classList.toggle("active", section.id === `view-${view}`);
  });
  document.querySelector(`#view-${view} h1`)?.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".navlink").forEach((button) => {
  button.addEventListener("click", () => navigateTo(button.dataset.view));
});
document.querySelectorAll("[data-go-view]").forEach((button) => {
  button.addEventListener("click", () => navigateTo(button.dataset.goView));
});

function initApp() {
  if (appInitialized) return;
  appInitialized = true;
  renderKPIs();
  renderFeed();
  populateFilters();
  renderTable(PROYECTOS);
  renderInsights();
  renderCharts();
  renderDocumentos();
  wireFilters();
  wireProjectOpeners();
  wireDrawer();
  wirePortfolioAssistant();
}

// ---------- SUMMARY ----------
function renderKPIs() {
  const activos = PROYECTOS.filter((p) => p.estado === "En calificación");
  const inversion = activos.reduce((sum, p) => sum + p.inversion, 0);
  const diasPromedio = Math.round(activos.reduce((sum, p) => sum + p.dias, 0) / activos.length);
  const sobreBenchmark = activos.filter((p) => p.dias > MEDIANA_SECTOR[p.sector]);
  const porcentajeRiesgo = Math.round((sobreBenchmark.length / activos.length) * 100);

  document.getElementById("kpi-inv").textContent = fmtUSD(inversion);
  document.getElementById("signal-risk").textContent = `${porcentajeRiesgo}%`;
  document.getElementById("kpi-count").textContent = fmtNum(PROYECTOS.length);
  document.getElementById("kpi-count-delta").textContent = "+4 ingresos este trimestre";
  document.getElementById("kpi-count-delta").className = "delta up";
  document.getElementById("kpi-dias").textContent = `${fmtNum(diasPromedio)} días`;

  const last = SERIE_TRAMITACION.at(-1).dias;
  const previous = SERIE_TRAMITACION.at(-2).dias;
  const change = Math.round(((last - previous) / previous) * 100);
  const trend = document.getElementById("kpi-dias-delta");
  trend.textContent = `${change > 0 ? "+" : ""}${change}% frente al trimestre anterior`;
  trend.className = `delta ${change < 0 ? "down" : change > 0 ? "up" : ""}`;

  document.getElementById("kpi-sobre").textContent = `${porcentajeRiesgo}%`;
  document.getElementById("kpi-sobre-delta").textContent = `${sobreBenchmark.length} de ${activos.length} proyectos activos`;
  document.getElementById("kpi-sobre-delta").className = "delta warn";
}

function renderFeed() {
  const recientes = [...PROYECTOS]
    .sort((a, b) => new Date(b.fecha_ingreso) - new Date(a.fecha_ingreso))
    .slice(0, 6);
  document.getElementById("feed-nuevos").innerHTML = recientes.map((p, index) => `
    <div class="feed-item row-clickable" data-nombre="${p.nombre}" role="button" tabindex="0" aria-label="Abrir expediente de ${p.nombre}">
      <span class="feed-rank">${String(index + 1).padStart(2, "0")}</span>
      <div><div class="name">${p.nombre}</div><div class="meta">${p.titular} · ${p.region} · ${fmtDate(p.fecha_ingreso)}</div></div>
      <div class="amount">${fmtUSD(p.inversion)}</div>
    </div>`).join("");
}

// ---------- CHARTS ----------
function renderCharts() {
  if (typeof Chart === "undefined") {
    document.querySelectorAll(".chart-wrap").forEach(showChartFallback);
    return;
  }
  try {
    renderTrendChart();
    renderSectorChart();
    renderRegionChart();
  } catch (error) {
    console.warn("No fue posible renderizar uno o más gráficos.", error);
    document.querySelectorAll(".chart-wrap").forEach((wrapper) => {
      if (!wrapper.querySelector("canvas") || wrapper.querySelector("canvas").offsetWidth === 0) return;
      showChartFallback(wrapper);
    });
  }
}

function showChartFallback(wrapper) {
  wrapper.innerHTML = '<div class="chart-fallback">El gráfico no está disponible en este momento.<br>El resto de los datos continúa operativo.</div>';
}

function chartTheme() {
  const css = getComputedStyle(document.documentElement);
  return {
    brand: css.getPropertyValue("--brand").trim(),
    warn: css.getPropertyValue("--warn").trim(),
    line: css.getPropertyValue("--line").trim(),
    muted: css.getPropertyValue("--muted").trim(),
  };
}

function renderTrendChart() {
  const theme = chartTheme();
  new Chart(document.getElementById("chart-trend"), {
    type: "line",
    data: {
      labels: SERIE_TRAMITACION.map((d) => d.q),
      datasets: [{
        data: SERIE_TRAMITACION.map((d) => d.dias),
        borderColor: theme.brand,
        pointRadius: SERIE_TRAMITACION.map((d) => d.ley ? 5 : 2.5),
        pointBackgroundColor: SERIE_TRAMITACION.map((d) => d.ley ? theme.warn : theme.brand),
        tension: .3, fill: false, borderWidth: 2,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      layout: { padding: { left: 8, right: 4 } },
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y} días` } } },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { color: theme.muted, font: { family: "Public Sans", size: 10 } } },
        y: { grid: { color: theme.line }, border: { display: false }, ticks: { color: theme.muted, font: { family: "IBM Plex Mono", size: 9 }, callback: (value) => `${value} d` } },
      },
    },
  });
}

function renderSectorChart() {
  const counts = Object.fromEntries(SECTORES.map((sector) => [sector, 0]));
  PROYECTOS.forEach((p) => counts[p.sector]++);
  const theme = chartTheme();
  new Chart(document.getElementById("chart-sector"), {
    type: "bar",
    data: { labels: Object.keys(counts), datasets: [{ data: Object.values(counts), backgroundColor: theme.brand, borderRadius: 3, maxBarThickness: 20 }] },
    options: {
      indexAxis: "y", responsive: true, maintainAspectRatio: false,
      layout: { padding: { left: 4, right: 4 } },
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.x} proyectos` } } },
      scales: {
        x: { grid: { color: theme.line }, border: { display: false }, ticks: { precision: 0, color: theme.muted, font: { family: "IBM Plex Mono", size: 9 } } },
        y: { grid: { display: false }, border: { display: false }, ticks: { color: theme.muted, font: { family: "Public Sans", size: 10 } } },
      },
    },
  });
}

function renderRegionChart() {
  const inversionPorRegion = Object.fromEntries(REGIONES.map((region) => [region, 0]));
  PROYECTOS.filter((p) => p.estado === "En calificación").forEach((p) => inversionPorRegion[p.region] += p.inversion);
  const rows = Object.entries(inversionPorRegion).filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1]);
  const theme = chartTheme();
  new Chart(document.getElementById("chart-region"), {
    type: "bar",
    data: { labels: rows.map(([region]) => region), datasets: [{ data: rows.map(([, value]) => value), backgroundColor: theme.brand, borderRadius: 3, maxBarThickness: 20 }] },
    options: {
      indexAxis: "y", responsive: true, maintainAspectRatio: false,
      layout: { padding: { left: 4, right: 4 } },
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => fmtUSD(ctx.parsed.x) } } },
      scales: {
        x: { grid: { color: theme.line }, border: { display: false }, ticks: { color: theme.muted, font: { family: "IBM Plex Mono", size: 9 }, callback: (value) => `US$ ${fmtNum(value)}` } },
        y: { grid: { display: false }, border: { display: false }, ticks: { color: theme.muted, font: { family: "Public Sans", size: 10 } } },
      },
    },
  });
}

// ---------- PROJECTS ----------
function populateFilters() {
  fillSelect("f-region", REGIONES);
  fillSelect("f-sector", SECTORES);
  fillSelect("f-estado", ESTADOS);
  fillSelect("f-tipo", ["DIA", "EIA"]);
}

function fillSelect(id, values) {
  const select = document.getElementById(id);
  values.forEach((value) => select.add(new Option(value, value)));
}

function estadoPill(estado) {
  const variants = { "En calificación": "warn", "Aprobado": "good", "Rechazado": "bad", "Desistido": "neutral", "No admitido": "neutral" };
  return `<span class="pill ${variants[estado] || "neutral"}">${estado}</span>`;
}

function renderTable(rows) {
  const tbody = document.getElementById("tbody-proyectos");
  const count = document.getElementById("results-count");
  count.textContent = `${fmtNum(rows.length)} ${rows.length === 1 ? "proyecto" : "proyectos"}`;

  if (!rows.length) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="8"><strong>No encontramos proyectos</strong>Prueba con otros filtros o limpia la búsqueda.</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map((p) => {
    const median = MEDIANA_SECTOR[p.sector];
    const delta = p.dias - median;
    const benchmarkClass = delta > 0 ? "above" : "below";
    const benchmarkLabel = `${delta > 0 ? "+" : ""}${delta} días vs. mediana`;
    return `<tr class="row-clickable" data-nombre="${p.nombre}" tabindex="0" aria-label="Abrir expediente de ${p.nombre}">
      <td class="name" data-label="Proyecto">${p.nombre}<div class="muted">${p.titular}</div></td>
      <td data-label="Región">${p.region}</td><td data-label="Sector">${p.sector}</td><td data-label="Tipo"><span class="tipo-tag">${p.tipo}</span></td>
      <td data-label="Ingreso">${fmtDate(p.fecha_ingreso)}</td><td data-label="Estado">${estadoPill(p.estado)}</td>
      <td class="num" data-label="Plazo">${p.dias} días<div class="bench ${benchmarkClass}">${benchmarkLabel}</div></td>
      <td class="num" data-label="Inversión">${fmtUSD(p.inversion)}</td>
    </tr>`;
  }).join("");
}

function currentFilters() {
  return {
    region: document.getElementById("f-region").value,
    sector: document.getElementById("f-sector").value,
    estado: document.getElementById("f-estado").value,
    tipo: document.getElementById("f-tipo").value,
    query: document.getElementById("search-proyectos").value.trim().toLowerCase(),
  };
}

function applyFilters() {
  const filters = currentFilters();
  const rows = PROYECTOS.filter((p) =>
    (!filters.region || p.region === filters.region) &&
    (!filters.sector || p.sector === filters.sector) &&
    (!filters.estado || p.estado === filters.estado) &&
    (!filters.tipo || p.tipo === filters.tipo) &&
    (!filters.query || p.nombre.toLowerCase().includes(filters.query) || p.titular.toLowerCase().includes(filters.query))
  );
  renderTable(rows);
}

function resetFilters() {
  ["f-region", "f-sector", "f-estado", "f-tipo", "search-proyectos"].forEach((id) => document.getElementById(id).value = "");
  renderTable(PROYECTOS);
  document.getElementById("search-proyectos").focus();
}

function wireFilters() {
  ["f-region", "f-sector", "f-estado", "f-tipo", "search-proyectos"].forEach((id) => document.getElementById(id).addEventListener("input", applyFilters));
  document.getElementById("reset-filters").addEventListener("click", resetFilters);
  document.getElementById("search-resumen").addEventListener("input", (event) => {
    if (event.target.value.trim().length < 2) return;
    document.getElementById("search-proyectos").value = event.target.value;
    navigateTo("proyectos");
    applyFilters();
    document.getElementById("search-proyectos").focus();
  });
}

// ---------- ANALYSIS ----------
function renderInsights() {
  const maxMedian = Math.max(...Object.values(MEDIANA_SECTOR));
  document.getElementById("table-sector").innerHTML = `
    <thead><tr><th>Sector</th><th>Mediana histórica</th></tr></thead>
    <tbody>${Object.entries(MEDIANA_SECTOR).sort((a, b) => b[1] - a[1]).map(([sector, days]) => `
      <tr><td>${sector}</td><td class="bar-cell"><span class="mono" style="width:3.3rem">${days} días</span><span class="bar-track"><span class="bar-fill" style="width:${days / maxMedian * 100}%"></span></span></td></tr>`).join("")}</tbody>`;

  const excess = PROYECTOS
    .filter((p) => p.estado === "En calificación")
    .map((p) => ({ ...p, exceso: p.dias - MEDIANA_SECTOR[p.sector] }))
    .filter((p) => p.exceso > 0)
    .sort((a, b) => b.exceso - a.exceso);

  const highest = excess[0];
  document.getElementById("risk-project-name").textContent = highest.nombre;
  document.getElementById("risk-project-copy").textContent = `${highest.titular} · ${highest.sector} · ${fmtUSD(highest.inversion)} declarados`;
  document.getElementById("risk-project-days").textContent = `+${highest.exceso}`;

  document.getElementById("tbody-exceso").innerHTML = excess.slice(0, 8).map((p) => `
    <tr class="row-clickable" data-nombre="${p.nombre}" tabindex="0" aria-label="Abrir expediente de ${p.nombre}">
      <td class="name" data-label="Proyecto">${p.nombre}<div class="muted">${p.titular}</div></td><td data-label="Sector">${p.sector}</td>
      <td class="num" data-label="Plazo actual">${p.dias} días</td><td class="num" data-label="Mediana sector">${MEDIANA_SECTOR[p.sector]} días</td>
      <td class="num" data-label="Exceso"><span class="pill bad">+${p.exceso} días</span></td><td class="num" data-label="Inversión">${fmtUSD(p.inversion)}</td>
    </tr>`).join("");
}

// ---------- PROJECT DRAWER ----------
const CHIPS_SUGERIDAS = [
  "¿Cuánto tiempo lleva en tramitación?",
  "¿Está sobre la mediana del sector?",
  "¿Cuál es la inversión declarada?",
  "¿En qué región y sector está?",
];

function wireProjectOpeners() {
  document.querySelectorAll("#tbody-proyectos, #feed-nuevos, #tbody-exceso, #document-alerts").forEach((container) => {
    container.addEventListener("click", openFromEvent);
    container.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const target = event.target.closest("[data-nombre]");
      if (!target) return;
      event.preventDefault();
      openFromTrigger(target);
    });
  });
}

function openFromEvent(event) {
  const trigger = event.target.closest("[data-nombre]");
  if (trigger) openFromTrigger(trigger);
}

function openFromTrigger(trigger) {
  const project = PROYECTO_POR_NOMBRE.get(trigger.dataset.nombre);
  if (!project) return;
  lastDrawerTrigger = trigger;
  openDrawer(project);
}

function wireDrawer() {
  document.getElementById("drawer-close").addEventListener("click", () => closeDrawer());
  document.getElementById("drawer-backdrop").addEventListener("click", () => closeDrawer());
  document.addEventListener("keydown", handleDrawerKeydown);
  document.getElementById("chat-input").addEventListener("input", (event) => {
    document.getElementById("chat-send").disabled = !event.target.value.trim();
  });
  document.getElementById("chat-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.getElementById("chat-input");
    const question = input.value.trim();
    if (!question || !proyectoActivo) return;
    input.value = "";
    document.getElementById("chat-send").disabled = true;
    askExpediente(question);
  });
}

function handleDrawerKeydown(event) {
  const drawer = document.getElementById("drawer");
  if (!drawer.classList.contains("open")) return;
  if (event.key === "Escape") {
    closeDrawer();
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = [...drawer.querySelectorAll('button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')];
  if (!focusable.length) return;
  const first = focusable[0], last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

function openDrawer(project) {
  proyectoActivo = project;
  const median = MEDIANA_SECTOR[project.sector];
  const delta = project.dias - median;
  document.getElementById("drawer-folio").textContent = `EXPEDIENTE · ${project.tipo}-${project.fecha_ingreso.slice(0, 4)}`;
  document.getElementById("drawer-nombre").textContent = project.nombre;
  document.getElementById("drawer-titular").textContent = project.titular;
  document.getElementById("drawer-estado").innerHTML = estadoPill(project.estado);
  document.getElementById("drawer-summary").innerHTML = `
    <div class="summary-metric"><div class="m-lbl">Inversión</div><div class="m-val">${fmtUSD(project.inversion)}</div></div>
    <div class="summary-metric"><div class="m-lbl">Plazo actual</div><div class="m-val">${project.dias} días</div></div>
    <div class="summary-metric ${delta > 0 ? "risk" : "good"}"><div class="m-lbl">Vs. benchmark</div><div class="m-val">${delta > 0 ? "+" : ""}${delta} días</div></div>`;
  document.getElementById("drawer-meta").innerHTML = `
    <div><div class="m-lbl">Región</div><div class="m-val">${project.region}</div></div>
    <div><div class="m-lbl">Sector</div><div class="m-val">${project.sector}</div></div>
    <div><div class="m-lbl">Ingreso</div><div class="m-val mono">${fmtDate(project.fecha_ingreso)}</div></div>`;
  renderDrawerDocSignal(project);
  renderTimeline(project);

  document.getElementById("chat-thread").innerHTML = "";
  document.getElementById("chat-input").value = "";
  document.getElementById("chat-send").disabled = true;
  addMsg("bot", `Consulta el plazo, la inversión o la comparación con el benchmark de <b>${project.sector}</b>.`);
  document.getElementById("chat-chips").innerHTML = CHIPS_SUGERIDAS.map((question) => `<button type="button" class="chip">${question}</button>`).join("");
  document.querySelectorAll("#chat-chips .chip").forEach((chip) => chip.addEventListener("click", () => askExpediente(chip.textContent)));

  document.getElementById("drawer").classList.add("open");
  document.getElementById("drawer").setAttribute("aria-hidden", "false");
  document.getElementById("drawer-backdrop").classList.add("open");
  document.body.style.overflow = "hidden";
  document.getElementById("drawer-close").focus();
}

function closeDrawer(restoreFocus = true) {
  const drawer = document.getElementById("drawer");
  if (!drawer.classList.contains("open")) return;
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  document.getElementById("drawer-backdrop").classList.remove("open");
  document.body.style.overflow = "";
  proyectoActivo = null;
  if (restoreFocus && lastDrawerTrigger?.isConnected) lastDrawerTrigger.focus();
}

function renderTimeline(project) {
  const resolved = project.estado !== "En calificación";
  const steps = [
    { label: "Ingreso", date: fmtDate(project.fecha_ingreso), state: "done" },
    { label: "Evaluación", date: `día ${project.dias}`, state: resolved ? "done" : "active" },
    { label: project.estado, date: resolved ? `día ${project.dias}` : `referencia ${MEDIANA_SECTOR[project.sector]} días`, state: resolved ? "done" : "" },
  ];
  document.getElementById("drawer-timeline").innerHTML = steps.map((step) => `<div class="mt-step ${step.state}"><div class="mt-lbl">${step.label}</div><div class="mt-date">${step.date}</div></div>`).join("");
}

function addMsg(role, html) {
  const thread = document.getElementById("chat-thread");
  const message = document.createElement("div");
  message.className = `msg ${role}`;
  message.innerHTML = html;
  thread.appendChild(message);
  thread.scrollTop = thread.scrollHeight;
}

function askExpediente(question) {
  if (!proyectoActivo) return;
  addMsg("user", escapeHtml(question));
  const thread = document.getElementById("chat-thread");
  const typing = document.createElement("div");
  typing.className = "typing";
  typing.setAttribute("aria-label", "Preparando respuesta");
  typing.innerHTML = "<span></span><span></span><span></span>";
  thread.appendChild(typing);
  thread.scrollTop = thread.scrollHeight;
  const project = proyectoActivo;
  setTimeout(() => {
    typing.remove();
    if (proyectoActivo === project) addMsg("bot", answerQuestion(project, question));
  }, 650);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

// ---------- DOCUMENTOS ----------
const CARPETAS_REVISADAS = 11; // carpetas del piloto en el Drive de trabajo.

function renderDrawerDocSignal(project) {
  const senal = SENALES_POR_NOMBRE.get(project.nombre);
  const target = document.getElementById("drawer-doc-signal");
  if (!senal) { target.innerHTML = ""; return; }
  const label = senal.tipo === "ire" ? "Riesgo de IRE" : "ICE disponible";
  const variant = senal.tipo === "ire" ? (senal.nivel === "alta" ? "bad" : "warn") : "good";
  target.innerHTML = `<div class="doc-signal ${variant}"><span class="pill ${variant}">${label}</span><p>${senal.hallazgo}</p></div>`;
}

function renderDocumentos() {
  const ireSenales = SENALES_DOCUMENTALES.filter((s) => s.tipo === "ire");
  const iceSenales = SENALES_DOCUMENTALES.filter((s) => s.tipo === "ice");

  document.getElementById("corpus-count").textContent = `${fmtNum(PROYECTOS.length)} expedientes indexados`;
  document.getElementById("docs-folders").textContent = fmtNum(CARPETAS_REVISADAS);
  document.getElementById("docs-ire").textContent = fmtNum(ireSenales.length);
  document.getElementById("docs-ice").textContent = fmtNum(iceSenales.length);

  const orden = { alta: 0, media: 1 };
  const alertas = [...SENALES_DOCUMENTALES].sort((a, b) => orden[a.nivel] - orden[b.nivel]);
  document.getElementById("document-alerts").innerHTML = alertas.map((s) => {
    const p = PROYECTO_POR_NOMBRE.get(s.nombre);
    const etiqueta = s.tipo === "ire" ? "Riesgo IRE" : "ICE disponible";
    return `<div class="alert-card row-clickable" data-nombre="${s.nombre}" tabindex="0" role="button" aria-label="Abrir expediente de ${s.nombre}">
      <span class="alert-dot ${s.nivel}"></span>
      <div class="alert-body"><div class="alert-head"><strong>${s.nombre}</strong><span class="tipo-tag">${etiqueta}</span></div>
      <p>${s.hallazgo}</p><div class="muted">${p ? `${p.titular} · ${p.sector}` : ""}</div></div>
    </div>`;
  }).join("");
}

function wirePortfolioAssistant() {
  document.getElementById("portfolio-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.getElementById("portfolio-input");
    const question = input.value.trim();
    if (!question) return;
    input.value = "";
    renderPortfolioAnswer(question);
  });
  document.querySelectorAll("#portfolio-chips [data-question]").forEach((chip) => {
    chip.addEventListener("click", () => renderPortfolioAnswer(chip.dataset.question));
  });
}

function renderPortfolioAnswer(question) {
  const query = question.toLowerCase();
  const ire = SENALES_DOCUMENTALES.filter((s) => s.tipo === "ire").sort((a, b) => (a.nivel === "alta" ? -1 : 1));
  const ice = SENALES_DOCUMENTALES.filter((s) => s.tipo === "ice");
  let html;

  if (/ire|riesgo|informaci[oó]n (relevante|esencial)/.test(query)) {
    html = ire.length
      ? `<p>${ire.length} expedientes muestran señales de riesgo de IRE (falta de información relevante o esencial):</p><ul>${ire.map((s) => `<li><span class="pill ${s.nivel === "alta" ? "bad" : "warn"}">${s.nivel}</span> <b>${s.nombre}</b> — ${s.hallazgo}</li>`).join("")}</ul>`
      : `<p>No hay señales de riesgo de IRE en la cartera revisada.</p>`;
  } else if (/ice/.test(query)) {
    html = ice.length
      ? `<p>${ice.length} expedientes ya cuentan con ICE (Informe Consolidado de Evaluación) emitido:</p><ul>${ice.map((s) => `<li><b>${s.nombre}</b> — ${s.hallazgo}</li>`).join("")}</ul>`
      : `<p>Ningún expediente de la cartera revisada tiene ICE emitido todavía.</p>`;
  } else if (/alerta|resum/.test(query)) {
    html = `<p>La cartera tiene <b>${ire.length} alertas de IRE</b> y <b>${ice.length} expedientes con ICE</b> disponible, sobre ${fmtNum(PROYECTOS.length)} proyectos y ${fmtNum(CARPETAS_REVISADAS)} carpetas revisadas.</p>`;
  } else {
    html = `<p>Puedo cruzar plazos, inversión, señales de IRE y disponibilidad de ICE. Prueba con “¿Qué proyectos tienen mayor riesgo de IRE?” o “¿Qué expedientes tienen ICE?”.</p>`;
  }

  document.getElementById("portfolio-answer").innerHTML = html;
}

function answerQuestion(project, question) {
  const query = question.toLowerCase();
  const median = MEDIANA_SECTOR[project.sector];
  const delta = project.dias - median;
  const comparison = delta > 0
    ? `<b>${delta} días por sobre</b> la mediana de ${project.sector} (${median} días)`
    : `<b>${Math.abs(delta)} días por debajo</b> de la mediana de ${project.sector} (${median} días)`;

  if (/(cuanto|cuánto).*(tiempo|dias|días|demora|lleva)|plazo/.test(query)) return `<b>${project.nombre}</b> lleva ${project.dias} días desde su ingreso, en estado “${project.estado}”. Está ${comparison}.`;
  if (/(compar|median|promedio|benchmark|normal|tipico|típico)/.test(query)) return `Frente al histórico del sector <b>${project.sector}</b>, el expediente está ${comparison}.`;
  if (/(inversion|inversión|monto|costo|cuesta|vale)/.test(query)) return `La inversión declarada es <b>${fmtUSD(project.inversion)}</b>. Ingresó como ${project.tipo} el ${fmtDate(project.fecha_ingreso)}.`;
  if (/(region|región|comuna|ubicaci|donde|dónde)/.test(query)) return `El proyecto se ubica en <b>${project.region}</b> y pertenece al sector <b>${project.sector}</b>.`;
  if (/(estado|situaci|aprobad|rechaz|desisti)/.test(query)) return `Estado actual: <b>${project.estado}</b>. Titular: ${project.titular}.`;
  return `<b>${project.nombre}</b> es un ${project.tipo} de ${project.sector} en ${project.region}. Lleva ${project.dias} días, representa ${fmtUSD(project.inversion)} y está ${comparison}.`;
}
