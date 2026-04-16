# NBLCAS — NBL Contract And Statistics 
![NBLCAS](nblcas-longlogo.png)
[View Website](https://nblcas.pages.dev/)

![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Cloudflare Pages](https://img.shields.io/badge/Cloudflare%20Pages-F38020?style=flat&logo=cloudflare&logoColor=white)
![Last Commit](https://img.shields.io/badge/Last%20Commit-April%202026-blue)
![Release](https://img.shields.io/badge/Release-v1.0-brightgreen)

---

A fan-made web app tracking Australian/NZ NBL player contracts and advanced statistics. Built with plain HTML, CSS, and vanilla JavaScript — no build step, no dependencies, no framework.

![Demo](demo.gif)

---

## Pages

| Page | Description |
|---|---|
| **Home** | Landing page with links to Contracts and Stats |
| **Contracts** | Live NBL player contract tracker, sourced from Google Sheets |
| **Contract Types** | Guide to NBL player designations (Local, Import, Next Star, SRP, DEV) and contract options |
| **Player Stats** | Historical player averages database powered by Tableau |
| **Stats Glossary** | Searchable definitions for all 21 advanced statistics |

---

## Features

### Contracts tracker
- **10 team tabs** — switch between all NBL clubs instantly; data is cached after first load
- **Global search** — search across all 10 teams simultaneously with the "All teams" toggle
- **Per-team search** — filter players by name, contract detail, or position within the selected team
- **Player type filter** — filter by Local, Import, Next Star, SRP, or DEV
- **Sortable columns** — click any column header to sort ascending / descending
- **Player modal** — click a player's name for a full contract breakdown across current and historical seasons
- **Position breakdown** — pill chips under the team header showing roster composition by position
- **Contract Table Export** — download the current filtered table as a `.csv` file (works in both single-team and all-teams mode)
- **Status badges** — colour-coded player type badges and contract status dots (active, free agent, option year)

### General
- **Dark / light mode** — toggle persisted to `localStorage`; defaults to dark
- **Responsive layout** — works on desktop and mobile
- **No JavaScript framework** — every page is a self-contained HTML file

---

## Tech stack

| Layer | Choice |
|---|---|
| Markup | HTML5 |
| Styles | Plain CSS (custom properties, no Tailwind) |
| Scripts | Vanilla JavaScript (ES2020+) |
| Fonts | Inter + Space Grotesk via Google Fonts |
| Contract data | Google Sheets CSV (fetched at runtime via `fetch`) |
| Stats data | Tableau Public embed |
| Hosting | Cloudflare Pages |

---

## Deploying to Cloudflare Pages

The entire site lives in the `static-site 2/` directory. There is no build step.

1. Push this repository to GitHub.
2. In the [Cloudflare Pages dashboard](https://pages.cloudflare.com/), create a new project and connect your GitHub repo.
3. Set the **build output directory** to `static-site 2` and leave the build command blank.
4. Deploy — Cloudflare will serve the files directly.

On every subsequent push to `main`, Cloudflare Pages will automatically redeploy.

---

## Running locally

```bash
python3 -m http.server 8080 --directory static-site 2
```

Then open [http://localhost:8080](http://localhost:8080).

---

## Project structure

```
static-site 2/
├── index.html           # Home page
├── contracts.html       # Contract tracker
├── contracts-info.html  # Contract types guide
├── stats.html           # Tableau stats embed
├── stats-info.html      # Stats glossary
├── contracts.js         # All contracts page logic (fetch, parse, render, search, export)
├── style.css            # Global styles and theme variables
└── nblcas-logo.png      # Site favicon and footer logo
```

---

## Data sources

- **Contract data** — [SpatialJam Contract Tracker](https://spatialjam.com/contracttracker), served via Google Sheets CSV
- **Player statistics** — [Tableau Public](https://public.tableau.com/views/HistoricalStatsDatabaseNEWlocalCSV/PlayerAverages)

---

## License

[MIT](LICENSE) © 2026 rigrotto

---

## Disclaimer

NBLCAS is not affiliated with the National Basketball League.
