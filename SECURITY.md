# Security policy

Please report suspected vulnerabilities privately using [GitHub private vulnerability reporting](https://github.com/KoangWy/ask-saigon/security/advisories/new). Include reproduction steps, affected versions and impact, and avoid publishing an issue or sending credentials. Maintainers will review reports and coordinate a fix and disclosure when possible.

Provider keys belong only in server environment variables or an untracked local `.env.local`. Never commit them, put them in URLs or add a `NEXT_PUBLIC_` prefix. Rotate a key if it is exposed. The demo uses an in-memory per-process rate limiter, so deployments that require durable or distributed limits need additional infrastructure; see [architecture](docs/architecture.md).
