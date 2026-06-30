const formularioCadastro = document.querySelector("#formulario-cadastro");
const campoNomeInstituicao = document.querySelector("#nome-instituicao");
const campoEmail = document.querySelector("#email");
const campoPerfil = document.querySelector("#perfil");
const campoSenha = document.querySelector("#senha");
const campoConfirmacaoSenha = document.querySelector("#confirmacao-senha");
const campoAceitarTermos = document.querySelector("#aceitar-termos");
const botoesAlternarSenha = document.querySelectorAll(".botao-alternar-senha");
const botaoCadastrar = document.querySelector("#botao-cadastrar");
const mensagemFormulario = document.querySelector("#mensagem-formulario");

const dominiosHospitalaresPermitidos = ["hospital.com.br"];
const emailsDeTeste = [
  "admin@hospital.com.br",
  "almoxarife@hospital.com.br",
  "enfermeiro@hospital.com.br",
  "auditor@hospital.com.br",
];

function exibirMensagem(texto, tipo) {
  mensagemFormulario.textContent = texto;
  mensagemFormulario.className = `mensagem-formulario visivel ${tipo}`;
}

function limparValidacao() {
  document.querySelectorAll(".campo-invalido").forEach((campo) => {
    campo.classList.remove("campo-invalido");
  });
  mensagemFormulario.className = "mensagem-formulario";
  mensagemFormulario.textContent = "";
}

function marcarCampoInvalido(campo) {
  const envoltorio = campo.closest(".campo-com-icone, .campo-selecao");
  envoltorio?.classList.add("campo-invalido");
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

botoesAlternarSenha.forEach((botao) => {
  botao.addEventListener("click", () => {
    const campo = document.getElementById(botao.dataset.alvo);
    const senhaEstaVisivel = campo.type === "text";

    campo.type = senhaEstaVisivel ? "password" : "text";
    botao.setAttribute("aria-pressed", String(!senhaEstaVisivel));
    botao.setAttribute("aria-label", senhaEstaVisivel ? "Mostrar senha" : "Ocultar senha");
  });
});

[campoNomeInstituicao, campoEmail, campoPerfil, campoSenha, campoConfirmacaoSenha].forEach((campo) => {
  campo.addEventListener("input", () => {
    campo.closest(".campo-com-icone, .campo-selecao")?.classList.remove("campo-invalido");
  });
});

formularioCadastro.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  limparValidacao();

  const nomeInstituicao = campoNomeInstituicao.value.trim();
  const email = campoEmail.value.trim().toLocaleLowerCase("pt-BR");
  const perfil = campoPerfil.value;
  const senha = campoSenha.value;
  const confirmacaoSenha = campoConfirmacaoSenha.value;

  const camposObrigatorios = [
    [campoNomeInstituicao, nomeInstituicao],
    [campoEmail, email],
    [campoPerfil, perfil],
    [campoSenha, senha],
    [campoConfirmacaoSenha, confirmacaoSenha],
  ];
  const primeiroCampoVazio = camposObrigatorios.find(([, valor]) => !valor);

  if (primeiroCampoVazio) {
    camposObrigatorios.filter(([, valor]) => !valor).forEach(([campo]) => marcarCampoInvalido(campo));
    exibirMensagem("Preencha todos os campos para criar sua conta.", "erro");
    primeiroCampoVazio[0].focus();
    return;
  }

  if (nomeInstituicao.length < 3) {
    marcarCampoInvalido(campoNomeInstituicao);
    exibirMensagem("Informe o nome da instituição hospitalar.", "erro");
    campoNomeInstituicao.focus();
    return;
  }

  if (!emailHospitalarValido(email)) {
    marcarCampoInvalido(campoEmail);
    exibirMensagem("Use um e-mail institucional autorizado, como nome@hospital.com.br.", "erro");
    campoEmail.focus();
    return;
  }

  const contasExistentes = JSON.parse(localStorage.getItem("usuariosCadastrados") || "[]");
  const emailJaCadastrado = emailsDeTeste.includes(email) || contasExistentes.some((conta) => conta.email === email);

  if (emailJaCadastrado) {
    marcarCampoInvalido(campoEmail);
    exibirMensagem("Este e-mail já possui uma conta. Acesse a página de login.", "erro");
    campoEmail.focus();
    return;
  }

  if (senha.length < 8 || !/[A-Za-z]/.test(senha) || !/\d/.test(senha)) {
    marcarCampoInvalido(campoSenha);
    exibirMensagem("A senha deve ter no mínimo 8 caracteres, com letras e números.", "erro");
    campoSenha.focus();
    return;
  }

  if (senha !== confirmacaoSenha) {
    marcarCampoInvalido(campoSenha);
    marcarCampoInvalido(campoConfirmacaoSenha);
    exibirMensagem("As senhas não coincidem.", "erro");
    campoConfirmacaoSenha.focus();
    return;
  }

  if (!campoAceitarTermos.checked) {
    exibirMensagem("Confirme que os dados informados são institucionais.", "erro");
    campoAceitarTermos.focus();
    return;
  }

  // Simulação local: em produção, o cadastro deve ser validado e armazenado pelo back-end.
  const novaConta = {
    nomeInstituicao,
    email,
    perfil,
    senhaHash: await gerarHash(senha),
    criadoEm: new Date().toISOString(),
  };

  contasExistentes.push(novaConta);
  localStorage.setItem("usuariosCadastrados", JSON.stringify(contasExistentes));
  sessionStorage.setItem("emailCadastroRecente", email);

  exibirMensagem("Conta criada com sucesso. Redirecionando para o login...", "sucesso");
  botaoCadastrar.disabled = true;
  botaoCadastrar.querySelector("span").textContent = "Conta criada";

  window.setTimeout(() => {
    window.location.href = "../login/index.html";
  }, 1100);
});
