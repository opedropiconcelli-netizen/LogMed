(function iniciarTransferencias() {
  const botaoAbrir = document.querySelector("#abrir-nova-transferencia");
  const listaTransferencias = document.querySelector("#lista-transferencias");
  const totalTransferenciasHoje = document.querySelector("#transferencias-hoje");
  let alas = [];
  let insumos = [];
  let recursosCarregados = false;

  function mostrarEstadoLista(mensagem, tipo = "informacao") {
    listaTransferencias.replaceChildren();
    const item = document.createElement("li");
    item.className = `estado-integracao ${tipo}`;
    item.textContent = mensagem;
    listaTransferencias.append(item);
  }

  function definirBotaoCarregando(carregando) {
    botaoAbrir.disabled = carregando;
    botaoAbrir.textContent = carregando ? "Carregando opções..." : "+ Nova transferência";
  }

  async function carregarRecursos() {
    definirBotaoCarregando(true);

    try {
      const [respostaAlas, respostaInsumos] = await Promise.all([
        window.LogMedAPI.buscarAlas(),
        window.LogMedAPI.buscarInsumos(),
      ]);
      if (!Array.isArray(respostaAlas) || !Array.isArray(respostaInsumos)) {
        throw new Error("A API retornou um formato inválido para alas ou insumos.");
      }
      alas = respostaAlas;
      insumos = respostaInsumos;
      recursosCarregados = true;
      return true;
    } catch (erro) {
      alas = [];
      insumos = [];
      recursosCarregados = false;
      console.error("[LogMed Transferências] Falha ao carregar opções.", erro);
      return false;
    } finally {
      definirBotaoCarregando(false);
    }
  }

  function normalizarTexto(valor) {
    return String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");
  }

  function formatarHora(valor) {
    if (!valor) return "—";
    const data = new Date(valor);
    return Number.isNaN(data.getTime())
      ? "—"
      : data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  async function carregarMovimentacoesRecentes() {
    mostrarEstadoLista("Carregando transferências recentes...");
    totalTransferenciasHoje.textContent = "—";

    try {
      const resposta = await window.LogMedAPI.buscarMovimentacoes({ tipo: "transferencia" });
      if (!Array.isArray(resposta)) {
        throw new Error("A API não retornou uma lista de movimentações.");
      }
      const transferencias = resposta.filter((item) =>
        normalizarTexto(item.tipo) === "transferencia",
      );
      const hoje = new Date().toLocaleDateString("pt-BR");
      totalTransferenciasHoje.textContent = transferencias.filter((item) => {
        const data = new Date(item.data_hora);
        return !Number.isNaN(data.getTime()) && data.toLocaleDateString("pt-BR") === hoje;
      }).length.toLocaleString("pt-BR");
      listaTransferencias.replaceChildren();

      if (!transferencias.length) {
        mostrarEstadoLista("Nenhuma transferência recente.", "vazio");
        return;
      }

      transferencias.slice(0, 6).forEach((transferencia) => {
        const item = document.createElement("li");
        const icone = document.createElement("span");
        icone.className = "icone-lista";
        icone.textContent = "⇄";
        const conteudo = document.createElement("div");
        const titulo = document.createElement("h3");
        titulo.textContent = transferencia.descricao || "Transferência sem descrição";
        const detalhes = document.createElement("p");
        detalhes.textContent = transferencia.responsavel
          ? `Responsável: ${transferencia.responsavel}`
          : "Responsável não informado";
        const horario = document.createElement("time");
        horario.textContent = formatarHora(transferencia.data_hora);
        conteudo.append(titulo, detalhes);
        item.append(icone, conteudo, horario);
        listaTransferencias.append(item);
      });
    } catch (erro) {
      console.error("[LogMed Transferências] Falha ao carregar movimentações.", erro);
      mostrarEstadoLista(
        "Não foi possível carregar as transferências recentes. Verifique a conexão com o servidor.",
        "erro",
      );
    }
  }

  function criarCampo(rotulo, controle, largo = false) {
    const grupo = document.createElement("div");
    grupo.className = `campo-formulario${largo ? " largo" : ""}`;
    const label = document.createElement("label");
    label.htmlFor = controle.id;
    label.textContent = rotulo;
    grupo.append(label, controle);
    return grupo;
  }

  function criarSelect(id, nome, textoInicial, itens, obterTexto) {
    const select = document.createElement("select");
    select.id = id;
    select.name = nome;
    select.required = true;
    select.append(new Option(textoInicial, ""));
    itens.forEach((item) => {
      const option = new Option(obterTexto(item), String(item.id));
      if (item.lote_id != null) option.dataset.loteId = String(item.lote_id);
      select.append(option);
    });
    return select;
  }

  function abrirModal() {
    const fundo = document.createElement("div");
    fundo.className = "modal-operacao";

    const janela = document.createElement("section");
    janela.className = "janela-modal";
    janela.setAttribute("role", "dialog");
    janela.setAttribute("aria-modal", "true");
    janela.setAttribute("aria-labelledby", "titulo-transferencia");

    const cabecalho = document.createElement("header");
    cabecalho.className = "cabecalho-modal";
    const titulo = document.createElement("h2");
    titulo.id = "titulo-transferencia";
    titulo.textContent = "Nova transferência";
    const botaoFechar = document.createElement("button");
    botaoFechar.className = "fechar-modal";
    botaoFechar.type = "button";
    botaoFechar.setAttribute("aria-label", "Fechar");
    botaoFechar.textContent = "×";
    cabecalho.append(titulo, botaoFechar);

    const formulario = document.createElement("form");
    formulario.className = "formulario-operacao";
    const grade = document.createElement("div");
    grade.className = "grade-formulario";

    const selectOrigem = criarSelect(
      "transferencia-origem",
      "ala_origem_id",
      "Selecione a origem",
      alas,
      (ala) => ala.nome || `Ala ${ala.id}`,
    );
    const selectDestino = criarSelect(
      "transferencia-destino",
      "ala_destino_id",
      "Selecione o destino",
      alas,
      (ala) => ala.nome || `Ala ${ala.id}`,
    );
    const selectInsumo = criarSelect(
      "transferencia-insumo",
      "insumo_id",
      "Selecione o insumo",
      insumos,
      (insumo) => [insumo.codigo, insumo.nome].filter(Boolean).join(" — ") || `Insumo ${insumo.id}`,
    );
    const campoLote = document.createElement("input");
    campoLote.id = "transferencia-lote";
    campoLote.name = "lote_id";
    campoLote.type = "number";
    campoLote.min = "1";
    campoLote.step = "1";
    campoLote.placeholder = "ID do lote";
    campoLote.required = true;
    const campoQuantidade = document.createElement("input");
    campoQuantidade.id = "transferencia-quantidade";
    campoQuantidade.name = "quantidade";
    campoQuantidade.type = "number";
    campoQuantidade.min = "1";
    campoQuantidade.step = "1";
    campoQuantidade.placeholder = "Quantidade";
    campoQuantidade.required = true;

    selectInsumo.addEventListener("change", () => {
      const loteId = selectInsumo.selectedOptions[0]?.dataset.loteId;
      campoLote.value = loteId || "";
      campoLote.readOnly = Boolean(loteId);
    });

    grade.append(
      criarCampo("Ala de origem", selectOrigem),
      criarCampo("Ala de destino", selectDestino),
      criarCampo("Insumo", selectInsumo, true),
      criarCampo("Identificador do lote", campoLote),
      criarCampo("Quantidade", campoQuantidade),
    );

    const mensagem = document.createElement("div");
    mensagem.className = "mensagem-operacao";
    mensagem.setAttribute("role", "status");
    mensagem.setAttribute("aria-live", "polite");

    const acoes = document.createElement("div");
    acoes.className = "acoes-formulario";
    const botaoCancelar = document.createElement("button");
    botaoCancelar.className = "botao-secundario";
    botaoCancelar.type = "button";
    botaoCancelar.textContent = "Cancelar";
    const botaoEnviar = document.createElement("button");
    botaoEnviar.className = "botao-primario";
    botaoEnviar.type = "submit";
    botaoEnviar.textContent = "Registrar transferência";
    acoes.append(botaoCancelar, botaoEnviar);
    formulario.append(grade, mensagem, acoes);
    janela.append(cabecalho, formulario);
    fundo.append(janela);
    document.body.append(fundo);
    document.body.style.overflow = "hidden";
    selectOrigem.focus();

    function fechar() {
      fundo.remove();
      document.body.style.overflow = "";
    }

    function exibirMensagem(texto, tipo) {
      mensagem.textContent = texto;
      mensagem.className = `mensagem-operacao visivel ${tipo}`;
    }

    botaoFechar.addEventListener("click", fechar);
    botaoCancelar.addEventListener("click", fechar);
    fundo.addEventListener("click", (evento) => {
      if (evento.target === fundo) fechar();
    });

    formulario.addEventListener("submit", async (evento) => {
      evento.preventDefault();
      if (!formulario.reportValidity()) return;

      if (selectOrigem.value === selectDestino.value) {
        exibirMensagem("A ala de origem e a ala de destino devem ser diferentes.", "erro");
        selectDestino.focus();
        return;
      }

      const quantidade = Number(campoQuantidade.value);
      if (!Number.isFinite(quantidade) || quantidade <= 0) {
        exibirMensagem("Informe uma quantidade positiva.", "erro");
        campoQuantidade.focus();
        return;
      }

      const dadosTransferencia = {
        ala_origem_id: Number(selectOrigem.value),
        ala_destino_id: Number(selectDestino.value),
        insumo_id: Number(selectInsumo.value),
        lote_id: Number(campoLote.value),
        quantidade,
      };

      botaoEnviar.disabled = true;
      botaoCancelar.disabled = true;
      botaoEnviar.textContent = "Enviando...";
      exibirMensagem("Registrando transferência...", "informacao");

      try {
        await window.LogMedAPI.registrarTransferencia(dadosTransferencia);
        exibirMensagem("Transferência registrada com sucesso.", "sucesso");
        carregarMovimentacoesRecentes();
        window.setTimeout(fechar, 1100);
      } catch (erro) {
        const texto = erro.tipo === "rede"
          ? "Não foi possível conectar ao servidor. Tente novamente quando a API estiver disponível."
          : erro.message || "O servidor não conseguiu registrar a transferência.";
        exibirMensagem(texto, "erro");
        botaoEnviar.disabled = false;
        botaoCancelar.disabled = false;
        botaoEnviar.textContent = "Registrar transferência";
      }
    });
  }

  botaoAbrir.addEventListener("click", async () => {
    if (!recursosCarregados && !(await carregarRecursos())) return;
    abrirModal();
  });
  document.querySelector(".botao-sair")?.addEventListener("click", () => {
    window.LogMedAuth.encerrarSessao();
    window.location.assign("../login/index.html");
  });

  carregarRecursos().then((carregou) => {
    if (carregou && new URLSearchParams(window.location.search).get("nova") === "1") {
      abrirModal();
    }
  });
  carregarMovimentacoesRecentes();
})();
