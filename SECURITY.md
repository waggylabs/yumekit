# Security Policy

## Supported Versions

Only the latest release of YumeKit receives security updates.

| Version | Supported |
| ------- | --------- |
| Latest  | Yes       |
| Older   | No        |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

To report a vulnerability, use GitHub's private [Security Advisory](https://github.com/waggylabs/yumekit/security/advisories/new) feature. This allows for coordinated disclosure before a fix is published.

Please include as much of the following as possible:

- A description of the vulnerability and its potential impact
- Steps to reproduce or a proof-of-concept
- The affected version(s)
- Any suggested mitigations

You can expect an acknowledgement within **72 hours** and a status update within **7 days**. If a fix is warranted, we aim to release a patch as soon as reasonably possible.

## Scope

YumeKit is a client-side UI component library. Security issues most likely to be in scope include:

- Cross-site scripting (XSS) via unsafe HTML rendering in components
- Prototype pollution
- Dependency vulnerabilities with a clear exploit path

Issues in `devDependencies` that do not affect published packages are generally out of scope.
