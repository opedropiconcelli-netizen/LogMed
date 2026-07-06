(function iniciarAlertas() {
  const listaAlertas = document.querySelector("#lista-alertas");
  const filtroNivel = document.querySelector("#filtro-nivel-alertas");
  const botaoMarcarTodos = document.querySelector("#marcar-alertas-vistos");
  const distribuicao = document.querySelector("#distribuicao-alertas");
  const totalAlertas = document.querySelector("#total-alertas");
  const totalCriticos = document.querySelector("#total-alertas-criticos");
  const totalAtencao = document.querySelector("#total-alertas-atencao");
  const totalNormais = document.querySelector("#total-alertas-normais");
  let alertasCarregados = [];
  const alertasVistos = new Set();

  function normalizarNivel(valor) {
    const nivel = String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");
    if (nivel === "critico") return "critico";
    if (nivel === "atencao" || nivel === "alto" || nivel === "alta") return "atencao";
    return "normal";
  }

  function formatarData(valor) {
    if (!valor) return "—";
    const data = /^\d{4}-\d{2}-\d{2}$/.test(valor)
      ? new Date(`${valor}T00:00:00`)
      : new Date(valor);
    return Number.isNaN(data.getTime()) ? "—" : data.toLocaleDateString("pt-BR");
  }

  function detalhesNivel(nivel) {
    if (nivel === "critico") {
      return { classe: "alerta-vermelho", rotulo: "Crítico", simbolo: "!" };
    }
    if (nivel === "atencao") {
      return { classe: "alerta-amarelo", rotulo: "Atenção", simbolo: "◷" };
    }
    return { classe: "alerta-azul", rotulo: "Normal", simbolo: "✓" };
  }

  function mostrarEstado(mensagem, tipo = "informacao") {
    listaAlertas.replaceChildren();
    const item = document.createElement("li");
    item.className = `estado-integracao ${tipo}`;
    item.textContent = mensagem;
    listaAlertas.append(item);
  }

  function atualizarResumo(alertas) {
    const contar = (nivel) => alertas.filter((alerta) =>
      normalizarNivel(alerta.nivel) === nivel,
    ).length;
    totalAlertas.textContent = alertas.length.toLocaleString("pt-BR");
    totalCriticos.textContent = contar("critico").toLocaleString("pt-BR");
    totalAtencao.textContent = contar("atencao").toLocaleString("pt-BR");
    totalNormais.textContent = contar("normal").toLocaleString("pt-BR");
  }

  function renderizarDistribuicao(alertas) {
    distribuicao.replaceChildren();
    const porAla = new Map();
    alertas.forEach((alerta) => {
      const ala = alerta.ala_nome || "Ala não informada";
      porAla.set(ala, (porAla.get(ala) || 0) + 1);
    });

    if (!porAla.size) {
      const texto = document.createElement("p");
      texto.className = "estado-integracao vazio";
      texto.textContent = "Sem alertas para distribuir.";
      distribuicao.append(texto);
      return;
    }

    [...porAla.entries()]
      .sort((a, b) => b[1] - a[1])
      .forEach(([ala, quantidade]) => {
        const item = document.createElement("div");
        item.className = "dado-lateral";
        const nome = document.createElement("span");
        nome.textContent = ala;
        const total = document.createElement("strong");
        total.textContent = `${quantidade} ${quantidade === 1 ? "alerta" : "alertas"}`;
        item.append(nome, total);
        distribuicao.append(item);
      });
  }

  function renderizarAlertas() {
    const nivelSelecionado = filtroNivel.value;
    const alertasVisiveis = alertasCarregados.filter((alerta) => {
      const id = String(alerta.id);
      return !alertasVistos.has(id)
        && (!nivelSelecionado || normalizarNivel(alerta.nivel) === nivelSelecionado);
    });
    listaAlertas.replaceChildren();

    if (!alertasVisiveis.length) {
      mostrarEstado("Nenhum alerta encontrado.", "vazio");
      return;
    }

    alertasVisiveis.forEach((alerta) => {
      const nivel = normalizarNivel(alerta.nivel);
      const visual = detalhesNivel(nivel);
      const item = document.createElement("li");
      item.className = `alerta-card ${visual.classe}`;

      const sinal = document.createElement("span");
      sinal.className = "sinal-alerta";
      sinal.textContent = visual.simbolo;

      const conteudo = document.createElement("div");
      const rotulo = document.createElement("span");
      rotulo.className = "rotulo-alerta";
      rotulo.textContent = `${visual.rotulo} • Validade`;
      const titulo = document.createElement("h3");
      titulo.textContent = alerta.insumo_nome || "Insumo não informado";
      const detalhes = document.createElement("p");
      const dias = alerta.dias_para_vencer == null
        ? "dias restantes não informados"
        : `${alerta.dias_para_vencer} dias restantes`;
      detalhes.textContent = [
        alerta.ala_nome || "Ala não informada",
        `validade ${formatarData(alerta.validade)}`,
        dias,
        alerta.quantidade == null ? "quantidade não informada" : `quantidade: ${alerta.quantidade}`,
      ].join(" • ");
      conteudo.append(rotulo, titulo, detalhes);

      const botao = document.createElement("button");
      botao.type = "button";
      botao.textContent = "Marcar como visto";
      botao.addEventListener("click", () => {
        alertasVistos.add(String(alerta.id));
        renderizarAlertas();
      });
      item.append(sinal, conteudo, botao);
      listaAlertas.append(item);
    });
  }

  async function carregarAlertas() {
    mostrarEstado("Carregando alertas...");
    botaoMarcarTodos.disabled = true;
    atualizarResumo([]);
    distribuicao.replaceChildren();

    try {
      const resposta = await window.LogMedAPI.buscarAlertasValidade();
      if (!Array.isArray(resposta)) throw new Error("A API não retornou uma lista de alertas.");
      alertasCarregados = resposta;
      alertasVistos.clear();
      atualizarResumo(resposta);
      renderizarDistribuicao(resposta);
      renderizarAlertas();
      botaoMarcarTodos.disabled = resposta.length === 0;
    } catch (erro) {
      alertasCarregados = [];
      console.error("[LogMed Alertas] Falha ao carregar alertas.", erro);
      mostrarEstado(
        "Não foi possível carregar os alertas. Verifique a conexão com o servidor.",
        "erro",
      );
      renderizarDistribuicao([]);
    }
  }

  filtroNivel.addEventListener("change", renderizarAlertas);
  botaoMarcarTodos.addEventListener("click", () => {
    alertasCarregados.forEach((alerta) => alertasVistos.add(String(alerta.id)));
    renderizarAlertas();
  });
  document.querySelector(".botao-sair")?.addEventListener("click", () => {
    window.LogMedAuth.encerrarSessao();
    window.location.assign("../login/index.html");
  });

  carregarAlertas();
})();
