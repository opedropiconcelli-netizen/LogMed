const LogMed = {
  ler(chave) {
    try { return JSON.parse(localStorage.getItem(chave) || "[]"); }
    catch { return []; }
  },
  salvar(chave, dados) { localStorage.setItem(chave, JSON.stringify(dados)); },
  escapar(valor) {
    return String(valor).replace(/[&<>'"]/g, (caractere) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[caractere]);
  },
  data(valor = new Date()) { return new Date(valor).toLocaleDateString("pt-BR"); },
  hora(valor = new Date()) { return new Date(valor).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); },
  toast(texto) {
    document.querySelector(".toast-operacao")?.remove();
    const aviso = document.createElement("div");
    aviso.className = "toast-operacao";
    aviso.setAttribute("role", "status");
    aviso.textContent = texto;
    document.body.append(aviso);
    setTimeout(() => aviso.remove(), 3200);
  },
  modal(titulo, campos, aoSalvar) {
    const fundo = document.createElement("div");
    fundo.className = "modal-operacao";
    fundo.innerHTML = `<section class="janela-modal" role="dialog" aria-modal="true" aria-labelledby="titulo-modal"><header class="cabecalho-modal"><h2 id="titulo-modal">${titulo}</h2><button class="fechar-modal" type="button" aria-label="Fechar">×</button></header><form class="formulario-operacao"><div class="grade-formulario">${campos}</div><div class="acoes-formulario"><button class="botao-secundario cancelar-modal" type="button">Cancelar</button><button class="botao-primario" type="submit">Salvar</button></div></form></section>`;
    const fechar = () => { fundo.remove(); document.body.style.overflow = ""; };
    fundo.querySelector(".fechar-modal").addEventListener("click", fechar);
    fundo.querySelector(".cancelar-modal").addEventListener("click", fechar);
    fundo.addEventListener("click", (evento) => { if (evento.target === fundo) fechar(); });
    fundo.querySelector("form").addEventListener("submit", (evento) => {
      evento.preventDefault();
      if (!evento.currentTarget.reportValidity()) return;
      aoSalvar(Object.fromEntries(new FormData(evento.currentTarget)));
      fechar();
    });
    document.body.append(fundo);
    document.body.style.overflow = "hidden";
    fundo.querySelector("input,select")?.focus();
  },
};

function campo(nome, rotulo, tipo = "text", extra = "", largo = false) {
  return `<div class="campo-formulario${largo ? " largo" : ""}"><label for="op-${nome}">${rotulo}</label><input id="op-${nome}" name="${nome}" type="${tipo}" ${extra} required></div>`;
}

function iniciarEstoque() {
  const botao = document.querySelector("#abrir-cadastro-insumo");
  const corpo = document.querySelector("#corpo-tabela-estoque");
  if (!botao || !corpo) return;
  const renderizar = (item) => {
    const linha = document.createElement("tr");
    linha.innerHTML = `<td>${LogMed.escapar(item.nome)}</td><td>${LogMed.escapar(item.lote)}</td><td>${LogMed.escapar(item.setor)}</td><td>${LogMed.data(item.validade + "T12:00:00")}</td><td>${LogMed.escapar(item.quantidade)} ${LogMed.escapar(item.unidade)}</td><td><span class="status sucesso">Normal</span></td>`;
    corpo.prepend(linha);
  };
  LogMed.ler("logmedInsumos").forEach(renderizar);
  botao.addEventListener("click", () => LogMed.modal("Cadastrar novo insumo", `${campo("nome","Nome do insumo","text",'placeholder="Ex.: Dipirona 500 mg"',true)}${campo("lote","Código do lote","text",'placeholder="Ex.: DIP-2406"')}${campo("validade","Data de validade","date")}${campo("setor","Setor","text",'placeholder="Ex.: Farmácia Central"')}${campo("quantidade","Quantidade","number",'min="1"')}${campo("unidade","Unidade","text",'placeholder="un., cx., fr."')}`, (dados) => {
    dados.criadoEm = new Date().toISOString();
    const itens = LogMed.ler("logmedInsumos"); itens.unshift(dados); LogMed.salvar("logmedInsumos", itens); renderizar(dados);
    const total = document.querySelector("#total-itens"); total.textContent = (1248 + itens.length).toLocaleString("pt-BR");
    LogMed.toast("Insumo cadastrado com sucesso.");
  }));
}

function iniciarTransferencias() {
  const botao = document.querySelector("#abrir-nova-transferencia");
  const lista = document.querySelector("#lista-transferencias");
  if (!botao || !lista) return;
  const renderizar = (movimento) => {
    const item = document.createElement("li");
    item.innerHTML = `<span class="icone-lista">⇄</span><div><h3>${LogMed.escapar(movimento.insumo)} • ${LogMed.escapar(movimento.quantidade)} unidades</h3><p>${LogMed.escapar(movimento.origem)} → ${LogMed.escapar(movimento.destino)} • Responsável: ${LogMed.escapar(movimento.responsavel)}</p></div><time>${LogMed.hora(movimento.criadoEm)}</time>`;
    lista.prepend(item);
  };
  LogMed.ler("logmedMovimentacoes").forEach(renderizar);
  const abrir = () => LogMed.modal("Nova transferência", `${campo("insumo","Insumo","text",'placeholder="Nome do material"',true)}${campo("quantidade","Quantidade","number",'min="1"')}${campo("responsavel","Responsável","text",'placeholder="Nome completo"')}${campo("origem","Setor de origem","text",'placeholder="Ex.: Almoxarifado"')}${campo("destino","Setor de destino","text",'placeholder="Ex.: UTI"')}`, (dados) => {
    dados.criadoEm = new Date().toISOString(); dados.status = "Em trânsito";
    const movimentos = LogMed.ler("logmedMovimentacoes"); movimentos.unshift(dados); LogMed.salvar("logmedMovimentacoes", movimentos); renderizar(dados);
    LogMed.toast("Transferência registrada com sucesso.");
  });
  botao.addEventListener("click", abrir);
  if (new URLSearchParams(location.search).get("nova") === "1") abrir();
}

function iniciarHistorico() {
  const corpo = document.querySelector("#corpo-tabela-historico");
  if (!corpo) return;
  const eventos = [
    ...LogMed.ler("logmedMovimentacoes").map((m) => ({ data:m.criadoEm, evento:"Transferência", item:m.insumo, local:`${m.origem} → ${m.destino}`, responsavel:m.responsavel, status:m.status })),
    ...LogMed.ler("logmedInsumos").map((i) => ({ data:i.criadoEm, evento:"Cadastro de lote", item:i.nome, local:i.setor, responsavel:"Administrador", status:"Registrado" })),
  ].sort((a,b) => new Date(b.data) - new Date(a.data));
  eventos.forEach((evento) => {
    const linha = document.createElement("tr");
    linha.innerHTML = `<td>${LogMed.data(evento.data)} • ${LogMed.hora(evento.data)}</td><td>${evento.evento}</td><td>${LogMed.escapar(evento.item)}</td><td>${LogMed.escapar(evento.local)}</td><td>${LogMed.escapar(evento.responsavel)}</td><td><span class="status info">${LogMed.escapar(evento.status)}</span></td>`;
    corpo.prepend(linha);
  });
  document.querySelector("#exportar-historico")?.addEventListener("click", () => {
    const linhas = [...document.querySelectorAll("table tr")].map((tr) => [...tr.cells].map((td) => `"${td.innerText.replaceAll('"','""')}"`).join(";"));
    const url = URL.createObjectURL(new Blob(["\ufeff" + linhas.join("\n")], { type:"text/csv;charset=utf-8" }));
    const link = Object.assign(document.createElement("a"), { href:url, download:"historico-logmed.csv" }); link.click(); URL.revokeObjectURL(url);
    LogMed.toast("Relatório exportado.");
  });
}

function iniciarAlertas() {
  const cartoes = [...document.querySelectorAll(".alerta-card")];
  const resolvidos = new Set(LogMed.ler("logmedAlertasResolvidos"));
  cartoes.forEach((cartao, indice) => {
    if (resolvidos.has(indice)) cartao.classList.add("resolvido");
    cartao.querySelector("button")?.addEventListener("click", () => {
      cartao.classList.add("resolvido"); resolvidos.add(indice); LogMed.salvar("logmedAlertasResolvidos", [...resolvidos]);
      LogMed.toast("Alerta marcado como revisado.");
    });
  });
  document.querySelector("#marcar-alertas-vistos")?.addEventListener("click", () => {
    cartoes.forEach((cartao, indice) => { cartao.classList.add("resolvido"); resolvidos.add(indice); });
    LogMed.salvar("logmedAlertasResolvidos", [...resolvidos]); LogMed.toast("Todos os alertas foram marcados como vistos.");
  });
}

document.querySelectorAll(".botao-sair").forEach((botao) => botao.addEventListener("click", () => { localStorage.removeItem("usuarioLogado"); localStorage.removeItem("perfilUsuario"); location.href = "../login/index.html"; }));
document.querySelectorAll(".campo-busca").forEach((busca) => busca.addEventListener("input", () => {
  const termo = busca.value.trim().toLocaleLowerCase("pt-BR");
  document.querySelectorAll(".tabela-modulo tbody tr").forEach((linha) => { linha.hidden = !linha.innerText.toLocaleLowerCase("pt-BR").includes(termo); });
}));
iniciarEstoque(); iniciarTransferencias(); iniciarHistorico(); iniciarAlertas();
