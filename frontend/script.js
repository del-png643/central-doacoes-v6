const icons = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.7-7.5 1.1-1.1a5.5 5.5 0 0 0 0-7.8Z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  box: '<path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="m3 8 9 5 9-5M3 8v9l9 5 9-5V8M12 13v9"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.8M16 3.2a4 4 0 0 1 0 7.6"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  arrow: '<path d="m9 18 6-6-6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  download: '<path d="M12 3v12m0 0 5-5m-5 5-5-5"/><path d="M5 21h14"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
};

function icon(name, size = 20) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
}

// ===== Integração com a API FastAPI =====
// O front é servido pelo próprio FastAPI, então as chamadas usam a mesma origem.
const API = "";

const adminNav = [
  ["Visão geral", "grid"],
  ["Itens necessários", "heart"],
  ["Agendamentos", "calendar"],
  ["Estoque", "box"],
  ["Movimentações", "clock"],
  ["Relatórios", "chart"],
];

const donorNav = [
  ["Necessidades", "heart"],
  ["Agendar entrega", "calendar"],
  ["Minhas contribuições", "box"],
];

const STATUS = {
  agendado: ["Agendado", "blue"],
  recebido: ["Recebido", "green"],
  parcial: ["Parcial", "orange"],
  cancelado: ["Cancelado", "red"],
};
const AVATAR_COLORS = ["blue", "orange", "green", "purple"];

// Dados que cada página precisa carregar da API (além do básico de cada perfil)
const BASE_DATA = { doador: ["agendamentos"], admin: ["agendamentos", "estoque"] };
const PAGE_DATA = {
  doador: { Necessidades: ["itens"], "Agendar entrega": ["horarios"], "Minhas contribuições": [] },
  admin: {
    "Visão geral": ["lotes", "movs"],
    "Itens necessários": ["itens"],
    Agendamentos: ["horarios", "itens"],
    Estoque: ["lotes"],
    Movimentações: ["movs", "itens"],
    Relatórios: [],
  },
};

const state = {
  authenticated: false,
  loading: false,
  ready: false,
  role: "doador",
  authView: "login",
  page: "Necessidades",
  mobile: false,
  notificationOpen: false,
  dismissed: [],
  showPassword: false,
  notice: "",
  noticeError: true,
  error: "",
  user: null,
  form: {},
  calMonth: null,
  slotDay: null,
  slotId: null,
  busy: false,
  data: { itens: [], horarios: [], agendamentos: [], estoque: [], lotes: [], movs: [] },
};

// ===== Utilitários =====
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const num = (n) => Number(n).toLocaleString("pt-BR");
const initials = (nome) => {
  const p = String(nome || "?").trim().split(/\s+/);
  return ((p[0]?.[0] || "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
};
const firstName = (nome) => String(nome || "").trim().split(/\s+/)[0];
const dayKey = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const hhmm = (iso) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const longDate = (iso) => cap(new Date(iso).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }));
const monthShort = (d) => new Date(d).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
const dateOnly = (s) => (s ? s.split("-").reverse().join("/") : "");
const groupBy = (list, fn) => list.reduce((acc, x) => ((acc[fn(x)] ||= []).push(x), acc), {});
const statusPill = (st) => {
  const [label, tone] = STATUS[st] || [st, "blue"];
  return `<span class="status ${tone}">${label}</span>`;
};

const getToken = () => sessionStorage.getItem("token") || localStorage.getItem("token");
const clearToken = () => {
  sessionStorage.removeItem("token");
  localStorage.removeItem("token");
};
const setToken = (token, remember) => {
  clearToken();
  (remember ? localStorage : sessionStorage).setItem("token", token);
};

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function errorText(data) {
  const d = data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) {
    const msgs = d.map((e) => String(e.msg || "").replace(/^Value error, /, "")).filter(Boolean);
    if (msgs.length) return msgs.join(" ");
  }
  return "Não foi possível concluir a operação.";
}

async function api(path, { method = "GET", body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(API + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError(0, "Erro ao conectar com o servidor.");
  }
  let data = null;
  try {
    data = await res.json();
  } catch {}
  if (res.status === 401 && auth) {
    endSession("Sua sessão expirou. Entre novamente.");
    throw new ApiError(401, "Sessão expirada.");
  }
  if (!res.ok) throw new ApiError(res.status, errorText(data));
  return data;
}

function setNotice(msg, error = true) {
  state.notice = msg;
  state.noticeError = error;
}

function toast(msg) {
  document.querySelector(".toast")?.remove();
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ===== Modais (ficam fora do #app para não serem apagados pelo render) =====
function closeModal() {
  document.getElementById("modal-root")?.remove();
}

function openModal(title, bodyHtml, onSubmit, submitLabel = "Salvar") {
  closeModal();
  const root = document.createElement("div");
  root.id = "modal-root";
  root.className = `modal-scrim ${state.role}-theme`;
  root.innerHTML = `<div class="modal card" role="dialog" aria-modal="true"><h2>${title}</h2>
    <form>${bodyHtml}<p class="form-error"></p>
    <div class="modal-actions"><button type="button" class="outline" data-close>Cancelar</button><button class="primary" type="submit">${submitLabel}</button></div></form></div>`;
  document.body.appendChild(root);
  root.addEventListener("click", (e) => {
    if (e.target === root || e.target.closest("[data-close]")) closeModal();
  });
  const form = root.querySelector("form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector("[type=submit]");
    btn.disabled = true;
    try {
      await onSubmit(new FormData(form), form);
      closeModal();
    } catch (err) {
      root.querySelector(".form-error").textContent = err.message || "Erro ao salvar.";
      btn.disabled = false;
    }
  });
  return root;
}

// ===== Sessão =====
function endSession(msg = "") {
  clearToken();
  closeModal();
  state.authenticated = false;
  state.user = null;
  state.mobile = false;
  state.notificationOpen = false;
  state.authView = "login";
  state.data = { itens: [], horarios: [], agendamentos: [], estoque: [], lotes: [], movs: [] };
  setNotice(msg);
  render();
}

function startSession(user) {
  state.user = user;
  state.role = user.perfil === "administrador" ? "admin" : "doador";
  state.authenticated = true;
  state.page = state.role === "admin" ? "Visão geral" : "Necessidades";
  state.dismissed = [];
  state.form = {};
  setNotice("");
  navigate();
}

async function entrar(email, senha, remember) {
  const { access_token } = await api("/auth/login", { method: "POST", body: { email, senha }, auth: false });
  setToken(access_token, remember);
  const user = await api("/auth/me");
  const role = user.perfil === "administrador" ? "admin" : "doador";
  if (role !== state.role) {
    clearToken();
    throw new ApiError(
      403,
      role === "admin" ? "Esta conta é de administrador. Escolha “Sou administrador”." : "Esta conta não tem acesso de administrador."
    );
  }
  startSession(user);
}

// ===== Carregamento de dados =====
let refreshId = 0;

function navigate() {
  state.ready = false;
  state.error = "";
  render();
  refresh();
}

async function refresh() {
  const id = ++refreshId;
  const admin = state.role === "admin";
  const names = [...new Set([...BASE_DATA[state.role], ...(PAGE_DATA[state.role][state.page] || [])])];
  const paths = {
    itens: `/itens${admin ? "?todos=true" : ""}`,
    horarios: `/horarios${admin ? "?todos=true" : ""}`,
    agendamentos: "/agendamentos",
    estoque: "/estoque",
    lotes: "/estoque/lotes",
    movs: "/estoque/movimentacoes?limite=500",
  };
  try {
    const results = await Promise.all(names.map((n) => api(paths[n])));
    if (id !== refreshId || !state.authenticated) return;
    names.forEach((n, i) => (state.data[n] = results[i]));
    if (!admin && state.page === "Agendar entrega") {
      const hs = state.data.horarios;
      const first = hs[0] ? new Date(hs[0].inicio) : null;
      state.calMonth = first ? { y: first.getFullYear(), m: first.getMonth() } : null;
      state.slotDay = hs[0] ? dayKey(hs[0].inicio) : null;
      state.slotId = null;
    }
    state.error = "";
  } catch (e) {
    if (id !== refreshId || e.status === 401) return;
    state.error = e.message;
  }
  state.ready = true;
  render();
}

// ===== Telas =====
function logo() {
  return `<div class="logo"><div class="logo-mark">${icon("heart", 21)}</div><div><b>Elo Solidário</b><span>Central de Doações</span></div></div>`;
}

function loginBox(admin) {
  const f = state.form;
  return `
    <div class="login-heading"><h2>Bem-vindo de volta</h2><p>Escolha como deseja acessar a plataforma.</p></div>
    <div class="role-selector">
      <button class="${!admin ? "selected" : ""}" data-role="doador"><span>${icon("heart")}</span><span><b>Sou doador</b><small>Doações e agendamentos</small></span></button>
      <button class="${admin ? "selected" : ""}" data-role="admin"><span>${icon("grid")}</span><span><b>Sou administrador</b><small>Gestão da instituição</small></span></button>
    </div>
    <div class="login-context">${icon(admin ? "settings" : "heart", 17)}<span>Acessando como <b>${admin ? "administrador" : "doador"}</b></span></div>
    <form id="login-form">
      <label for="email">E-mail</label>
      <div class="input-field">${icon("users", 18)}<input id="email" name="email" data-bind="email" required type="email" autocomplete="email" value="${esc(f.email)}" placeholder="${admin ? "nome@instituicao.org" : "seuemail@exemplo.com"}" /></div>
      <div class="password-label"><label for="senha">Senha</label><button type="button" data-action="forgot">Esqueci minha senha</button></div>
      <div class="input-field">${icon("settings", 18)}<input id="senha" name="senha" data-bind="senha" required autocomplete="current-password" value="${esc(f.senha)}" type="${state.showPassword ? "text" : "password"}" placeholder="Digite sua senha" /><button type="button" data-action="password">${state.showPassword ? "Ocultar" : "Mostrar"}</button></div>
      <label class="remember"><input type="checkbox" name="remember" data-bind-check="remember" ${f.remember ? "checked" : ""} /> Manter-me conectado</label>
      ${state.notice ? `<p class="auth-notice ${state.noticeError ? "error" : ""}">${esc(state.notice)}</p>` : ""}
      <button class="login-submit" type="submit" ${state.loading ? "disabled" : ""}>
        ${state.loading ? "Conectando..." : `Entrar como ${admin ? "administrador" : "doador"} ${icon("arrow", 17)}`}
      </button>
    </form>
    <div class="divider"><span>ou continue com</span></div>
    <div class="social-login"><button data-action="social"><b>G</b> Google</button><button data-action="social"><b>m</b> Microsoft</button></div>
    <p class="signup">${admin ? 'Acesso restrito à equipe. <button data-action="access">Solicitar acesso</button>' : 'Ainda não tem uma conta? <button data-action="signup">Cadastre-se gratuitamente</button>'}</p>
    <p class="security-note">Ambiente seguro. Dados tratados conforme a LGPD.</p>`;
}

function signupBox() {
  const f = state.form;
  const field = (label, name, type, ico, extra = "") =>
    `<label for="${name}">${label}</label><div class="input-field">${icon(ico, 18)}<input id="${name}" name="${name}" data-bind="${name}" type="${type}" value="${esc(f[name])}" ${extra} /></div>`;
  return `
    <div class="login-heading"><h2>Crie sua conta</h2><p>Cadastre-se como doador para agendar suas entregas.</p></div>
    <form id="signup-form">
      ${field("Nome completo", "nome", "text", "users", 'required minlength="2" maxlength="120" autocomplete="name"')}
      ${field("E-mail", "email", "email", "users", 'required autocomplete="email"')}
      ${field("Telefone (opcional)", "telefone", "tel", "users", 'maxlength="25" autocomplete="tel"')}
      ${field("Senha (mínimo 8 caracteres)", "senha", "password", "settings", 'required minlength="8" maxlength="128" autocomplete="new-password"')}
      ${state.notice ? `<p class="auth-notice ${state.noticeError ? "error" : ""}">${esc(state.notice)}</p>` : ""}
      <button class="login-submit" type="submit" ${state.loading ? "disabled" : ""}>${state.loading ? "Criando conta..." : `Criar conta ${icon("arrow", 17)}`}</button>
    </form>
    <p class="signup">Já tem uma conta? <button data-action="to-login">Entrar</button></p>`;
}

function login() {
  const admin = state.role === "admin";
  const signup = state.authView === "signup";
  return `
    <div class="login-page login-${state.role}">
      <section class="login-brand">
        ${logo()}
        <div class="brand-message">
          <span class="brand-symbol">${icon(admin ? "chart" : "heart", 32)}</span>
          <p>${admin ? "GESTÃO QUE TRANSFORMA" : "SOLIDARIEDADE QUE APROXIMA"}</p>
          <h1>${admin ? "Organize recursos. Multiplique impactos." : "Toda doação pode transformar uma história."}</h1>
          <span>${admin ? "Uma visão clara para cuidar das doações, do estoque e de cada atendimento." : "Consulte necessidades e agende sua entrega de forma simples e segura."}</span>
        </div>
        <small>© 2026 Elo Solidário</small>
      </section>
      <main class="login-main"><div class="login-box">${signup ? signupBox() : loginBox(admin)}</div></main>
    </div>`;
}

function buildNotifications() {
  const out = [];
  const now = Date.now();
  const ags = state.data.agendamentos
    .filter((a) => a.status === "agendado" && a.horario && new Date(a.horario.fim).getTime() > now)
    .sort((a, b) => new Date(a.horario.inicio) - new Date(b.horario.inicio));
  if (state.role === "admin") {
    ags.slice(0, 3).forEach((a) =>
      out.push({ key: `ag-${a.id}`, title: "Entrega agendada", text: `${a.doador?.nome || "Doador"} • ${longDate(a.horario.inicio)}, ${hhmm(a.horario.inicio)}.`, icon: "calendar", page: "Agendamentos" })
    );
    state.data.estoque
      .filter((e) => e.quantidade_total === 0)
      .slice(0, 3)
      .forEach((e) => out.push({ key: `est-${e.item_id}`, title: "Item sem estoque", text: `${e.nome} está sem saldo disponível.`, icon: "box", page: "Estoque" }));
  } else {
    ags.slice(0, 2).forEach((a) =>
      out.push({ key: `ag-${a.id}`, title: "Agendamento confirmado", text: `Sua entrega está marcada para ${longDate(a.horario.inicio)}, às ${hhmm(a.horario.inicio)}.`, icon: "calendar", page: "Minhas contribuições" })
    );
    state.data.agendamentos
      .filter((a) => a.status === "recebido" || a.status === "parcial")
      .slice(0, 1)
      .forEach((a) => out.push({ key: `rec-${a.id}`, title: "Obrigado pela sua doação", text: "Sua última entrega foi recebida pela instituição.", icon: "box", page: "Minhas contribuições" }));
  }
  return out.filter((n) => !state.dismissed.includes(n.key));
}

function notifications() {
  const visible = buildNotifications();
  return `
    <div class="notification-wrap">
      <button class="icon-btn ${state.notificationOpen ? "active" : ""}" data-action="notifications" aria-label="Notificações">
        ${icon("bell", 19)}${visible.length ? "<i></i>" : ""}
      </button>
      ${state.notificationOpen ? `
        <div class="notification-panel">
          <div class="notification-head">
            <div><h3>Notificações</h3><span>${visible.length ? `${visible.length} novas` : "Tudo em dia"}</span></div>
            ${visible.length ? '<button data-action="read-all">Marcar todas como lidas</button>' : ""}
          </div>
          <div class="notification-list">
            ${visible.map((n) => `
              <button class="notification-item unread" data-notification="${esc(n.key)}" data-page="${esc(n.page)}">
                <span class="notification-icon">${icon(n.icon, 18)}</span>
                <span class="notification-copy"><b>${n.title}</b><span>${esc(n.text)}</span></span><em></em>
              </button>`).join("")}
            ${visible.length ? "" : `<div class="notification-empty"><span>${icon("bell", 22)}</span><b>Nenhuma nova notificação</b><p>Você está em dia com todas as atividades.</p></div>`}
          </div>
          <button class="notification-footer" data-action="all-activities">Ver todas as atividades ${icon("arrow", 15)}</button>
        </div>` : ""}
    </div>`;
}

const totalEstoque = () => state.data.estoque.reduce((s, e) => s + e.quantidade_total, 0);
const entregasRecebidas = () => state.data.agendamentos.filter((a) => a.status === "recebido" || a.status === "parcial").length;

function appShell() {
  const admin = state.role === "admin";
  const nav = admin ? adminNav : donorNav;
  const nome = state.user?.nome || "";
  const impact = admin
    ? `<span>Estoque atual</span><b>${num(totalEstoque())}</b><small>itens em estoque</small>`
    : `<span>Seu impacto</span><b>${num(entregasRecebidas())}</b><small>entregas recebidas</small>`;
  const body = !state.ready
    ? '<div class="card empty-state"><p>Carregando...</p></div>'
    : (state.error ? `<p class="auth-notice error">${esc(state.error)}</p>` : "") + (admin ? adminPage() : donorPage());
  return `
    <div class="app ${state.role}-theme">
      <aside class="sidebar ${state.mobile ? "open" : ""}">
        ${logo()}
        <nav>
          <p class="eyebrow">${admin ? "GESTÃO" : "PORTAL DO DOADOR"}</p>
          ${nav.map(([label, name]) => `<button class="nav-item ${state.page === label ? "active" : ""}" data-page="${label}">${icon(name)}<span>${label}</span></button>`).join("")}
          ${admin ? `<p class="eyebrow second">ADMINISTRAÇÃO</p><button class="nav-item">${icon("users")}<span>Equipe e acessos</span></button><button class="nav-item">${icon("settings")}<span>Configurações</span></button>` : ""}
        </nav>
        <div class="sidebar-bottom">
          <div class="impact">${impact}</div>
          <button class="user" data-action="logout"><span class="avatar">${esc(initials(nome))}</span><span><b>${esc(nome)}</b><small>${admin ? "Administrador" : "Doador"} • Sair</small></span>${icon("arrow", 16)}</button>
        </div>
      </aside>
      <main>
        <header>
          <button class="menu-btn" data-action="menu">${icon("menu")}</button>
          <div class="search">${icon("search", 18)}<input placeholder="Buscar no sistema..." /><kbd>⌘ K</kbd></div>
          <div class="header-actions">
            <span class="area-badge">${admin ? "Área administrativa" : "Portal do doador"}</span>
            ${notifications()}
            <button class="profile-chip" data-action="logout"><span>${esc(initials(nome))}</span><b>${esc(firstName(nome))}</b></button>
          </div>
        </header>
        <div class="content">${body}</div>
      </main>
      ${state.mobile ? '<div class="scrim" data-action="menu"></div>' : ""}
    </div>`;
}

function pageTitle(title, text, action = "", eyebrow = "", attr = "") {
  return `<div class="page-title"><div>${eyebrow ? `<p class="green-label">${eyebrow}</p>` : ""}<h1>${title}</h1><p>${text}</p></div>${action ? `<button class="primary" ${attr}>${icon("plus", 18)}${action}</button>` : ""}</div>`;
}

function metric(name, color, label, value, note) {
  return `<div class="metric card"><div class="metric-icon ${color}">${icon(name)}</div><span>${label}</span><b>${value}</b><small class="${color === "purple" ? "warning" : ""}">${note}</small></div>`;
}

function emptyCard(title, text) {
  return `<div class="card empty-state"><div class="metric-icon blue">${icon("chart")}</div><h2>${title}</h2><p>${text}</p></div>`;
}

// ----- Administrador -----
function stockTable(compact = false) {
  const rows = [...state.data.estoque].sort((a, b) => a.quantidade_total - b.quantidade_total).slice(0, compact ? 3 : undefined);
  if (!rows.length) return '<p class="empty-note">Nenhum item cadastrado.</p>';
  return `<div class="table-wrap"><table id="tabela-estoque"><thead><tr><th>ITEM</th><th>UNIDADE</th><th>DISPONÍVEL</th><th>STATUS</th>${compact ? "" : "<th>AÇÕES</th>"}</tr></thead><tbody>
    ${rows.map((r) => `
      <tr>
        <td><b>${esc(r.nome)}</b></td>
        <td>${esc(r.unidade)}</td>
        <td>${num(r.quantidade_total)}</td>
        <td><span class="status ${r.quantidade_total === 0 ? "red" : "green"}">${r.quantidade_total === 0 ? "Sem estoque" : "Disponível"}</span></td>
        ${compact ? "" : `<td><button class="text-btn" data-action="movimentar" data-item="${r.item_id}">Registrar saída</button></td>`}
      </tr>`).join("")}
  </tbody></table></div>`;
}

function adminPage() {
  if (state.page === "Visão geral") return dashboard();
  if (state.page === "Agendamentos") return appointmentsPage();
  if (state.page === "Estoque") return inventory();
  if (state.page === "Itens necessários") return needsAdmin();
  if (state.page === "Movimentações") return movementsPage();
  return emptyCard("Relatórios em breve", "Esta área ainda não está disponível.");
}

function dashboard() {
  const d = state.data;
  const now = new Date();
  const hoje = dayKey(now.toISOString());
  const futuros = d.agendamentos
    .filter((a) => a.status === "agendado" && a.horario && new Date(a.horario.fim) > now)
    .sort((a, b) => new Date(a.horario.inicio) - new Date(b.horario.inicio));
  const pendHoje = futuros.filter((a) => dayKey(a.horario.inicio) === hoje).length;
  const limite = Date.now() + 30 * 864e5;
  const vencendo = d.lotes.filter((l) => l.validade && new Date(`${l.validade}T23:59:59`).getTime() <= limite).length;
  const comSaldo = d.estoque.filter((e) => e.quantidade_total > 0).length;

  const meses = Array.from({ length: 7 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - (6 - i), 1));
  const totais = meses.map((m) =>
    d.movs
      .filter((x) => x.tipo === "entrada" && new Date(x.registrada_em).getFullYear() === m.getFullYear() && new Date(x.registrada_em).getMonth() === m.getMonth())
      .reduce((s, x) => s + x.quantidade, 0)
  );
  const max = Math.max(...totais, 1);
  const ticks = [1, 2 / 3, 1 / 3, 0].map((f) => num(Math.round(max * f)));

  return `
    ${pageTitle(`Olá, ${esc(firstName(state.user?.nome))}!`, "Aqui está o resumo da Central de Doações hoje.", "", now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }).toUpperCase())}
    <section class="metrics">
      ${metric("heart", "blue", "Itens cadastrados", num(d.estoque.length), "itens ativos")}
      ${metric("calendar", "orange", "Entregas agendadas", num(futuros.length), `${pendHoje} para hoje`)}
      ${metric("box", "green", "Itens em estoque", num(totalEstoque()), `${comSaldo} tipos com saldo`)}
      ${metric("clock", "purple", "Próximos da validade", num(vencendo), "vencem em até 30 dias")}
    </section>
    <section class="dashboard-grid">
      <div class="card chart-card">
        <div class="card-head"><div><h2>Entradas de estoque</h2><p>Itens recebidos nos últimos 7 meses</p></div></div>
        <div class="chart-wrap"><div class="y-axis">${ticks.map((t) => `<span>${t}</span>`).join("")}</div><div class="bars">${totais.map((v, i) => `<div class="bar-col"><div class="bar" style="height:${(v / max) * 100}%;min-height:2px"></div><span>${cap(monthShort(meses[i]))}</span></div>`).join("")}</div></div>
      </div>
      <div class="card agenda-card">
        <div class="card-head"><div><h2>Próximas entregas</h2><p>Agendamentos aguardando recebimento</p></div><button data-page="Agendamentos">Ver agenda</button></div>
        <div class="appointments">
          ${futuros.slice(0, 4).map((a, i) => `
            <div class="appointment"><b class="time">${hhmm(a.horario.inicio)}</b><span class="avatar ${AVATAR_COLORS[i % 4]}">${esc(initials(a.doador?.nome))}</span><span><b>${esc(a.doador?.nome)}</b><small>${esc(longDate(a.horario.inicio))}</small></span><span class="pill">Agendado</span></div>`).join("") || '<p class="empty-note">Nenhuma entrega agendada.</p>'}
        </div>
      </div>
    </section>
    <section class="bottom-grid">
      <div class="card"><div class="card-head"><div><h2>Atenção ao estoque</h2><p>Itens com menor saldo</p></div><button data-page="Estoque">Ver estoque</button></div>${stockTable(true)}</div>
      <div class="card quick"><h2>Ações rápidas</h2>
        <button data-page="Agendamentos"><span class="quick-icon blue">${icon("calendar")}</span><span><b>Confirmar recebimento</b><small>Registrar entrega agendada</small></span>${icon("arrow", 17)}</button>
        <button data-page="Estoque"><span class="quick-icon green">${icon("box")}</span><span><b>Registrar saída</b><small>Saída de estoque por lote</small></span>${icon("arrow", 17)}</button>
        <button data-page="Itens necessários"><span class="quick-icon orange">${icon("heart")}</span><span><b>Adicionar necessidade</b><small>Publicar item para doação</small></span>${icon("arrow", 17)}</button>
      </div>
    </section>`;
}

function scheduleRow(a, i) {
  const h = a.horario;
  const pendente = a.status === "agendado";
  return `
    <div class="schedule-row">
      <div class="schedule-time"><b>${hhmm(h.inicio)}</b><span>até ${hhmm(h.fim)}</span></div>
      <span class="avatar ${AVATAR_COLORS[i % 4]}">${esc(initials(a.doador?.nome))}</span>
      <div class="schedule-info"><b>${esc(a.doador?.nome)}</b><span>${esc(shortDay(h.inicio))}${a.observacao ? ` • ${esc(a.observacao)}` : ""}</span></div>
      ${pendente
        ? `<button class="outline" data-confirm="${a.id}">Confirmar recebimento</button><button class="text-btn danger" data-cancel="${a.id}">Cancelar</button>`
        : statusPill(a.status)}
    </div>`;
}
const shortDay = (iso) => `${longDate(iso)}`;

function appointmentsPage() {
  const ags = state.data.agendamentos.filter((a) => a.horario);
  const pend = ags.filter((a) => a.status === "agendado").sort((a, b) => new Date(a.horario.inicio) - new Date(b.horario.inicio));
  const hist = ags.filter((a) => a.status !== "agendado").sort((a, b) => new Date(b.horario.inicio) - new Date(a.horario.inicio)).slice(0, 20);
  const hs = [...state.data.horarios].sort((a, b) => new Date(b.inicio) - new Date(a.inicio)).slice(0, 10);
  return `
    ${pageTitle("Agendamentos", "Acompanhe as entregas previstas e confirme os recebimentos.", "Novo horário", "", 'data-action="novo-horario"')}
    <div class="card schedule-list">
      <div class="card-head"><div><h2>Próximas entregas</h2><p>${pend.length} aguardando confirmação</p></div></div>
      ${pend.map(scheduleRow).join("") || '<p class="empty-note">Nenhuma entrega aguardando.</p>'}
    </div>
    ${hist.length ? `<div class="card schedule-list" style="margin-top:16px"><div class="card-head"><div><h2>Histórico</h2><p>Últimos agendamentos finalizados ou cancelados</p></div></div>${hist.map(scheduleRow).join("")}</div>` : ""}
    <div class="card schedule-list" style="margin-top:16px">
      <div class="card-head"><div><h2>Horários cadastrados</h2><p>Janelas de entrega disponíveis aos doadores</p></div></div>
      ${hs.length ? `<div class="table-wrap"><table><thead><tr><th>DATA</th><th>HORÁRIO</th><th>LIMITE</th><th>SITUAÇÃO</th></tr></thead><tbody>${hs.map((h) => `<tr><td><b>${esc(longDate(h.inicio))}</b></td><td>${hhmm(h.inicio)} – ${hhmm(h.fim)}</td><td>${h.limite_agendamentos} entregas</td><td><span class="status ${!h.ativo ? "red" : new Date(h.fim) < new Date() ? "orange" : "green"}">${!h.ativo ? "Inativo" : new Date(h.fim) < new Date() ? "Encerrado" : "Aberto"}</span></td></tr>`).join("")}</tbody></table></div>` : '<p class="empty-note">Nenhum horário cadastrado.</p>'}
    </div>`;
}

function inventory() {
  return `${pageTitle("Controle de estoque", "Consulte saldos e registre saídas por lote.", "Registrar saída", "", 'data-action="nova-saida"')}
    <div class="filters card"><div class="search">${icon("search", 18)}<input placeholder="Buscar produto..." data-filter="#tabela-estoque" /></div><button class="outline" data-action="exportar">${icon("download", 17)} Exportar</button></div>
    <div class="card"><div class="card-head padded"><div><h2>Inventário atual</h2><p>${state.data.estoque.length} produtos ativos • ${state.data.lotes.length} lotes com saldo</p></div></div>${stockTable()}</div>`;
}

function needsAdmin() {
  const itens = state.data.itens;
  return `${pageTitle("Itens necessários", "Gerencie o que a instituição precisa receber da comunidade.", "Adicionar item", "", 'data-action="novo-item"')}
    <div class="needs-admin">${itens.map((i) => `
      <div class="card need-row"><div class="need-icon ${i.ativo ? "blue" : "red"}">${icon("heart")}</div>
        <div><h3>${esc(i.nome)}</h3><p>${esc(i.descricao || "Sem descrição")}</p></div>
        <div class="progress-info"><span>${esc(i.unidade)}${i.necessita_validade ? " • exige validade" : ""}${i.ativo ? "" : " • inativo"}</span></div>
        <button class="outline" data-edit-item="${i.id}">Editar</button></div>`).join("") || emptyCard("Nenhum item cadastrado", "Use “Adicionar item” para publicar a primeira necessidade.")}</div>`;
}

function movementsPage() {
  const nomes = Object.fromEntries(state.data.itens.map((i) => [i.id, i.nome]));
  const rows = state.data.movs;
  return `${pageTitle("Movimentações", "Histórico de entradas e saídas do estoque.", "Registrar saída", "", 'data-action="nova-saida"')}
    <div class="card" style="padding:20px">${rows.length ? `<div class="table-wrap"><table><thead><tr><th>DATA</th><th>TIPO</th><th>ITEM</th><th>QUANTIDADE</th><th>MOTIVO</th></tr></thead><tbody>${rows.map((m) => `<tr><td>${new Date(m.registrada_em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</td><td><span class="status ${m.tipo === "entrada" ? "green" : "orange"}">${m.tipo === "entrada" ? "Entrada" : "Saída"}</span></td><td><b>${esc(nomes[m.item_id] || `Item #${m.item_id}`)}</b></td><td>${num(m.quantidade)}</td><td>${esc(m.motivo)}</td></tr>`).join("")}</tbody></table></div>` : '<p class="empty-note">Nenhuma movimentação registrada.</p>'}</div>`;
}

// ----- Doador -----
function donorPage() {
  if (state.page === "Agendar entrega") return donorSchedule();
  if (state.page === "Minhas contribuições") return contributions();
  const itens = state.data.itens;
  return `
    <div class="donor-hero"><div><p class="green-label">FAÇA PARTE DESSA REDE</p><h1>Sua doação transforma histórias.</h1><p>Confira o que precisamos neste momento e ajude a levar cuidado a quem mais precisa.</p><button class="primary" data-page="Agendar entrega">Agendar uma entrega ${icon("arrow", 17)}</button></div><div class="hero-heart">${icon("heart", 52)}<span>${num(entregasRecebidas())}<small>suas entregas recebidas</small></span></div></div>
    ${pageTitle("Necessidades da instituição", "Itens que a instituição está precisando receber agora.")}
    <div class="donor-needs">${itens.map((i) => `<div class="card donor-need"><div class="need-icon blue">${icon("heart")}</div><span class="status green">${esc(i.unidade)}</span><h3>${esc(i.nome)}</h3><p>${esc(i.descricao || "Sem descrição")}</p><div class="need-progress"><span>${i.necessita_validade ? "Verifique a data de validade" : "Aceitamos em boas condições"}</span></div><button class="outline" data-page="Agendar entrega">Quero doar ${icon("arrow", 16)}</button></div>`).join("") || emptyCard("Nenhuma necessidade no momento", "Volte em breve para conferir novos itens.")}</div>`;
}

function donorSchedule() {
  const hs = state.data.horarios;
  const byDay = groupBy(hs, (h) => dayKey(h.inicio));
  if (!hs.length || !state.calMonth) {
    return pageTitle("Agendar entrega", "Escolha o melhor dia e horário para levar sua doação.") + emptyCard("Nenhum horário disponível", "A instituição ainda não abriu novos horários de entrega.");
  }
  const { y, m } = state.calMonth;
  const offset = new Date(y, m, 1).getDay();
  const total = new Date(y, m + 1, 0).getDate();
  const cells = [...Array(offset).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
  const key = (day) => `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const slots = byDay[state.slotDay] || [];
  const chosen = hs.find((h) => h.id === state.slotId);
  return `${pageTitle("Agendar entrega", "Escolha o melhor dia e horário para levar sua doação.")}
    <div class="booking-grid">
      <div class="card calendar-card"><div class="calendar-head"><button data-cal="-1">‹</button><b>${cap(new Date(y, m, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }))}</b><button data-cal="1">›</button></div>
        <div class="week">${["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"].map((d) => `<b>${d}</b>`).join("")}${cells.map((day) => {
          if (!day) return "<span></span>";
          const k = key(day);
          const has = !!byDay[k];
          return `<button class="${has ? "has-slots" : ""} ${state.slotDay === k ? "selected" : ""}" ${has ? `data-day="${k}"` : "disabled"}>${day}</button>`;
        }).join("")}</div></div>
      <div class="card slots"><h2>Horários disponíveis</h2><p>${slots[0] ? esc(longDate(slots[0].inicio)) : "Selecione um dia destacado no calendário"}</p>
        ${slots.map((h) => `<button class="${state.slotId === h.id ? "selected" : ""}" data-slot="${h.id}">${icon("clock", 18)}<span><b>${hhmm(h.inicio)} – ${hhmm(h.fim)}</b><small>Até ${h.limite_agendamentos} entregas neste horário</small></span></button>`).join("")}
        <textarea data-bind="obs" placeholder="Observação (opcional): o que você vai doar?" maxlength="300">${esc(state.form.obs)}</textarea>
        <button class="primary confirm" data-action="book-slot" ${chosen ? "" : "disabled"}>${chosen ? `Agendar para ${hhmm(chosen.inicio)}` : "Escolha um horário"}</button></div>
    </div>`;
}

function contributions() {
  const ags = state.data.agendamentos.filter((a) => a.horario).sort((a, b) => new Date(b.horario.inicio) - new Date(a.horario.inicio));
  const prox = ags.filter((a) => a.status === "agendado" && new Date(a.horario.fim) > new Date()).sort((a, b) => new Date(a.horario.inicio) - new Date(b.horario.inicio))[0];
  return `${pageTitle("Minhas contribuições", "Acompanhe seus agendamentos e o impacto das suas doações.")}
    <div class="metrics donor-metrics">${metric("calendar", "blue", "Agendamentos", num(ags.length), "no total")}${metric("box", "green", "Entregas recebidas", num(entregasRecebidas()), "Obrigado por fazer a diferença")}${metric("clock", "orange", "Próxima entrega", prox ? `${new Date(prox.horario.inicio).getDate()} ${monthShort(prox.horario.inicio)}` : "—", prox ? `às ${hhmm(prox.horario.inicio)}` : "Nenhuma agendada")}</div>
    <div class="card contributions"><div class="card-head"><div><h2>Histórico</h2><p>Seus agendamentos e entregas</p></div></div>${ags.map((a) => {
      const pend = a.status === "agendado";
      return `<div class="contribution has-action"><div class="date-box"><b>${new Date(a.horario.inicio).getDate()}</b><span>${monthShort(a.horario.inicio)}</span></div><div><b>${esc(a.observacao || "Entrega agendada")}</b><span>${esc(longDate(a.horario.inicio))} • ${hhmm(a.horario.inicio)}</span></div>${statusPill(a.status)}${pend ? `<button class="text-btn danger" data-cancel="${a.id}">Cancelar</button>` : "<span></span>"}</div>`;
    }).join("") || '<p class="empty-note">Você ainda não tem agendamentos. Que tal agendar sua primeira entrega?</p>'}</div>`;
}

function render() {
  document.getElementById("app").innerHTML = state.authenticated ? appShell() : login();
}

// ===== Ações =====
async function agendar() {
  if (!state.slotId || state.busy) return;
  state.busy = true;
  try {
    await api("/agendamentos", { method: "POST", body: { horario_id: state.slotId, observacao: (state.form.obs || "").trim() || null } });
    state.form.obs = "";
    state.page = "Minhas contribuições";
    toast("Entrega agendada com sucesso!");
    navigate();
  } catch (e) {
    toast(e.message);
    await refresh();
  } finally {
    state.busy = false;
  }
}

async function cancelar(id) {
  if (!confirm("Deseja cancelar este agendamento?")) return;
  try {
    await api(`/agendamentos/${id}/cancelar`, { method: "POST" });
    toast("Agendamento cancelado.");
  } catch (e) {
    toast(e.message);
  }
  refresh();
}

function abrirItem(id) {
  const it = id ? state.data.itens.find((i) => i.id === id) : null;
  openModal(
    it ? "Editar item" : "Novo item necessário",
    `<label>Nome</label><input name="nome" required maxlength="120" value="${esc(it?.nome)}" />
     <label>Descrição</label><textarea name="descricao" rows="2">${esc(it?.descricao)}</textarea>
     <label>Unidade de medida</label><input name="unidade" required maxlength="20" value="${esc(it?.unidade || "unidade")}" placeholder="kg, pacote, unidade..." />
     <label class="check"><input type="checkbox" name="necessita_validade" ${it?.necessita_validade ? "checked" : ""} /> Exige data de validade no recebimento</label>
     ${it ? `<label class="check"><input type="checkbox" name="ativo" ${it.ativo ? "checked" : ""} /> Item ativo (visível aos doadores)</label>` : ""}`,
    async (fd) => {
      const body = {
        nome: fd.get("nome").trim(),
        descricao: fd.get("descricao").trim() || null,
        unidade: fd.get("unidade").trim() || "unidade",
        necessita_validade: fd.has("necessita_validade"),
      };
      if (it) {
        body.ativo = fd.has("ativo");
        await api(`/itens/${id}`, { method: "PATCH", body });
      } else {
        await api("/itens", { method: "POST", body });
      }
      toast("Item salvo.");
      refresh();
    }
  );
}

function abrirHorario() {
  openModal(
    "Novo horário de entrega",
    `<label>Início</label><input type="datetime-local" name="inicio" required />
     <label>Fim</label><input type="datetime-local" name="fim" required />
     <label>Limite de agendamentos</label><input type="number" name="limite" min="1" value="5" required />`,
    async (fd) => {
      const ini = new Date(fd.get("inicio"));
      const fim = new Date(fd.get("fim"));
      if (!(fim > ini)) throw new Error("O fim deve ser posterior ao início.");
      await api("/horarios", { method: "POST", body: { inicio: ini.toISOString(), fim: fim.toISOString(), limite_agendamentos: Number(fd.get("limite")) } });
      toast("Horário cadastrado.");
      refresh();
    }
  );
}

function abrirRecebimento(id) {
  const ag = state.data.agendamentos.find((a) => a.id === id);
  const itens = state.data.itens.filter((i) => i.ativo);
  if (!ag) return;
  if (!itens.length) return toast("Cadastre ao menos um item ativo antes de registrar recebimentos.");
  const opts = itens.map((i) => `<option value="${i.id}" data-validade="${i.necessita_validade ? 1 : 0}">${esc(i.nome)} (${esc(i.unidade)})</option>`).join("");
  const row = `<div class="item-row"><select name="item_id">${opts}</select><input name="quantidade" type="number" min="1" placeholder="Qtd" required /><input name="validade" type="date" title="Validade" /><button type="button" class="text-btn danger" data-remove-row>✕</button></div>`;
  const root = openModal(
    "Registrar recebimento",
    `<p class="hint">${esc(ag.doador?.nome)} • ${esc(longDate(ag.horario.inicio))}, ${hhmm(ag.horario.inicio)}</p>
     <label>Itens recebidos (validade obrigatória para itens perecíveis)</label><div id="rows">${row}</div>
     <button type="button" class="text-btn" data-add-row>+ Adicionar item</button>
     <label>Situação</label><select name="status"><option value="recebida">Recebida por completo</option><option value="parcial">Recebida parcialmente</option></select>
     <label>Observação</label><textarea name="observacao" rows="2"></textarea>`,
    async (fd, form) => {
      const linhas = [...form.querySelectorAll(".item-row")].map((r) => {
        const sel = r.querySelector("select");
        return { item_id: Number(sel.value), quantidade: Number(r.querySelector("[name=quantidade]").value), validade: r.querySelector("[name=validade]").value || null, nome: sel.selectedOptions[0].textContent, exige: sel.selectedOptions[0].dataset.validade === "1" };
      });
      const faltando = linhas.find((l) => l.exige && !l.validade);
      if (faltando) throw new Error(`Informe a validade de ${faltando.nome}.`);
      await api("/doacoes", {
        method: "POST",
        body: { agendamento_id: id, status: fd.get("status"), observacao: fd.get("observacao").trim() || null, itens: linhas.map(({ item_id, quantidade, validade }) => ({ item_id, quantidade, validade })) },
      });
      toast("Recebimento registrado.");
      refresh();
    },
    "Registrar"
  );
  root.querySelector("[data-add-row]").onclick = () => root.querySelector("#rows").insertAdjacentHTML("beforeend", row);
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-remove-row]");
    if (b && root.querySelectorAll(".item-row").length > 1) b.closest(".item-row").remove();
  });
}

function abrirSaida(itemId) {
  const lotes = state.data.lotes.filter((l) => !itemId || l.item_id === itemId);
  if (!lotes.length) return toast("Não há lotes com saldo para movimentar.");
  openModal(
    "Registrar saída de estoque",
    `<label>Lote</label><select name="lote_id">${lotes.map((l) => `<option value="${l.id}">${esc(l.item_nome)} • lote #${l.id} • ${l.quantidade_atual} ${esc(l.unidade)}${l.validade ? ` • val. ${dateOnly(l.validade)}` : ""}</option>`).join("")}</select>
     <label>Quantidade</label><input type="number" name="quantidade" min="1" required />
     <label>Motivo</label><input name="motivo" required minlength="2" maxlength="255" placeholder="Ex.: distribuição de cestas" />`,
    async (fd) => {
      await api("/estoque/saidas", { method: "POST", body: { lote_id: Number(fd.get("lote_id")), quantidade: Number(fd.get("quantidade")), motivo: fd.get("motivo").trim() } });
      toast("Saída registrada.");
      refresh();
    },
    "Registrar saída"
  );
}

function exportarEstoque() {
  const safe = (c) => {
    const t = String(c);
    return `"${(/^[=+\-@]/.test(t) ? "'" + t : t).replace(/"/g, '""')}"`;
  };
  const linhas = [["Item", "Unidade", "Quantidade"], ...state.data.estoque.map((e) => [e.nome, e.unidade, e.quantidade_total])];
  const csv = "\ufeff" + linhas.map((l) => l.map(safe).join(";")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = "estoque.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ===== Eventos =====
document.addEventListener("submit", async (event) => {
  const id = event.target.id;
  if (id !== "login-form" && id !== "signup-form") return;
  event.preventDefault();
  const f = Object.fromEntries(new FormData(event.target));
  state.loading = true;
  setNotice("");
  render();
  try {
    if (id === "signup-form") {
      await api("/auth/cadastro", { method: "POST", auth: false, body: { nome: f.nome.trim(), email: f.email.trim(), senha: f.senha, telefone: (f.telefone || "").trim() || null } });
      state.role = "doador";
    }
    await entrar(f.email.trim(), f.senha, !!f.remember);
  } catch (e) {
    setNotice(e.message);
  } finally {
    state.loading = false;
    render();
  }
});

document.addEventListener("input", (event) => {
  const t = event.target;
  if (t.dataset.bind) state.form[t.dataset.bind] = t.value;
  else if (t.dataset.bindCheck) state.form[t.dataset.bindCheck] = t.checked;
  else if (t.dataset.filter) {
    const q = t.value.toLowerCase();
    document.querySelectorAll(`${t.dataset.filter} tbody tr`).forEach((tr) => (tr.hidden = !tr.textContent.toLowerCase().includes(q)));
  }
});

document.addEventListener("click", (event) => {
  const t = event.target.closest("button, [data-action]");
  if (!t || t.disabled) return;
  const d = t.dataset;

  if (d.role) {
    state.role = d.role;
    setNotice("");
  } else if (d.notification !== undefined) {
    state.dismissed.push(d.notification);
    state.page = d.page;
    state.notificationOpen = false;
    state.mobile = false;
    return navigate();
  } else if (d.page) {
    state.page = d.page;
    state.mobile = false;
    state.notificationOpen = false;
    return navigate();
  } else if (d.day) {
    state.slotDay = d.day;
    state.slotId = null;
  } else if (d.slot) {
    state.slotId = Number(d.slot);
  } else if (d.cal) {
    const nm = new Date(state.calMonth.y, state.calMonth.m + Number(d.cal), 1);
    state.calMonth = { y: nm.getFullYear(), m: nm.getMonth() };
  } else if (d.cancel) {
    return cancelar(Number(d.cancel));
  } else if (d.confirm) {
    return abrirRecebimento(Number(d.confirm));
  } else if (d.editItem) {
    return abrirItem(Number(d.editItem));
  } else {
    switch (d.action) {
      case "password":
        state.showPassword = !state.showPassword;
        break;
      case "forgot":
        setNotice("A recuperação de senha ainda não está disponível. Procure um administrador.");
        break;
      case "signup":
        state.authView = "signup";
        state.role = "doador";
        setNotice("");
        break;
      case "to-login":
        state.authView = "login";
        setNotice("");
        break;
      case "access":
        setNotice("Contas de administrador são liberadas pela equipe responsável.", false);
        break;
      case "social":
        setNotice("Login com Google ou Microsoft ainda não está disponível. Use e-mail e senha.");
        break;
      case "logout":
        return endSession();
      case "menu":
        state.mobile = !state.mobile;
        break;
      case "notifications":
        state.notificationOpen = !state.notificationOpen;
        break;
      case "read-all":
        state.dismissed.push(...buildNotifications().map((n) => n.key));
        break;
      case "all-activities":
        state.notificationOpen = false;
        state.page = state.role === "admin" ? "Agendamentos" : "Minhas contribuições";
        return navigate();
      case "book-slot":
        return agendar();
      case "novo-item":
        return abrirItem();
      case "novo-horario":
        return abrirHorario();
      case "nova-saida":
        return abrirSaida();
      case "movimentar":
        return abrirSaida(Number(d.item));
      case "exportar":
        return exportarEstoque();
      default:
        return;
    }
  }
  render();
});

// Restaura a sessão se já houver um token salvo
(async function init() {
  render();
  if (!getToken()) return;
  try {
    startSession(await api("/auth/me"));
  } catch {
    clearToken();
    render();
  }
})();
