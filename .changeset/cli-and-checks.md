---
'@docentjs/core': minor
'@docentjs/dom': minor
'@docentjs/devtools': minor
---

Fewer ways to be wrong without being told, and less typing for common looks.

- **A command line checker.** `npx @docentjs/cli validate "tours/*.json"` checks tour files without a browser, for CI and for tools that write tours. It exits 1 on errors, `--json` reports for other programs, and `docent schema` prints or writes the JSON Schema. Tour files may also carry `$schema`, which is now a known field.
- **Warnings for silent mistakes.** Starting a tour id that does not exist now says so and lists the ids it knows. A step skipped because its target is missing names the step and the target it looked for. Both only in development; production builds contain neither.
- **Three looks under one name.** `options.template: 'hint'` keeps the page usable with a glowing ring and a curved arrow; `'announcement'` blurs the page for something to read; `'spotlight'` is the default spelled out. They are ordinary templates, so registering one of those names replaces it.
- **Devtools Audit measures the page.** It now reports targets that exist but cannot be seen: no visible box, transparent, tiny, off screen, or covered by a fixed panel, plus a click step whose target is disabled.
