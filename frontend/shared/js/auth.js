(function configurarAutenticacaoLogMed() {
  const CHAVE_SESSAO = "logmedSessao";

  function salvarSessao(usuario, token) {
    if (!usuario || usuario.id == null || !usuario.nome || !usuario.perfil) {
      throw new Error("Os dados de usuário recebidos no login estão incompletos.");
    }

    const sessao = {
      id: usuario.id,
      nome: String(usuario.nome),
      perfil: String(usuario.perfil).toLocaleLowerCase("pt-BR"),
    };

    if (token) sessao.token = String(token);
    sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
  }

  function obterSessao() {
    try {
      const sessao = JSON.parse(sessionStorage.getItem(CHAVE_SESSAO) || "null");
      return sessao && sessao.id != null && sessao.nome && sessao.perfil ? sessao : null;
    } catch {
      sessionStorage.removeItem(CHAVE_SESSAO);
      return null;
    }
  }

  function obterToken() {
    return obterSessao()?.token || null;
  }

  function obterPerfilUsuario() {
    return obterSessao()?.perfil || null;
  }

  function encerrarSessao() {
    sessionStorage.removeItem(CHAVE_SESSAO);
  }

  function usuarioEstaLogado() {
    return obterSessao() !== null;
  }

  function exibirBloqueio(mensagem, destinoLogin) {
    const aviso = document.createElement("div");
    aviso.setAttribute("role", "alert");
    aviso.textContent = mensagem;
    Object.assign(aviso.style, {
      position: "fixed",
      zIndex: "9999",
      inset: "20px 20px auto",
      maxWidth: "560px",
      margin: "0 auto",
      padding: "14px 18px",
      color: "#7a2630",
      border: "1px solid rgba(230, 57, 70, .25)",
      borderRadius: "10px",
      background: "#fff1f2",
      boxShadow: "0 12px 30px rgba(21, 67, 73, .16)",
      textAlign: "center",
    });
    document.body.append(aviso);
    window.setTimeout(() => window.location.replace(destinoLogin), 1400);
  }

  function protegerPagina(perfisPermitidos = []) {
    const sessao = obterSessao();
    const destinoLogin = "../login/index.html";

    if (!sessao) {
      exibirBloqueio("Sua sessão não está ativa. Você será direcionado para o login.", destinoLogin);
      return false;
    }

    const perfisNormalizados = perfisPermitidos.map((perfil) =>
      String(perfil).toLocaleLowerCase("pt-BR"),
    );

    if (perfisNormalizados.length && !perfisNormalizados.includes(sessao.perfil)) {
      exibirBloqueio("Seu perfil não tem permissão para acessar esta página.", destinoLogin);
      return false;
    }

    return true;
  }

  window.LogMedAuth = {
    salvarSessao,
    obterSessao,
    obterToken,
    obterPerfilUsuario,
    encerrarSessao,
    usuarioEstaLogado,
    protegerPagina,
  };
})();
