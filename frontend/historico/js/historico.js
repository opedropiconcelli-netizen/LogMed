(function iniciarHistorico() {
  const corpoTabela = document.querySelector("#corpo-tabela-historico");
  const campoBusca = document.querySelector("#filtro-busca-historico");
  const campoData = document.querySelector("#filtro-data-historico");
  const campoTipo = document.querySelector("#filtro-tipo-historico");
  const botaoExportar = document.querySelector("#exportar-historico");
  const totalEventos = document.querySelector("#total-eventos");
  const totalEntradas = document.querySelector("#total-entradas");
  const totalTransferencias = document.querySelector("#total-transferencias");
  const totalAjustes = document.querySelector("#total-ajustes");
  let movimentacoesCarregadas = [];
  let numeroRequisicao = 0;
  let temporizadorBusca;

  function normalizarTexto(valor) {
    return String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");
  }

  function formatarDataHora(valor) {
    if (!valor) return "—";
    const data = new Date(valor);
    return Number.isNaN(data.getTime())
      ? "—"
      : data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  }

  function formatarTipo(valor) {
    if (!valor) return "—";
    const texto = String(valor).replaceAll("_", " ");
    return texto.charAt(0).toLocaleUpperCase("pt-BR") + texto.slice(1);
  }

  function criarCelula(valor) {
    const celula = document.createElement("td");
    celula.textContent = valor == null || valor === "" ? "—" : String(valor);
    return celula;
  }

  function mostrarEstado(mensagem, tipo = "informacao") {
    corpoTabela.replaceChildren();
    const linha = document.createElement("tr");
    const celula = criarCelula(mensagem);
    celula.colSpan = 6;
    celula.className = `estado-integracao ${tipo}`;
    linha.append(celula);
    corpoTabela.append(linha);
  }

  function renderizarMovimentacoes(movimentacoes) {
    corpoTabela.replaceChildren();
    if (!movimentacoes.length) {
      mostrarEstado("Nenhuma movimentação encontrada.", "vazio");
      return;
    }

    movimentacoes.forEach((movimentacao) => {
      const linha = document.createElement("tr");
      linha.append(
        criarCelula(formatarDataHora(movimentacao.data_hora)),
        criarCelula(formatarTipo(movimentacao.tipo)),
        criarCelula(movimentacao.descricao),
        criarCelula(movimentacao.origem_destino || movimentacao.ala_nome),
        criarCelula(movimentacao.responsavel),
      );
      const celulaSituacao = criarCelula(movimentacao.status);
      if (movimentacao.status) {
        celulaSituacao.textContent = "";
        const badge = document.createElement("span");
        badge.className = "status info";
        badge.textContent = movimentacao.status;
        celulaSituacao.append(badge);
      }
      linha.append(celulaSituacao);
      corpoTabela.append(linha);
    });
  }

  function atualizarResumo(movimentacoes) {
    const contarTipo = (tipos) => movimentacoes.filter((item) =>
      tipos.includes(normalizarTexto(item.tipo)),
    ).length;
    totalEventos.textContent = movimentacoes.length.toLocaleString("pt-BR");
    totalEntradas.textContent = contarTipo(["entrada"]).toLocaleString("pt-BR");
    totalTransferencias.textContent = contarTipo(["transferencia"]).toLocaleString("pt-BR");
    totalAjustes.textContent = contarTipo(["ajuste", "ajuste manual"]).toLocaleString("pt-BR");
  }

  function filtrosAtuais() {
    return {
      busca: campoBusca.value.trim(),
      data: campoData.value,
      tipo: campoTipo.value,
    };
  }

  async function carregarMovimentacoes() {
    const requisicaoAtual = ++numeroRequisicao;
    mostrarEstado("Carregando movimentações...");
    botaoExportar.disabled = true;

    try {
      const resposta = await window.LogMedAPI.buscarMovimentacoes(filtrosAtuais());
      if (requisicaoAtual !== numeroRequisicao) return;
      if (!Array.isArray(resposta)) {
        throw new Error("A API não retornou uma lista de movimentações.");
      }
      movimentacoesCarregadas = resposta;
      atualizarResumo(resposta);
      renderizarMovimentacoes(resposta);
      botaoExportar.disabled = resposta.length === 0;
    } catch (erro) {
      if (requisicaoAtual !== numeroRequisicao) return;
      movimentacoesCarregadas = [];
      atualizarResumo([]);
      console.error("[LogMed Histórico] Falha ao carregar movimentações.", erro);
      mostrarEstado(
        "Não foi possível carregar o histórico. Verifique a conexão com o servidor.",
        "erro",
      );
    }
  }

  function exportarHistorico() {
    if (!movimentacoesCarregadas.length) return;
    const colunas = ["Data e hora", "Tipo", "Descrição", "Responsável"];
    const linhas = movimentacoesCarregadas.map((item) => [
      formatarDataHora(item.data_hora),
      formatarTipo(item.tipo),
      item.descricao || "",
      item.responsavel || "",
    ]);
    const csv = [colunas, ...linhas]
      .map((linha) => linha.map((valor) => `"${String(valor).replaceAll('"', '""')}"`).join(";"))
      .join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "historico-logmed.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  campoBusca.addEventListener("input", () => {
    window.clearTimeout(temporizadorBusca);
    temporizadorBusca = window.setTimeout(carregarMovimentacoes, 350);
  });
  campoData.addEventListener("change", carregarMovimentacoes);
  campoTipo.addEventListener("change", carregarMovimentacoes);
  botaoExportar.addEventListener("click", exportarHistorico);
  document.querySelector(".botao-sair")?.addEventListener("click", () => {
    window.LogMedAuth.encerrarSessao();
    window.location.assign("../login/index.html");
  });

  carregarMovimentacoes();
})();
