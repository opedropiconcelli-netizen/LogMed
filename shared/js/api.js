const URL_BASE_API = "http://127.0.0.1:5000";

async function buscarLista(recurso) {
  try {
    const resposta = await fetch(`${URL_BASE_API}/${recurso}`, {
      headers: { Accept: "application/json" },
    });

    if (!resposta.ok) {
      throw new Error(`A rota /${recurso} respondeu com o status ${resposta.status}.`);
    }

    const dados = await resposta.json();
    if (!Array.isArray(dados)) {
      throw new Error(`A resposta de /${recurso} não é uma lista válida.`);
    }

    return dados;
  } catch (erro) {
    console.error(`Erro ao buscar ${recurso} na API LogMed:`, erro);
    throw erro;
  }
}

async function buscarAlas() {
  return buscarLista("alas");
}

async function buscarInsumos() {
  return buscarLista("insumos");
}

window.LogMedAPI = {
  buscarAlas,
  buscarInsumos,
};
