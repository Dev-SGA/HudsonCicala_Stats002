# Hudson Cicala — Stats 002

App Next.js (Vercel) para as estatísticas individuais de **Hudson Cicala** (FC Cincinnati) em duas partidas novas, com a primeira partida disponível para comparação.

O visual segue o Stats 001: tema escuro SGA, Source Sans 3 e Good Times.

## Partidas

- **Chicago Fire** e **Columbus Crew** — navegação entre as duas, com setas e botões.
- **First match** — a partida do Stats 001, para consulta no mesmo relatório.
- **Trends** — gráficos de linha com a avaliação contínua dos três jogos.

## O que mudou em relação ao Stats 001

- Card **Duels**, com ações, boas, más e o restante neutro.
- Lost balls são os duelos ofensivos perdidos.
- Wrong passes são os passes maus.
- Turnovers passou a se chamar **Lost Plays**, na cor amarelo queimado. O valor é lost balls + wrong passes.

## Desenvolvimento

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Dados

Edite `data/gameStats.json`. Cada partida tem passes, posses e, nas partidas novas, o bloco `duels`.
