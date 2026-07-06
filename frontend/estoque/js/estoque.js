(function iniciarEstoque() {
  const corpoTabela = document.querySelector("#corpo-tabela-estoque");
  const campoBusca = document.querySelector("#busca-estoque");
  const filtroAla = document.querySelector("#filtro-ala-estoque");
  const filtroStatus = document.querySelector("#filtro-status-estoque");
  const totalItens = document.querySelector("#total-itens");
  const totalAlas = document.querySelector("#total-alas-estoque");
  const totalAtencao = document.querySelector("#total-atencao");
  const totalCriticos = document.querySelector("#total-criticos");
  let insumosCarregados = [];

  function normalizarTexto(valor) {
    return String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");
  }

  function formatarData(valor) {
    if (!valor) return "—";
    const data = /^\d{4}-\d{2}-\d{2}$/.test(valor)
      ? new Date(`${valor}T00:00:00`)
      : new Date(valor);
    return Number.isNaN(data.getTime()) ? "—" : data.toLocaleDateString("pt-BR");
  }

  function detalhesStatus(valor) {
    const status = normalizarTexto(valor);
    if (status === "normal") return { classe: "sucesso", rotulo: "Normal" };
    if (status === "atencao" || status === "baixo") {
      return { classe: "atencao", rotulo: status === "baixo" ? "Baixo" : "Atenção" };
    }
    if (status === "critico") return { classe: "critico", rotulo: "Crítico" };
    return { classe: "info", rotulo: valor ? String(valor) : "Não informado" };
  }

  function criarCelula(texto) {
    const celula = document.createElement("td");
    celula.textContent = texto == null || texto === "" ? "—" : String(texto);
    return celula;
  }

  function mostrarEstado(mensagem, tipo = "informacao") {
    corpoTabela.replaceChildren();
    const linha = document.createElement("tr");
    const celula = criarCelula(mensagem);
    celula.colSpan = 7;
    celula.className = `estado-integracao ${tipo}`;
    linha.append(celula);
    corpoTabela.append(linha);
  }

  function renderizarInsumos(insumos) {
    corpoTabela.replaceChildren();

    if (!insumos.length) {
      mostrarEstado("Nenhum insumo encontrado.", "vazio");
      return;
    }

    insumos.forEach((insumo) => {
      const linha = document.createElement("tr");
      const status = detalhesStatus(insumo.status);
      linha.append(
        criarCelula(insumo.codigo),
        criarCelula(insumo.nome),
        criarCelula(insumo.quantidade),
        criarCelula(insumo.unidade),
        criarCelula(insumo.ala_nome),
        criarCelula(formatarData(insumo.validade)),
      );
      const celulaStatus = document.createElement("td");
      const badge = document.createElement("span");
      badge.className = `status ${status.classe}`;
      badge.textContent = status.rotulo;
      celulaStatus.append(badge);
      linha.append(celulaStatus);
      corpoTabela.append(linha);
    });
  }

  function atualizarFiltros(insumos) {
    const alas = [...new Set(insumos.map((item) => item.ala_nome).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
    filtroAla.replaceChildren(new Option("Todas as alas", ""));
    alas.forEach((ala) => filtroAla.append(new Option(ala, ala)));
  }

  function aplicarFiltros() {
    const busca = normalizarTexto(campoBusca.value);
    const ala = filtroAla.value;
    const status = normalizarTexto(filtroStatus.value);
    const filtrados = insumosCarregados.filter((insumo) => {
      const correspondeBusca = !busca || normalizarTexto(
        `${insumo.codigo || ""} ${insumo.nome || ""} ${insumo.ala_nome || ""}`,
      ).includes(busca);
      const correspondeAla = !ala || insumo.ala_nome === ala;
      const correspondeStatus = !status || normalizarTexto(insumo.status) === status;
      return correspondeBusca && correspondeAla && correspondeStatus;
    });
    renderizarInsumos(filtrados);
  }

  async function carregarInsumos() {
    mostrarEstado("Carregando insumos...");
    totalItens.textContent = "—";
    totalAlas.textContent = "—";
    totalAtencao.textContent = "—";
    totalCriticos.textContent = "—";

    try {
      const resposta = await window.LogMedAPI.buscarInsumos();
      if (!Array.isArray(resposta)) throw new Error("A API não retornou uma lista de insumos.");
      insumosCarregados = resposta;
      atualizarFiltros(resposta);
      totalItens.textContent = resposta.length.toLocaleString("pt-BR");
      totalAlas.textContent = new Set(
        resposta.map((item) => item.ala_id ?? item.ala_nome).filter((valor) => valor != null),
      ).size.toLocaleString("pt-BR");
      totalAtencao.textContent = resposta.filter((item) =>
        ["atencao", "baixo"].includes(normalizarTexto(item.status)),
      ).length.toLocaleString("pt-BR");
      totalCriticos.textContent = resposta.filter((item) =>
        normalizarTexto(item.status) === "critico",
      ).length.toLocaleString("pt-BR");
      renderizarInsumos(resposta);
    } catch (erro) {
      insumosCarregados = [];
      console.error("[LogMed Estoque] Não foi possível carregar os insumos.", erro);
      mostrarEstado(
        "Não foi possível carregar os insumos. Verifique a conexão com o servidor.",
        "erro",
      );
    }
  }

  campoBusca.addEventListener("input", aplicarFiltros);
  filtroAla.addEventListener("change", aplicarFiltros);
  filtroStatus.addEventListener("change", aplicarFiltros);
  document.querySelector(".botao-sair")?.addEventListener("click", () => {
    window.LogMedAuth.encerrarSessao();
    window.location.assign("../login/index.html");
  });

  carregarInsumos();
})();
