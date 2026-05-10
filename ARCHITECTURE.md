# Arquitetura

## Estrutura

- `resources/`: frontend desktop em HTML, Tailwind e JavaScript.
- `extensions/sqlite-bridge/`: extensao Neutralino que recebe comandos da UI e responde com snapshots atualizados.
- `src/domain/`: regras puras de negocio, hoje focadas na geracao de contas a receber.
- `src/backend/`: repositorio SQLite e consultas para dashboard.
- `tests/`: testes de dominio e persistencia.

## Fluxo

1. A UI inicializa o Neutralino.
2. A UI envia comandos para a extensao via `Neutralino.extensions.dispatch`.
3. A extensao executa a operacao no SQLite.
4. A extensao responde com um snapshot consolidado do sistema.
5. A UI redesenha dashboard, listas e tabelas com o snapshot retornado.

## Decisoes

- Snapshot unico apos cada mutacao: simplifica a UI e reduz divergencia entre listas e cards.
- Regras de parcelas em modulo separado: permite TDD sem depender do banco.
- SQLite local em `.data/imobiliaria.sqlite`: persistencia simples para desktop sem servidor externo.
