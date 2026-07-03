const MENSAGEM_ERRO_LISTAS = "Não foi possível carregar os dados do servidor. Aguarde a disponibilização do back-end.";
const formulario = document.querySelector("#formulario-transferencia");
const origem = document.querySelector("#ala-origem");
const destino = document.querySelector("#ala-destino");
const seletorInsumo = document.querySelector("#insumo-transferencia");
const mensagem = document.querySelector("#mensagem-transferencia");
const botaoRegistrar = formulario.querySelector('button[type="submit"]');

function preencherSelect(select, itens, textoInicial, criarRotulo) {
  select.replaceChildren(new Option(textoInicial, ""));
  itens.forEach((item) => select.add(new Option(criarRotulo(item), String(item.id))));
  select.disabled = false;
}

function atualizarDestinos() {
  [...destino.options].forEach((opcao) => {
    opcao.disabled = Boolean(origem.value) && opcao.value === origem.value;
  });

  if (destino.value === origem.value) {
    destino.value = "";
  }
}

async function carregarListas() {
  [origem, destino, seletorInsumo].forEach((select) => {
    select.disabled = true;
  });
  origem.replaceChildren(new Option("Carregando alas...", ""));
  destino.replaceChildren(new Option("Carregando alas...", ""));
  seletorInsumo.replaceChildren(new Option("Carregando insumos...", ""));
  botaoRegistrar.disabled = true;
  mensagem.textContent = "Carregando dados logísticos...";
  mensagem.className = "mensagem-transferencia";

  try {
    const [alas, insumos] = await Promise.all([
      window.LogMedAPI.buscarAlas(),
      window.LogMedAPI.buscarInsumos(),
    ]);

    preencherSelect(origem, alas, "Selecione a ala de origem", (ala) => ala.nome);
    preencherSelect(destino, alas, "Selecione a ala de destino", (ala) => ala.nome);
    preencherSelect(seletorInsumo, insumos, "Selecione o insumo", (insumo) => `${insumo.nome} (${insumo.codigo})`);

    const dadosSuficientes = alas.length >= 2 && insumos.length > 0;
    botaoRegistrar.disabled = !dadosSuficientes;
    mensagem.textContent = dadosSuficientes
      ? "Dados carregados. Preencha os campos para validar a transferência."
      : "Não há alas ou insumos suficientes para validar uma transferência.";
  } catch (erro) {
    mensagem.textContent = MENSAGEM_ERRO_LISTAS;
    mensagem.className = "mensagem-transferencia erro";
  }
}

origem.addEventListener("change", atualizarDestinos);
formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  mensagem.className = "mensagem-transferencia";

  if (!formulario.reportValidity()) {
    return;
  }

  if (origem.value === destino.value) {
    mensagem.textContent = "A ala de destino deve ser diferente da ala de origem.";
    mensagem.classList.add("erro");
    destino.focus();
    return;
  }

  mensagem.textContent = "A transferência será integrada à rota do back-end na próxima etapa.";
  mensagem.classList.add("sucesso");
});

document.querySelector("#abrir-nova-transferencia")?.addEventListener("click", () => {
  formulario.scrollIntoView({ behavior: "smooth", block: "center" });
  origem.focus();
});
document.querySelector(".botao-sair")?.addEventListener("click", () => {
  localStorage.removeItem("usuarioLogado");
  localStorage.removeItem("perfilUsuario");
  location.href = "../login/index.html";
});

carregarListas();
