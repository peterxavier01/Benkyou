# Security Policy

Benkyou is a self-hostable learning workspace. Security reports help protect
learners, self-hosters, and maintainers.

## Reporting a Vulnerability

Please do not report security vulnerabilities in public issues or discussions.

Send reports privately to `security@benkyou.app`.

Include as much detail as you can:

- Affected feature, route, package, or deployment path.
- Steps to reproduce.
- Impact and likely severity.
- Whether the issue requires authentication.
- Any proof-of-concept details, logs, screenshots, or patches.

We will acknowledge reports as soon as possible and follow up with next steps
after triage.

## Disclosure

Please give maintainers a reasonable opportunity to investigate and fix the
issue before public disclosure. We will coordinate disclosure timing with the
reporter when a confirmed vulnerability affects users or self-hosters.

## Supported Versions

Benkyou is currently in an MVP/open beta phase. Security fixes are focused on
the default branch and the latest published release, when releases exist.

Older commits, forks, and modified self-hosted deployments may not receive
individual security backports.

## Out of Scope

The following are usually out of scope unless they demonstrate a broader
security issue:

- Reports requiring access to a maintainer's local machine.
- Denial-of-service reports based only on high traffic volume.
- Vulnerabilities in third-party services outside Benkyou's control.
- Missing security headers without a concrete exploit path.
