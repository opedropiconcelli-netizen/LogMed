# Integração do front-end com o back-end

Este documento registra o contrato provisório da API do LogMed. Não foi encontrada, no projeto, uma documentação de API previamente definida pelo Bruno. Se o contrato real for diferente, ele deve ser alinhado antes da publicação.

## Configuração

A URL do back-end fica somente em `shared/js/config-api.js`, na constante `URL_BASE_API`. O valor local atual é `http://127.0.0.1:5000` e deve ser confirmado com o Bruno. Quando o serviço for publicado no Render ou Railway, apenas essa constante deve mudar.

O arquivo de configuração nunca deve conter chave, token secreto, senha ou URL do Supabase.

## Rotas esperadas

### `POST /login`

Body:

```json
{
  "usuario": "nome_ou_email",
  "senha": "senha_digitada"
}
```

Resposta:

```json
{
  "sucesso": true,
  "token": "token_opcional",
  "usuario": {
    "id": 1,
    "nome": "Nome do usuário",
    "perfil": "almoxarife"
  }
}
```

### `GET /alas`

Resposta:

```json
[
  {
    "id": 1,
    "nome": "Almoxarifado Central",
    "tipo": "Almoxarifado"
  }
]
```

### `GET /insumos`

Resposta:

```json
[
  {
    "id": 1,
    "nome": "Dipirona 500 mg",
    "codigo": "MED-001",
    "quantidade": 120,
    "unidade": "ampolas",
    "validade": "2026-07-15",
    "ala_id": 1,
    "ala_nome": "Almoxarifado Central",
    "status": "normal"
  }
]
```

Para preencher automaticamente a transferência, recomenda-se que cada insumo também informe `lote_id`. Enquanto ele não fizer parte da resposta, a tela solicitará o identificador do lote ao usuário.

### `POST /transferencias`

Body:

```json
{
  "ala_origem_id": 1,
  "ala_destino_id": 2,
  "insumo_id": 1,
  "lote_id": 1,
  "quantidade": 5
}
```

Resposta esperada: confirmação HTTP de sucesso (por exemplo, `201`) e, opcionalmente, o registro criado em JSON. Em erros, a API deve retornar uma mensagem em `mensagem`, `erro` ou `message`.

### `GET /movimentacoes`

Aceita provisoriamente os query params `busca`, `data` e `tipo`, quando preenchidos na tela de histórico.

Resposta:

```json
[
  {
    "id": 1,
    "tipo": "transferencia",
    "descricao": "Dipirona 500 mg transferida para UTI Adulto",
    "data_hora": "2026-07-06T10:42:00",
    "responsavel": "Nome do usuário"
  }
]
```

### `GET /alertas-validade`

Resposta:

```json
[
  {
    "id": 1,
    "insumo_nome": "Contraste Iodado",
    "validade": "2026-07-11",
    "dias_para_vencer": 5,
    "quantidade": 18,
    "ala_nome": "UTI Adulto",
    "nivel": "critico"
  }
]
```

## CORS

O Bruno deve liberar CORS exatamente para a origem em que o front-end estiver rodando. No Live Server, origens comuns são:

- `http://127.0.0.1:5500`
- `http://localhost:5500`

No deploy, o domínio público do front-end na Vercel também deve ser incluído nas origens permitidas. Como as requisições usam `credentials: "include"`, o back-end não deve combinar credenciais com origem curinga (`*`).

## Autenticação e proteção de páginas

A sessão usa exclusivamente `sessionStorage` e guarda apenas `id`, `nome`, `perfil` e o `token` opcional. Senhas nunca são persistidas.

As páginas ainda abrem sem back-end para apresentação. Quando for o momento de exigir login, chame no início do JavaScript da página, por exemplo:

```js
window.LogMedAuth.protegerPagina(["almoxarife", "administrador"]);
```

Os perfis permitidos devem ser definidos com o Bruno antes de ativar essa chamada.
