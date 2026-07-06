(function iniciarLogin() {
  const formularioLogin = document.querySelector("#formulario-login");
  const campoUsuario = document.querySelector("#usuario");
  const campoSenha = document.querySelector("#senha");
  const botaoAlternarSenha = document.querySelector("#botao-alternar-senha");
  const botaoEntrar = document.querySelector("#botao-entrar");
  const textoBotao = botaoEntrar.querySelector("span");
  const mensagemFormulario = document.querySelector("#mensagem-formulario");
  const linkRecuperarSenha = document.querySelector("#link-recuperar-senha");

  const destinosPorPerfil = {
    almoxarife: "../cadastro/index.html",
    enfermeiro: "../transferencia/index.html",
    auditor: "../alertas/index.html",
  };

  function exibirMensagem(texto, tipo) {
    mensagemFormulario.textContent = texto;
    mensagemFormulario.className = `mensagem-formulario visivel ${tipo}`;
  }

  function limparValidacao() {
    campoUsuario.closest(".campo-com-icone")?.classList.remove("campo-invalido");
    campoSenha.closest(".campo-com-icone")?.classList.remove("campo-invalido");
    mensagemFormulario.className = "mensagem-formulario";
    mensagemFormulario.textContent = "";
  }

  function marcarCampoInvalido(campo) {
    campo.closest(".campo-com-icone")?.classList.add("campo-invalido");
  }

  function alterarEstadoEnvio(enviando) {
    botaoEntrar.disabled = enviando;
    campoUsuario.disabled = enviando;
    campoSenha.disabled = enviando;
    textoBotao.textContent = enviando ? "Autenticando..." : "Entrar no sistema";
  }

  botaoAlternarSenha.addEventListener("click", () => {
    const senhaEstaVisivel = campoSenha.type === "text";
    campoSenha.type = senhaEstaVisivel ? "password" : "text";
    botaoAlternarSenha.setAttribute("aria-label", senhaEstaVisivel ? "Mostrar senha" : "Ocultar senha");
    botaoAlternarSenha.setAttribute("aria-pressed", String(!senhaEstaVisivel));
    campoSenha.focus();
  });

  [campoUsuario, campoSenha].forEach((campo) => {
    campo.addEventListener("input", () => {
      campo.closest(".campo-com-icone")?.classList.remove("campo-invalido");
    });
  });

  linkRecuperarSenha.addEventListener("click", (evento) => {
    evento.preventDefault();
    exibirMensagem("A recuperação de senha deverá ser disponibilizada pelo back-end.", "informacao");
  });

  formularioLogin.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    limparValidacao();

    const usuario = campoUsuario.value.trim();
    const senha = campoSenha.value;

    if (!usuario || !senha) {
      if (!usuario) marcarCampoInvalido(campoUsuario);
      if (!senha) marcarCampoInvalido(campoSenha);
      exibirMensagem("Preencha o usuário e a senha para continuar.", "erro");
      (!usuario ? campoUsuario : campoSenha).focus();
      return;
    }

    alterarEstadoEnvio(true);
    exibirMensagem("Autenticando...", "informacao");

    try {
      const resposta = await window.LogMedAPI.fazerLogin({ usuario, senha });

      if (!resposta?.sucesso || !resposta?.usuario) {
        marcarCampoInvalido(campoUsuario);
        marcarCampoInvalido(campoSenha);
        exibirMensagem(
          resposta?.mensagem || resposta?.erro || "Usuário ou senha inválidos.",
          "erro",
        );
        campoSenha.select();
        return;
      }

      const perfil = String(resposta.usuario.perfil || "").toLocaleLowerCase("pt-BR");
      const destino = destinosPorPerfil[perfil];

      if (!destino) {
        exibirMensagem("Seu perfil ainda não possui uma página de destino configurada.", "erro");
        return;
      }

      window.LogMedAuth.salvarSessao(resposta.usuario, resposta.token);
      exibirMensagem("Login realizado com sucesso. Redirecionando...", "sucesso");
      textoBotao.textContent = "Acesso autorizado";
      window.setTimeout(() => window.location.assign(destino), 900);
    } catch (erro) {
      const mensagem = erro.tipo === "rede"
        ? "Não foi possível conectar ao servidor. Verifique se o back-end está disponível."
        : erro.message || "Não foi possível realizar o login.";
      exibirMensagem(mensagem, "erro");
    } finally {
      if (!window.LogMedAuth.usuarioEstaLogado()) alterarEstadoEnvio(false);
    }
  });
})();
