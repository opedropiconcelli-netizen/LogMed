const MENSAGEM_ERRO_ESTOQUE = "Não foi possível carregar os dados do servidor. Aguarde a disponibilização do back-end.";
let insumosCarregados = [];

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

function renderizarTabela(insumos) {
  const corpo = document.querySelector("#corpo-tabela-estoque");
  if (!insumos.length) {
    corpo.innerHTML = '<tr><td colspan="6" class="estado-tabela">Nenhum insumo cadastrado.</td></tr>';
    return;
  }

  corpo.innerHTML = insumos.map((insumo) => {
    const status = normalizarStatus(insumo.status);
    const classeStatus = status === "normal" ? "sucesso" : status === "critico" ? "critico" : "info";
    return `<tr><td class="codigo-insumo">${escaparHtml(insumo.codigo ?? "—")}</td><td>${escaparHtml(insumo.nome ?? "—")}</td><td>${escaparHtml(insumo.quantidade ?? "—")} ${escaparHtml(insumo.unidade ?? "")}</td><td>${escaparHtml(insumo.ala_nome ?? "—")}</td><td>${escaparHtml(formatarData(insumo.validade))}</td><td><span class="status ${classeStatus}">${escaparHtml(rotuloStatus(insumo.status))}</span></td></tr>`;
  }).join("");
}

function aplicarFiltros() {
  const termo = document.querySelector(".campo-busca").value.trim().toLocaleLowerCase("pt-BR");
  const ala = document.querySelector("#filtro-ala").value;
  const status = document.querySelector("#filtro-status").value
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  renderizarTabela(insumosCarregados.filter((item) => {
    const correspondeTexto = `${item.codigo ?? ""} ${item.nome ?? ""} ${item.ala_nome ?? ""}`
      .toLocaleLowerCase("pt-BR")
      .includes(termo);
    const correspondeAla = !ala || String(item.ala_id) === ala;
    const correspondeStatus = !status || normalizarStatus(item.status) === status;
    return correspondeTexto && correspondeAla && correspondeStatus;
  }));
}

function preencherFiltroAlas(insumos) {
  const alas = new Map();
  insumos.forEach((insumo) => {
    if (insumo.ala_id != null && insumo.ala_nome) {
      alas.set(String(insumo.ala_id), insumo.ala_nome);
    }
  });

  const filtroAla = document.querySelector("#filtro-ala");
  filtroAla.replaceChildren(new Option("Todos os setores", ""));
  [...alas.entries()]
    .sort(([, nomeA], [, nomeB]) => String(nomeA).localeCompare(String(nomeB), "pt-BR"))
    .forEach(([id, nome]) => filtroAla.add(new Option(nome, id)));

  return alas.size;
}

async function carregarEstoque() {
  const corpo = document.querySelector("#corpo-tabela-estoque");
  corpo.innerHTML = '<tr><td colspan="6" class="estado-tabela">Carregando dados logísticos...</td></tr>';

  try {
    const insumos = await window.LogMedAPI.buscarInsumos();
    insumosCarregados = insumos;
    const totalAlas = preencherFiltroAlas(insumos);

    document.querySelector("#total-itens").textContent = insumos.length;
    document.querySelector("#total-alas-estoque").textContent = totalAlas;
    document.querySelector("#total-normais").textContent = insumos.filter((item) => normalizarStatus(item.status) === "normal").length;
    document.querySelector("#total-criticos").textContent = insumos.filter((item) => normalizarStatus(item.status) === "critico").length;
    renderizarTabela(insumos);
  } catch (erro) {
    insumosCarregados = [];
    ["#total-itens", "#total-alas-estoque", "#total-normais", "#total-criticos"].forEach((seletor) => {
      document.querySelector(seletor).textContent = "—";
    });
    corpo.innerHTML = `<tr><td colspan="6" class="estado-tabela erro">${MENSAGEM_ERRO_ESTOQUE}</td></tr>`;
  }
}

document.querySelector(".campo-busca")?.addEventListener("input", aplicarFiltros);
document.querySelector("#filtro-ala")?.addEventListener("change", aplicarFiltros);
document.querySelector("#filtro-status")?.addEventListener("change", aplicarFiltros);
document.querySelector("#atualizar-estoque")?.addEventListener("click", carregarEstoque);
document.querySelector(".botao-sair")?.addEventListener("click", () => {
  localStorage.removeItem("usuarioLogado");
  localStorage.removeItem("perfilUsuario");
  location.href = "../login/index.html";
});

carregarEstoque();
