# FlameWise — Space Fire Evidence Explorer

A working, dependency-free research dashboard for NASA Space Apps’ **Flame in Freefall** challenge. It connects research questions to investigations, experimental conditions, cited summaries and explicit evidence gaps.

## Open immediately

Double-click **FlameWise.html** in your browser. This self-contained edition works without a server or internet for search, comparison, charts, scenarios, retrieval answers and exports. NASA source links require internet. Offline answers are explicitly labeled **Evidence retrieval**, not live AI.

## Run the full server

Requires Node.js 20.18+ (tested on 24.16) and Python 3 for CSV regeneration. There are no npm dependencies and no install step.

```sh
cd flamewise
npm run dev
```

Open http://localhost:3000. For another port, set `PORT=3001` in `.env`.

```sh
npm run check
npm run build
npm test
```

Build produces a Cloudflare Worker at `dist/server/index.js` and regenerates `FlameWise.html`. The same API handler powers Node, Worker and offline modes. No database is required for this read-only curated catalogue.

## What works

- Ten entries covering BASS/BASS-II, Saffire I–III, SAME/SAME-R, FLEX, ACME/BRE and DAFT.
- Explainable rarity-weighted keyword/synonym ranking with theme/fuel filters, separate condition overlap and data coverage.
- Side-by-side comparison of up to three investigations.
- Seven report-verified Saffire condition records, chart and clickable test details.
- Full downloaded BASS-II CSV: **129 rows** with all raw fields, source SHA256 and quality flags. NASA’s count of 130 includes one blank trailing row; all 129 nonempty records match the CSV.
- Scenario conditions and explicit oxygen/airflow/pressure/gravity/material gaps.
- Source-backed deterministic answers, test lookup and numerical CO query.
- Optional server-side Gemini, OpenAI or Anthropic synthesis with source-ID validation and transparent fallback.
- Filtered CSV, JSON with units/citations, answer export and global verified-record export.
- All ten challenge resources linked and audited, with history and Earth applications separated from experimental data.
- Keyboard controls, responsive layout, accessible table alternatives to charts, error/empty states.

## Optional live AI

Copy `.env.example` to `.env`, choose `AI_PROVIDER=gemini`, `openai` or `anthropic`, and set only the corresponding key. Set `AI_MODEL` to a model available to that account. Default integrations target `gpt-4.1-mini` and `claude-sonnet-4-20250514`; provider availability must be confirmed with your account. Restart the server after configuration.

Never put a real key in browser code, the offline HTML, Git, or chat. Hosted keys belong in the hosting platform’s server-side secret settings. Offline mode intentionally has no API keys and no live model calls.

The app sends only the entered question, curated evidence and included test records to the selected provider. Unknown questions and operational safety requests abstain. Provider errors and invalid citation IDs return labeled evidence retrieval. Source-ID validation does **not** prove that every model statement is entailed: human review remains necessary.

## Data and reproducibility

`data/bass2-source.csv` is the downloaded NASA file, preserved byte-for-byte. Regenerate normalized records with:

```sh
python3 scripts/ingest_bass2.py
npm run build
npm test
```

`data/ingestion-audit.json` records SHA256, row count and the 129/130 discrepancy. `data/bass2-generated.mjs` preserves each original field alongside normalized values and CSV row provenance. It does not repair suspicious data or infer unreported airflow units. Nonnumeric sensor strings become null in normalized numeric fields while raw values remain available.

`data/catalogue.mjs` contains curated investigation summaries and Saffire records. Source locations are in each record. The small Saffire subset is not the entire experimental programme.

## Architecture

```
public/             UI, styles and browser interactions
src/core.mjs        Ranking, evidence retrieval, gaps, export
src/server.mjs      API, provider integration and citation validation
data/               Curated catalogue, original CSV, generated records, audit
scripts/dev.mjs     Local Node server
scripts/build.mjs   Dependency-free Worker bundler
scripts/offline.mjs Standalone HTML builder
tests/              Automated behavior and API checks
docs/               Demo, limitations and challenge alignment
```

API contracts:

| Route | Behavior |
|---|---|
| GET /api/health | Readiness and AI configuration status; no secrets |
| GET /api/catalogue | Investigations, tests, sources, audit date |
| GET /api/search?q=&category=&fuel= | Ranked investigations and matching reasons |
| POST /api/scenario | JSON: q, category, gravity, material, oxygen, pressure, airflow |
| POST /api/ask | JSON: question; optional retrievalOnly |
| GET /api/export?format=json&preview=false | Records, units and citation manifest |
| GET /api/export?format=csv&preview=true | CSV; preview includes calibration-pending source rows |

## Scientific boundaries

- Microgravity evidence does not directly validate lunar/Martian partial gravity.
- A matching oxygen value does not establish safety; pressure, geometry, scale and ventilation also matter.
- No fire-risk probabilities, universal safe-material scores, operational doses or trained predictive model.
- Investigation objectives and hypotheses are not presented as results.
- Full BASS-II calibration interpretation and large-report review are pending. Unusual readings stay flagged.
- SAME includes selected 2013 report conclusions and FLEX includes a NASA cool-flame finding; their individual numerical datasets are not ingested.
- The introductory video could not be fetched. It is linked, not falsely claimed as reviewed.
- No automatic PSI synchronization.

## Deployment status and portability

The build is ready for Cloudflare Worker-compatible hosting. A private Site was created with the project ID recorded in `.openai/hosting.json`. Publication from the authoring environment was blocked by DNS resolution to the source Git host. No live deployment is claimed.

For an independent Cloudflare deployment, configure a Worker using `dist/server/index.js` as its entrypoint and server-side provider secrets if desired. Do not change Site sharing or claim a reserved URL is live before successful deployment.

## Verification status

53 automated tests passed in the final suite, covering ranking, preservation of questionable values, filtering, scenario gaps, abstention, exports, API validation, provider failure, invalid citations and the built Worker. The suite includes CSV ingestion/provenance and offline application-flow checks. Automated provider checks use mocks; the user subsequently confirmed live Gemini synthesis in the app. Local HTTP preview was blocked by the execution sandbox; automated browser rendering could not be completed due file-URL restrictions. These are verification limitations, not a claim that the UI was visually tested.

## Attribution

Independent hackathon project; not endorsed by NASA and not operational fire-safety certification. Cite original investigations and reports. BASS-II: DOI **10.60555/4qc4-de67**, PSI-25 Version 4, CC0-1.0 as shown by the repository. See Sources & Context in the app for all source links and their access status.

## November 15 implementation update

- Specific research terms outrank generic fire/combustion vocabulary. Scenario materials and verified condition ranges contribute separate matching reasons; gravity mismatches remain explicit.
- Research threshold questions are allowed; requests for unsupported operational safety conclusions still abstain.
- Selected source-located paraphrases cover BASS-II, Saffire, SAME and FLEX. Search, investigation details and assistant answers expose these cards. They are **not verbatim excerpts or a complete document index**.
- Report-verified Saffire fabric spread rates and burn durations have page references, an outcome chart and numerical retrieval answers. Each coincident condition record has its own chart button.
- Data Laboratory compares up to three individual tests. Form inputs persist across navigation within the current session.
- AI synthesis rejects uncited paragraphs, unknown sources and inconsistent citation lists. These structural checks do not prove factual entailment.
- Local page-separated document text can be indexed with `python3 scripts/ingest_documents.py manifest.json`; see its docstring. It preserves text-file hashes and page numbers, only accepts registered sources, and replaces the extracted index from the supplied manifest. Run the build afterward. No full documents have been imported yet.

Verified: syntax checks, Worker/offline build and 53 automated tests. Provider responses are mocked in tests; no paid call was made. Gemini was subsequently configured and the user verified HTTP 200 and cited AI synthesis locally.

Blocked checks: local HTTP listening denied (`EPERM`); offline file URL rejected by browser security policy. Visual/mobile QA and demo capture are unverified. Publication attempted using the existing Site, but source push failed because `git.chatgpt-team.site` could not resolve. No live deployment is claimed.

Scientific work remaining: full BASS-II report/table review (web retrieval rejected the 49 MB PDF), sensor interpretation and airflow units, additional SAME/FLEX numerical datasets. Selected summaries are not substitutes for those datasets.

## Gemini setup

Gemini is supported server-side without dependencies. Create a key in Google AI Studio, then set `AI_PROVIDER=gemini`, `AI_MODEL=gemini-3.5-flash-lite`, and `GEMINI_API_KEY` in `.env`. Restart the server after changing environment settings. Free-tier access and quotas depend on Google's current model/project eligibility; paid-tier keys may incur charges. Quota errors fall back to evidence retrieval. Free-tier data may be used to improve Google products. No live Gemini request has been verified.

## Data audit — November 15

See [the complete data verification report](docs/DATA_VERIFICATION.md). All 129 BASS-II records match NASA’s live table after CSV quote decoding and whitespace normalization. The extra displayed entry is blank, resolving 129/130. Seven Saffire records were checked against the report; three missing fabric thicknesses were filled from Table I. SAME conclusions are now labeled as combined-flight evidence. Run `npm run verify:data` for the complete local consistency audit. Transcription is verified; independent sensor interpretation and unavailable calibration documentation remain unresolved.

## UI verification update

AI status now reflects successful synthesis and later fallback requests within the current session; deliberate evidence-only safety answers do not mark the connection failed. Inline citations render source titles as links, restricted to known cited sources and HTTP(S) destinations. Model text remains escaped.

Browser verification completed on localhost:3001: live Gemini synthesis updated the status and rendered source links; 390px mobile assistant/laboratory/scenario pages had no horizontal document overflow; S2-5/S2-6 comparison displayed expected measurements; CSV and JSON downloaded successfully and their seven-record content, units and citations were checked. Browser viewport override was reset afterward. Deployment source-host DNS remains blocked.
