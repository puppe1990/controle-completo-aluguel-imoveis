# Controle Completo de Aluguel de Imoveis

App desktop feito com Neutralinojs, HTML, Tailwind CSS, JavaScript e SQLite para controlar proprietarios, inquilinos, imoveis, contratos e contas a receber.

## Stack

- `Neutralinojs`: shell desktop leve com API nativa e extensoes.
- `Tailwind CSS`: camada visual rapida, sem framework frontend adicional.
- `SQLite + better-sqlite3`: persistencia local simples e confiavel.
- `Vitest`: TDD nas regras de negocio e repositorio.

## Rodando

```bash
npm install
npm run neutralino:update
npm test
npm run dev
```

No desenvolvimento:

- alteracoes em `resources/` fazem hot reload via `neu run`
- alteracoes em `src/`, `extensions/`, `neutralino.config.json` e `package.json` reiniciam o app automaticamente

## O que o app cobre

- Cadastro de proprietarios
- Cadastro de inquilinos
- Cadastro de imoveis
- Criacao de contratos com parcelas automaticas
- Contas a receber com registro de pagamento
- Dashboard geral
- Relatorio por proprietario
- Seed de dados de exemplo

## Seed local de exemplo

A opcao de popular a base com dados de exemplo fica escondida por padrao.
Para habilitar no ambiente local, rode o app com a variavel `IMOBILIARIA_ENABLE_DEMO_SEED=true`.

```bash
IMOBILIARIA_ENABLE_DEMO_SEED=true npm run dev
```

## Build

```bash
npm run build
```

Os binarios e recursos gerados pelo `neu build` ficam no diretorio `dist/`.
