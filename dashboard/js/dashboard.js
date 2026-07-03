const MENSAGEM_ERRO_DADOS = "Não foi possível carregar os dados do servidor. Aguarde a disponibilização do back-end.";

function escaparHtml(valor) {
  return String(valor).replace(/[&<>'"]/g, (caractere) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[caractere]);
}

function formatarData(data) {
  const [ano, mes, dia] = String(data).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : "—";
}

function normalizarStatus(status) {
  return String(status || "")
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function rotuloStatus(status) {
  const valor = String(status || "Não informado").trim();
  return valor.charAt(0).toLocaleUpperCase("pt-BR") + valor.slice(1);
}

function renderizarVisaoEstoque(insumos) {
  const corpo = document.querySelector("#corpo-visao-estoque");
  if (!insumos.length) {
    corpo.innerHTML = '<tr><td colspan="6" class="estado-dados">Nenhum insumo cadastrado.</td></tr>';
    return;
  }
  corpo.innerHTML = insumos.slice(0, 5).map((insumo) => {
    const status = normalizarStatus(insumo.status);
    const classeStatus = ["normal", "critico", "atencao", "observacao"].includes(status) ? status : "neutro";
    return `<tr><td>${escaparHtml(insumo.nome ?? "—")}</td><td>${escaparHtml(insumo.codigo ?? "—")}</td><td>${escaparHtml(insumo.quantidade ?? "—")} ${escaparHtml(insumo.unidade ?? "")}</td><td>${escaparHtml(insumo.ala_nome ?? "—")}</td><td>${escaparHtml(formatarData(insumo.validade))}</td><td><span class="status ${classeStatus}">${escaparHtml(rotuloStatus(insumo.status))}</span></td></tr>`;
  }).join("");
}

async function carregarDashboard() {
  const corpo = document.querySelector("#corpo-visao-estoque");
  try {
    const [alas, insumos] = await Promise.all([window.LogMedAPI.buscarAlas(), window.LogMedAPI.buscarInsumos()]);
    document.querySelector("#total-alas").textContent = alas.length;
    document.querySelector("#total-insumos").textContent = insumos.length;
    document.querySelector("#total-normais-dashboard").textContent = insumos.filter((item) => normalizarStatus(item.status) === "normal").length;
    document.querySelector("#total-criticos-dashboard").textContent = insumos.filter((item) => normalizarStatus(item.status) === "critico").length;
    renderizarVisaoEstoque(insumos);
  } catch (erro) {
    ["#total-alas", "#total-insumos", "#total-normais-dashboard", "#total-criticos-dashboard"].forEach((seletor) => { document.querySelector(seletor).textContent = "—"; });
    corpo.innerHTML = `<tr><td colspan="6" class="estado-dados erro">${MENSAGEM_ERRO_DADOS}</td></tr>`;
  }
}

document.querySelector(".botao-sair")?.addEventListener("click", () => { localStorage.removeItem("usuarioLogado"); localStorage.removeItem("perfilUsuario"); location.href = "../login/index.html"; });
carregarDashboard();
