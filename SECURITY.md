# Security Policy

Thank you for helping keep `vibe` and its users safe.

`vibe` is a Node.js CLI that installs command and prompt assets into AI runtime directories. Because it interacts with local filesystems, shell-adjacent operations, and remote content fetch, responsible disclosure is important.

## Supported Versions

| Version | Supported |
| ------- | --------- |
| `main` | Yes |
| Latest `0.x` release line | Yes |
| Older `0.x` releases | No |
| Unreleased forks/custom builds | Best effort |

Notes:

- Security fixes are generally applied to `main` first.
- Backports are best effort and may not be available for older releases.

## Reporting a Vulnerability

### Primary path (preferred)

Use GitHub Private Vulnerability Reporting (if enabled):

- https://github.com/genius-wizard-dev/vibe/security/advisories/new

This is the safest path because it keeps exploit details private during investigation.

### Fallback path (if private advisory is unavailable)

If private reporting is unavailable, open a public issue with minimal details and request a private channel:

- https://github.com/genius-wizard-dev/vibe/issues

Suggested title:

- `Security report: request private disclosure channel`

Do not post exploit payloads, full reproduction details, credentials, or sensitive logs in a public issue.

## What to Include

Please include:

- affected version/commit
- OS and Node.js version
- vulnerability type and impact
- minimal reproduction (private channel)
- proof of concept (private channel)
- preconditions and attack surface
- suggested mitigation (if known)

## Response Targets (best effort)

- Acknowledgment: within 3 business days
- Initial triage and severity: within 7 business days
- Fix or mitigation target:
  - Critical/High: 14-30 days
  - Medium: 30-60 days
  - Low: 60-90 days or next planned release

These are targets, not guarantees.

## Project-Specific Security Scope

Please prioritize reports in these areas:

- command injection risks from untrusted input
- path traversal or unsafe path normalization
- symlink handling and unintended file overwrite behavior
- remote content fetch trust boundaries and integrity assumptions
- accidental secret exposure in repository or logs

## Coordinated Disclosure Expectations

- Report in good faith and avoid public exploit release before patch/mitigation.
- Give maintainers a reasonable remediation window.
- Coordinate disclosure timing when possible.

## Security Best Practices for Contributors

- Validate and sanitize external inputs (flags, env vars, file paths, fetched content)
- Avoid shell interpolation patterns for user-controlled values
- Constrain writes to expected directories
- Handle symlink edge cases defensively
- Never commit secrets (`.env`, credentials, tokens)
- Keep dependencies updated and review advisories
- Add regression tests/checks for security-sensitive code paths where possible

Thanks for practicing responsible disclosure.
