# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public issue. Instead, send a private report to the repository maintainers via GitHub's security advisory feature:

https://github.com/ShadowRahlM/shadowchess/security/advisories/new

You should receive a response within 48 hours. If not, follow up to ensure receipt.

## Scope

- Cross-site scripting (XSS) via imported PGN or FEN data
- Engine sandbox escape (WASM or WebSocket paths)
- Unauthorized API access or data exposure

## Out of Scope

- Rate limiting on external Lichess APIs (those are Lichess's domain)
- Missing mobile responsiveness
- Feature gaps listed in FEATURES.md
