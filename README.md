# google-doc-to-pdf-workflow

Publish a Google Doc as a PDF onto a Next.js site with one click from the Docs
menu.

```
Google Doc ──"PDF Publish" menu (Apps Script)
   │  POST /repos/:owner/:repo/dispatches   (repository_dispatch)
   ▼
GitHub Action (.github/workflows/export-pdf.yml)
   │  Drive API files.export → PDF
   ▼
public/document.pdf ──▶ next build (static export) ──▶ GitHub Pages
```

The PDF is **not** committed — the Action exports it, builds the static site,
and deploys `out/` straight to GitHub Pages in the same run.

## Repo layout

| Path | Purpose |
| --- | --- |
| `app/` | Barebones Next.js (App Router) app that links to the PDF |
| `public/document.pdf` | The exported PDF (written by CI; gitignored locally) |
| `scripts/export-pdf.mjs` | Drive API export → writes the PDF |
| `.github/workflows/export-pdf.yml` | The Action triggered from Docs |
| `apps-script/Code.gs` | The Docs menu that triggers the Action |

## Local dev

```bash
pnpm install
pnpm dev              # http://localhost:3000
# optional: export a PDF locally (needs the two env vars below)
GOOGLE_DOC_ID=... GDRIVE_SA_KEY="$(cat service-account.json)" pnpm run export:pdf
```

## One-time setup

### 1. Google service account (for the Drive export)

1. In Google Cloud Console, create a service account and a JSON key.
2. Enable the **Google Drive API** for that project.
3. Share the target Doc with the service account's email (Viewer is enough).

### 2. GitHub repo secrets & variables

| Kind | Name | Value |
| --- | --- | --- |
| Secret | `GDRIVE_SA_KEY` | Full contents of the service-account JSON key |
| Variable | `GOOGLE_DOC_ID` | Default Doc id (overridden per-trigger by Apps Script) |

Also enable Pages: **Settings → Pages → Build and deployment → Source: GitHub
Actions**.

### 3. Apps Script (in the Doc)

The Apps Script lives in `apps-script/` and is pushed to the Doc-bound project
with [clasp](https://github.com/google/clasp) (`.clasp.json` holds the script
id). To deploy code changes:

```bash
pnpm add -g @google/clasp   # or: npm i -g @google/clasp
clasp login                 # one-time OAuth
pnpm run script:push        # clasp push -f → uploads apps-script/ to the Doc
```

Then, in the Doc's Apps Script project:

1. **Project Settings → Script Properties** → add `GITHUB_TOKEN`, a
   fine-grained PAT with **Contents: Read and write** on this repo. That is the
   minimal fine-grained scope that can call `repository_dispatch` — GitHub files
   that endpoint under the Contents (write) permission. Also add `GITHUB_OWNER`,
   `GITHUB_REPO`, and `EVENT_TYPE` (see the header in `apps-script/Code.gs`).
2. Reload the Doc, then use **PDF Publish → Publish to site**.

> `pnpm run script:pull` fetches the remote back; note clasp pulls server files
> as `.js`, so it'll create `Code.js` next to `Code.gs` — don't keep both.

## How the Doc id flows

Apps Script sends the active Doc's id in `client_payload.docId`, so the workflow
uses that; if the workflow is run manually (`workflow_dispatch`), it falls back
to the `GOOGLE_DOC_ID` repo variable.

## Deploy

The workflow builds a static export (`output: 'export'` → `out/`) and deploys it
to **GitHub Pages** via `actions/deploy-pages` — no commit, no external tokens.
Because project Pages are served from `/<repo>`, CI sets `NEXT_PUBLIC_BASE_PATH`
to the repo name so asset and PDF URLs resolve; local dev leaves it empty.

To switch hosts (e.g. Vercel), drop `output: 'export'` and replace the
`configure-pages`/`upload-pages-artifact`/`deploy` steps with your deploy step
(e.g. `npx vercel deploy --prod --token=…`), uploading the built dir incl. the
freshly-exported PDF.
