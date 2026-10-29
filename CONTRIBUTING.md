# Contributing

Thanks for helping improve Ask Saigon. Please follow the [Code of Conduct](CODE_OF_CONDUCT.md); report security issues privately using [SECURITY.md](SECURITY.md).

## Setup and workflow

Use Node.js 22 and pnpm 12.6.0. From the repository root, run `cd web`, `corepack enable`, `pnpm i`, copy `.env.example` to `.env.local`, and run `pnpm dev`. A provider key is optional for the offline demo. See the [README](README.md) for configuration and commands.

Create a descriptive branch from the current default branch, keep changes focused, and use English conventional commit messages such as `fix(chat): clarify empty plan` or `docs: explain data updates`. Open a pull request describing the problem, change and validation; include screenshots for visible changes. Do not commit secrets or generated local test artifacts.

## Data corrections

Use the [data correction template](.github/ISSUE_TEMPLATE/data_correction.md) or submit a pull request with the affected record, correction, source URL and date checked. Follow the [data guide](docs/data.md): use permitted sources, leave uncertain values blank, do not copy Google Maps/Places content, regenerate data with `pnpm build-data`, and review the CSV and generated JSON diff.

## Required checks

From `web/`, run `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build`. Run `pnpm test:e2e` for UI, API or data changes that affect the demo journey; install Playwright Chromium first. If a check cannot run, explain the limitation in the pull request. Live smoke tests use a configured provider and are optional for changes that do not touch live integration.
