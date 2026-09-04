# Contributing to Rewind

Thanks for helping improve Rewind. This repository contains a reusable TypeScript SDK, a React landing page, and a framework-free storefront demo that exercises the SDK through WebMCP.

## Prerequisites

- Node.js 22 (the version in `.nvmrc`)
- npm
- A WebMCP-capable browser for testing browser tool registration
- An OpenAI API key only when testing the optional built-in shop copilot

## Set up the repository

```bash
git clone https://github.com/AAALI/rewind-webmcp.git
cd rewind-webmcp
nvm use
npm ci
npm test
npm run build
```

Run `npm run dev` for the landing page and storefront. The useful local URLs are:

- `http://127.0.0.1:5173/` — landing page
- `http://127.0.0.1:5173/examples/catalog/` — storefront demo

This mode exposes WebMCP tools to an external browser agent but does not start the optional OpenAI-backed copilot endpoint.

To test the complete local app, copy `.env.example` to `.env`, replace the placeholder `OPENAI_API_KEY`, and run:

```bash
npm run dev:full
```

The full app is served at `http://127.0.0.1:5174`. Never commit `.env` or browser/deployment state; these files are ignored.

## Repository map

| Path | Purpose |
| --- | --- |
| `packages/rewind-sdk/` | Reusable state-history engine and action-history panel |
| `examples/catalog/` | Storefront, WebMCP tool definitions, and integration tests |
| `src/` | React landing page |
| `api/copilot.mjs` | Vercel serverless endpoint for the optional OpenAI planner |
| `netlify/functions/copilot.mjs` | Compatibility adapter for Netlify deployments |
| `scripts/` | Local full-stack server and SDK bundle copy step |
| `integrations/` | Notes for connecting Rewind to real application boundaries |

See [docs/architecture.md](./docs/architecture.md) for the state model and request flow.

## Making changes

- Put reusable recovery behavior in `packages/rewind-sdk`; keep shop-specific rules in `examples/catalog`.
- Register reads with `registerReadTool` and state changes with `registerMutation`. Only registered mutations create commits.
- Keep mutation functions deterministic and return a new state, a useful summary, and effects that a person can understand.
- Validate tool input before changing state. A failed invocation must not create a commit.
- Preserve the distinction between local snapshot restoration and compensating a real external side effect.
- Add or update Vitest coverage for behavioral changes.
- Do not commit generated output (`dist/`, `sdk-dist/`), local credentials, deployment state, recordings, or render scratch files.

Before opening a pull request, run:

```bash
npm test
npm run build
```

Describe the user-visible behavior, the tests you ran, and any limits or migration concerns in the pull request.

## Deployment and releases

Pushes to `main` deploy the site through `.github/workflows/deploy-site.yml`. The repository needs `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` secrets. Production also needs `OPENAI_API_KEY`; `OPENAI_MODEL` is optional.

Publishing a GitHub Release triggers `.github/workflows/publish-sdk.yml`. Configure `NPM_TOKEN` before publishing. Update the SDK version in `packages/rewind-sdk/package.json`, run the verification commands above, and make the release notes explicit about compatibility or state-format changes.

## Reporting security issues

Please do not put credentials or sensitive reproduction data in a public issue. Contact the repository owner privately through their GitHub profile before disclosing a vulnerability.
