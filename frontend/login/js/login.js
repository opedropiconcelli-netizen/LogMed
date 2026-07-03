const formularioLogin = document.querySelector("#formulario-login");
const campoUsuario = document.querySelector("#usuario");
const campoSenha = document.querySelector("#senha");
const campoLembrarAcesso = document.querySelector("#lembrar-acesso");
const botaoAlternarSenha = document.querySelector("#botao-alternar-senha");
const botaoEntrar = document.querySelector("#botao-entrar");
const mensagemFormulario = document.querySelector("#mensagem-formulario");
const linkRecuperarSenha = document.querySelector("#link-recuperar-senha");

const dominiosHospitalaresPermitidos = ["hospital.com.br"];

const destinosPorPerfil = {
  administrador: "../dashboard/index.html",
  almoxarife: "../estoque/index.html",
  enfermeiro: "../transferencia/index.html",
  auditor: "../alertas/index.html",
};

const usuariosDeTeste = {
  "admin@hospital.com.br": {
    senha: "Admin@123",
    perfil: "administrador",
    hospital: "Hospital Central LogMed",
  },
  "almoxarife@hospital.com.br": { senha: "123456", perfil: "almoxarife" },
  "enfermeiro@hospital.com.br": { senha: "123456", perfil: "enfermeiro" },
  "auditor@hospital.com.br": { senha: "123456", perfil: "auditor" },
};

function exibirMensagem(texto, tipo) {
  mensagemFormulario.textContent = texto;
  mensagemFormulario.className = `mensagem-formulario visivel ${tipo}`;
}

function limparValidacao() {
  campoUsuario.closest(".campo-com-icone").classList.remove("campo-invalido");
  campoSenha.closest(".campo-com-icone").classList.remove("campo-invalido");
  mensagemFormulario.className = "mensagem-formulario";
  mensagemFormulario.textContent = "";
}

function marcarCampoInvalido(campo) {
  campo.closest(".campo-com-icone").classList.add("campo-invalido");
}

function emailHospitalarValido(email) {
  const formatoDeEmailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const partesDoEmail = email.split("@");

  return (
    formatoDeEmailValido.test(email) &&
    partesDoEmail.length === 2 &&
    dominiosHospitalaresPermitidos.includes(partesDoEmail[1])
  );
}

async function gerarHash(texto) {
  const dados = new TextEncoder().encode(texto);
  const hash = await crypto.subtle.digest("SHA-256", dados);

  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function buscarContaCadastrada(email) {
  const contas = JSON.parse(localStorage.getItem("usuariosCadastrados") || "[]");
  return contas.find((conta) => conta.email === email);
}

// Alterna a visibilidade da senha mantendo o foco no campo.
botaoAlternarSenha.addEventListener("click", () => {
  const senhaEstaVisivel = campoSenha.type === "text";

  campoSenha.type = senhaEstaVisivel ? "password" : "text";
  botaoAlternarSenha.setAttribute("aria-label", senhaEstaVisivel ? "Mostrar senha" : "Ocultar senha");
  botaoAlternarSenha.setAttribute("aria-pressed", String(!senhaEstaVisivel));
  campoSenha.focus();
});

[campoUsuario, campoSenha].forEach((campo) => {
  campo.addEventListener("input", () => {
    campo.closest(".campo-com-icone").classList.remove("campo-invalido");
  });
});

linkRecuperarSenha.addEventListener("click", (evento) => {
  evento.preventDefault();
  exibirMensagem("A recuperação de senha estará disponível em breve.", "informacao");
});

formularioLogin.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  limparValidacao();

  const usuario = campoUsuario.value.trim().toLocaleLowerCase("pt-BR");
  const senha = campoSenha.value;

  if (!usuario || !senha) {
    if (!usuario) marcarCampoInvalido(campoUsuario);
    if (!senha) marcarCampoInvalido(campoSenha);
    exibirMensagem("Preencha o e-mail institucional e a senha para continuar.", "erro");
    (!usuario ? campoUsuario : campoSenha).focus();
    return;
  }

  if (!emailHospitalarValido(usuario)) {
    marcarCampoInvalido(campoUsuario);
    exibirMensagem("Use um e-mail institucional autorizado, como nome@hospital.com.br.", "erro");
    campoUsuario.focus();
    return;
  }

  const usuarioDeTeste = usuariosDeTeste[usuario];
  const contaCadastrada = buscarContaCadastrada(usuario);
  let perfilAutorizado = null;

  if (usuarioDeTeste && usuarioDeTeste.senha === senha) {
    perfilAutorizado = usuarioDeTeste.perfil;
  } else if (contaCadastrada && contaCadastrada.senhaHash === (await gerarHash(senha))) {
    perfilAutorizado = contaCadastrada.perfil;
  }

  if (!perfilAutorizado) {
    marcarCampoInvalido(campoUsuario);
    marcarCampoInvalido(campoSenha);
    exibirMensagem("E-mail ou senha inválidos. Verifique os dados e tente novamente.", "erro");
    campoSenha.select();
    return;
  }

  localStorage.setItem("usuarioLogado", usuario);
  localStorage.setItem("perfilUsuario", perfilAutorizado);
  localStorage.setItem(
    "hospitalUsuario",
    usuarioDeTeste?.hospital || contaCadastrada?.nomeInstituicao || "Hospital não informado",
  );

  if (campoLembrarAcesso.checked) {
    localStorage.setItem("emailLembrado", usuario);
  } else {
    localStorage.removeItem("emailLembrado");
  }

  exibirMensagem("Acesso autorizado. Redirecionando...", "sucesso");
  botaoEntrar.disabled = true;
  botaoEntrar.querySelector("span").textContent = "Acesso autorizado";

  window.setTimeout(() => {
    window.location.href = destinosPorPerfil[perfilAutorizado];
  }, 900);
});

const emailLembrado = localStorage.getItem("emailLembrado");
const emailCadastroRecente = sessionStorage.getItem("emailCadastroRecente");

if (emailCadastroRecente) {
  campoUsuario.value = emailCadastroRecente;
  sessionStorage.removeItem("emailCadastroRecente");
  exibirMensagem("Conta criada com sucesso. Entre com sua nova senha.", "sucesso");
} else if (emailLembrado) {
  campoUsuario.value = emailLembrado;
  campoLembrarAcesso.checked = true;
}
