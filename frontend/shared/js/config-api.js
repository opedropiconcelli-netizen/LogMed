// Confirme esta URL com o Bruno quando ele iniciar o servidor local.
// Quando o back-end for publicado no Render ou Railway, altere SOMENTE URL_BASE_API.
// Nunca coloque chaves, tokens secretos, senhas ou a URL do Supabase neste arquivo.
const URL_BASE_API = "http://127.0.0.1:5000";

const ROTAS_API = {
  login: "/login",
  alas: "/alas",
  insumos: "/insumos",
  transferencias: "/transferencias",
  movimentacoes: "/movimentacoes",
  alertasValidade: "/alertas-validade",
};

window.LogMedConfig = {
  URL_BASE_API,
  ROTAS_API,
};
