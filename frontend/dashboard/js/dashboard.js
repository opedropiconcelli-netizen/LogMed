(function iniciarDashboard() {
  const mensagemIndicadores = document.querySelector("#mensagem-indicadores");
  const totalAlas = document.querySelector("#indicador-alas");
  const totalInsumos = document.querySelector("#indicador-insumos");
  const totalMovimentacoes = document.querySelector("#indicador-movimentacoes");
  const totalAlertasCriticos = document.querySelector("#indicador-alertas-criticos");
  const listaMovimentacoes = document.querySelector("#movimentacoes-recentes");
  const resumoAlertas = document.querySelector("#resumo-alertas-dashboard");
  const corpoEstoque = document.querySelector("#resumo-estoque-dashboard");

  function normalizarTexto(valor) {
    return String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");
  }

  function formatarDataHora(valor) {
    if (!valor) return "Data não informada";
    const data = new Date(valor);
    return Number.isNaN(data.getTime())
      ? "Data não informada"
      : data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  }

  function detalhesStatus(valor) {
    const status = normalizarTexto(valor);
    if (status === "critico") return { classe: "critico", rotulo: "Crítico" };
    if (status === "atencao" || status === "baixo") {
      return { classe: "atencao", rotulo: status === "baixo" ? "Baixo" : "Atenção" };
    }
    return { classe: "normal", rotulo: valor ? String(valor) : "Normal" };
  }

  function criarCelula(valor) {
    const celula = document.createElement("td");
    celula.textContent = valor == null || valor === "" ? "—" : String(valor);
    return celula;
  }

  function mostrarEstadoLista(elemento, mensagem, tipo = "informacao") {
    elemento.replaceChildren();
    const item = document.createElement("li");
    item.className = `estado-integracao ${tipo}`;
    item.textContent = mensagem;
    elemento.append(item);
  }

  function mostrarEstadoTabela(mensagem, tipo = "informacao") {
    corpoEstoque.replaceChildren();
    const linha = document.createElement("tr");
    const celula = criarCelula(mensagem);
    celula.colSpan = 5;
    celula.className = `estado-integracao ${tipo}`;
    linha.append(celula);
    corpoEstoque.append(linha);
  }

  function renderizarMovimentacoes(movimentacoes) {
    listaMovimentacoes.replaceChildren();
    if (!movimentacoes.length) {
      mostrarEstadoLista(listaMovimentacoes, "Nenhuma movimentação recente.", "vazio");
      return;
    }

    movimentacoes.slice(0, 5).forEach((movimentacao) => {
      const item = document.createElement("li");
      const icone = document.createElement("b");
      icone.textContent = "⇄";
      const conteudo = document.createElement("div");
      const titulo = document.createElement("h3");
      titulo.textContent = movimentacao.descricao || "Movimentação sem descrição";
      const detalhes = document.createElement("p");
      detalhes.textContent = [
        formatarDataHora(movimentacao.data_hora),
        movimentacao.responsavel || "Responsável não informado",
      ].join(" • ");
      conteudo.append(titulo, detalhes);
      item.append(icone, conteudo);
      listaMovimentacoes.append(item);
    });
  }

  function renderizarAlertas(alertas) {
    resumoAlertas.replaceChildren();
    if (!alertas.length) {
      const estado = document.createElement("p");
      estado.className = "estado-integracao vazio";
      estado.textContent = "Nenhum alerta de validade.";
      resumoAlertas.append(estado);
      return;
    }

    alertas.slice(0, 4).forEach((alerta) => {
      const nivel = normalizarTexto(alerta.nivel);
      const item = document.createElement("article");
      item.className = `alerta-item ${nivel === "critico" ? "vermelho" : "amarelo"}`;
      const marcador = document.createElement("b");
      marcador.textContent = nivel === "critico" ? "!" : "◷";
      const conteudo = document.createElement("div");
      const titulo = document.createElement("strong");
      titulo.textContent = alerta.insumo_nome || "Insumo não informado";
      const detalhe = document.createElement("span");
      const dias = alerta.dias_para_vencer == null
        ? "prazo não informado"
        : `${alerta.dias_para_vencer} dias restantes`;
      detalhe.textContent = `${alerta.ala_nome || "Ala não informada"} • ${dias}`;
      conteudo.append(titulo, detalhe);
      item.append(marcador, conteudo);
      resumoAlertas.append(item);
    });
  }

  function renderizarEstoque(insumos) {
    corpoEstoque.replaceChildren();
    if (!insumos.length) {
      mostrarEstadoTabela("Nenhum insumo cadastrado.", "vazio");
      return;
    }

    insumos.slice(0, 6).forEach((insumo) => {
      const linha = document.createElement("tr");
      const status = detalhesStatus(insumo.status);
      linha.append(
        criarCelula(insumo.nome),
        criarCelula(insumo.codigo),
        criarCelula(insumo.ala_nome),
        criarCelula(
          insumo.quantidade == null
            ? null
            : `${insumo.quantidade} ${insumo.unidade || ""}`.trim(),
        ),
      );
      const celulaStatus = document.createElement("td");
      const badge = document.createElement("span");
      badge.className = `status ${status.classe}`;
      badge.textContent = status.rotulo;
      celulaStatus.append(badge);
      linha.append(celulaStatus);
      corpoEstoque.append(linha);
    });
  }

  async function carregarDashboard() {
    mensagemIndicadores.textContent = "Carregando indicadores...";
    mensagemIndicadores.className = "mensagem-indicadores";
    [totalAlas, totalInsumos, totalMovimentacoes, totalAlertasCriticos]
      .forEach((elemento) => { elemento.textContent = "—"; });
    mostrarEstadoLista(listaMovimentacoes, "Carregando movimentações...");
    resumoAlertas.replaceChildren();
    const carregandoAlertas = document.createElement("p");
    carregandoAlertas.className = "estado-integracao informacao";
    carregandoAlertas.textContent = "Carregando alertas...";
    resumoAlertas.append(carregandoAlertas);
    mostrarEstadoTabela("Carregando estoque...");

    const resultados = await Promise.allSettled([
      window.LogMedAPI.buscarAlas(),
      window.LogMedAPI.buscarInsumos(),
      window.LogMedAPI.buscarMovimentacoes(),
      window.LogMedAPI.buscarAlertasValidade(),
    ]);
    const [resultadoAlas, resultadoInsumos, resultadoMovimentacoes, resultadoAlertas] = resultados;

    if (resultadoAlas.status === "fulfilled" && Array.isArray(resultadoAlas.value)) {
      totalAlas.textContent = resultadoAlas.value.length.toLocaleString("pt-BR");
    }

    if (resultadoInsumos.status === "fulfilled" && Array.isArray(resultadoInsumos.value)) {
      totalInsumos.textContent = resultadoInsumos.value.length.toLocaleString("pt-BR");
      renderizarEstoque(resultadoInsumos.value);
    } else {
      mostrarEstadoTabela("Resumo de estoque indisponível.", "erro");
    }

    if (
      resultadoMovimentacoes.status === "fulfilled"
      && Array.isArray(resultadoMovimentacoes.value)
    ) {
      totalMovimentacoes.textContent = resultadoMovimentacoes.value.length.toLocaleString("pt-BR");
      renderizarMovimentacoes(resultadoMovimentacoes.value);
    } else {
      mostrarEstadoLista(listaMovimentacoes, "Movimentações indisponíveis.", "erro");
    }

    if (resultadoAlertas.status === "fulfilled" && Array.isArray(resultadoAlertas.value)) {
      const criticos = resultadoAlertas.value.filter((alerta) =>
        normalizarTexto(alerta.nivel) === "critico",
      ).length;
      totalAlertasCriticos.textContent = criticos.toLocaleString("pt-BR");
      renderizarAlertas(resultadoAlertas.value);
    } else {
      resumoAlertas.replaceChildren();
      const estado = document.createElement("p");
      estado.className = "estado-integracao erro";
      estado.textContent = "Alertas indisponíveis.";
      resumoAlertas.append(estado);
    }

    const houveErro = resultados.some((resultado) =>
      resultado.status === "rejected"
      || (resultado.status === "fulfilled" && !Array.isArray(resultado.value)),
    );
    mensagemIndicadores.textContent = houveErro
      ? "Indicadores indisponíveis. Verifique a conexão com o servidor."
      : "Indicadores atualizados com dados do servidor.";
    mensagemIndicadores.className = `mensagem-indicadores ${houveErro ? "erro" : "sucesso"}`;

    if (houveErro) {
      resultados
        .filter((resultado) => resultado.status === "rejected")
        .forEach((resultado) =>
          console.error("[LogMed Dashboard] Falha ao carregar indicador.", resultado.reason),
        );
    }
  }

  document.querySelector(".botao-sair")?.addEventListener("click", () => {
    window.LogMedAuth.encerrarSessao();
    window.location.assign("../login/index.html");
  });

  carregarDashboard();
})();
