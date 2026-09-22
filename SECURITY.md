# Security

Docent runs inside other people's websites, next to their users' sessions. Reports are taken
seriously and are welcome.

## Supported versions

Fixes go into the latest release. While Docent is on 0.x, only the most recent minor is supported;
there are no backports to older ones.

## Reporting a vulnerability

**Please do not open a public issue for a vulnerability.**

Use GitHub's private vulnerability reporting: go to the repository's **Security** tab and choose
**Report a vulnerability**. It creates a private thread with the maintainer.

If that is unavailable to you, open a public issue that says only that you have a security report
and asks for a private channel — no details, no reproduction.

Helpful in a report:

- Which package and version.
- What an attacker can do, and what they need in order to do it.
- A minimal reproduction: the tour JSON, the page or app it runs in, and the steps.
- Anything you already know about a fix.

Docent is maintained by one person, so replies are best effort rather than to a schedule. You can
expect an acknowledgement, a fix or an explanation of why something is not a vulnerability, and
credit in the release notes unless you would rather not be named. Please give a fix a reasonable
chance to ship before disclosing publicly.

## What counts

In scope, roughly in order of how much it matters:

- Any way a tour document can run code in the host page beyond what it declares: injection through
  step content (`body` with `format: 'markdown'`, slots, templates), through a theme file, or
  through the CLI while installing a theme.
- Anything that lets one user's tour progress, identity or traits reach another user.
- The devtools panel or the CLI reading or writing outside what they say they do.

Not vulnerabilities: a tour you wrote yourself doing what you told it to; a page's own CSS changing
how the popover looks; anything that needs an attacker to already run code on the page.

## How releases are protected

Publishing uses npm staged publishing with a trusted publisher. CI can only stage a version, never
make it public; a human approves each release with a second factor. See
[RELEASING.md](RELEASING.md).
