# Hudson Cicala — Stats 002

App Next.js (Vercel) para as estatísticas individuais de **Hudson Cicala** (FC Cincinnati) em duas partidas novas, com a primeira partida disponível para comparação.

O visual segue o Stats 001: tema escuro SGA, Source Sans 3 e Good Times.

## Partidas

- **Club Ohio**, **Chicago Fire** e **Columbus Crew** — as três partidas na mesma navegação, com setas e botões.
- **Club Ohio** não tem o card Stats.

## O que mudou em relação ao Stats 001

- Card **Stats** nas partidas novas: general passing (accurate e inaccurate), duelos ofensivos e defensivos (won, lost, % won), interceptações com recuperações e a barra de pressure context.
- A aba **Season** compara os números das três partidas.
- **Dispossessed** são os duelos ofensivos perdidos.
- Wrong passes são os passes maus.
- Turnovers passou a se chamar **Lost Plays**, na cor amarelo queimado. O valor é dispossessed + wrong passes.

## Desenvolvimento

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Dados

Edite `data/gameStats.json`. Cada partida tem passes, posses e, nas partidas novas, o bloco `duels`.
