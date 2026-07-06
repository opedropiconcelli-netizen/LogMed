(function configurarApiLogMed() {
  function obterConfiguracao() {
    const configuracao = window.LogMedConfig;

    if (!configuracao?.URL_BASE_API || !configuracao?.ROTAS_API) {
      throw new Error("A configuração da API do LogMed não foi carregada.");
    }

    return configuracao;
  }

  async function requisitarApi(rota, opcoes = {}) {
    const { URL_BASE_API } = obterConfiguracao();
    const configuracaoFetch = {
      ...opcoes,
      credentials: "include",
      headers: new Headers(opcoes.headers || {}),
    };

    if (opcoes.body != null && !configuracaoFetch.headers.has("Content-Type")) {
      configuracaoFetch.headers.set("Content-Type", "application/json");
    }

    const token = window.LogMedAuth?.obterToken?.();
    if (token && !configuracaoFetch.headers.has("Authorization")) {
      configuracaoFetch.headers.set("Authorization", `Bearer ${token}`);
    }

    const url = `${URL_BASE_API.replace(/\/$/, "")}${rota}`;
    let resposta;

    try {
      resposta = await fetch(url, configuracaoFetch);
    } catch (erroOriginal) {
      console.error(`[LogMed API] Falha de rede em ${configuracaoFetch.method || "GET"} ${rota}.`);
      const erroRede = new Error("Não foi possível conectar ao servidor do LogMed.");
      erroRede.tipo = "rede";
      erroRede.causa = erroOriginal;
      throw erroRede;
    }

    const tipoConteudo = resposta.headers.get("content-type") || "";
    let dados = null;

    try {
      if (resposta.status !== 204) {
        dados = tipoConteudo.includes("application/json")
          ? await resposta.json()
          : await resposta.text();
      }
    } catch (erroLeitura) {
      console.error(`[LogMed API] Resposta inválida em ${configuracaoFetch.method || "GET"} ${rota}.`);
      const erroResposta = new Error("O servidor retornou uma resposta que não pôde ser lida.");
      erroResposta.tipo = "resposta";
      erroResposta.status = resposta.status;
      erroResposta.causa = erroLeitura;
      throw erroResposta;
    }

    if (!resposta.ok) {
      const mensagemServidor = dados && typeof dados === "object"
        ? dados.mensagem || dados.erro || dados.message
        : dados;
      const erroHttp = new Error(
        mensagemServidor || `A solicitação falhou com o status HTTP ${resposta.status}.`,
      );
      erroHttp.tipo = "http";
      erroHttp.status = resposta.status;
      erroHttp.dados = dados;
      console.error(
        `[LogMed API] Erro HTTP ${resposta.status} em ${configuracaoFetch.method || "GET"} ${rota}.`,
      );
      throw erroHttp;
    }

    console.info(`[LogMed API] ${configuracaoFetch.method || "GET"} ${rota} concluído.`);
    return dados;
  }

  function criarQueryString(filtros = {}) {
    const parametros = new URLSearchParams();

    Object.entries(filtros).forEach(([chave, valor]) => {
      if (valor !== undefined && valor !== null && String(valor).trim() !== "") {
        parametros.set(chave, String(valor));
      }
    });

    const query = parametros.toString();
    return query ? `?${query}` : "";
  }

  async function fazerLogin(credenciais) {
    const { ROTAS_API } = obterConfiguracao();
    return requisitarApi(ROTAS_API.login, {
      method: "POST",
      body: JSON.stringify(credenciais),
    });
  }

  async function buscarAlas() {
    const { ROTAS_API } = obterConfiguracao();
    return requisitarApi(ROTAS_API.alas);
  }

  async function buscarInsumos() {
    const { ROTAS_API } = obterConfiguracao();
    return requisitarApi(ROTAS_API.insumos);
  }

  async function registrarTransferencia(dadosTransferencia) {
    const { ROTAS_API } = obterConfiguracao();
    return requisitarApi(ROTAS_API.transferencias, {
      method: "POST",
      body: JSON.stringify(dadosTransferencia),
    });
  }

  async function buscarMovimentacoes(filtros = {}) {
    const { ROTAS_API } = obterConfiguracao();
    return requisitarApi(`${ROTAS_API.movimentacoes}${criarQueryString(filtros)}`);
  }

  async function buscarAlertasValidade() {
    const { ROTAS_API } = obterConfiguracao();
    return requisitarApi(ROTAS_API.alertasValidade);
  }

  window.LogMedAPI = {
    fazerLogin,
    buscarAlas,
    buscarInsumos,
    registrarTransferencia,
    buscarMovimentacoes,
    buscarAlertasValidade,
  };
})();
