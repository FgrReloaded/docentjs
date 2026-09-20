---
'@docentjs/core': minor
'@docentjs/dom': minor
'@docentjs/devtools': patch
---

Mistakes in a tour now say so instead of failing quietly.

- **`validateTour(tour)`** reports unknown values, misspelled or missing fields, wrong types, out-of-range numbers and duplicate step ids, each with a path such as `steps[2].arrow` and the value that was probably meant: `"curvy" is not one of: caret, none, line, … Did you mean "curve"?`. Also `isValidTour` and `formatIssues`. It ships as `@docentjs/core/validate`, re-exported from `@docentjs/dom/validate`, so runtime bundles never carry it.
- **Development warnings.** `createTour` and `createDocent` check each tour once and warn in the console. Production builds contain neither the call nor the checker.
- **A published JSON Schema** at `https://docentjs.dev/schema/tour-v1.json`, generated from the same description the checker uses. Point a `.tour.json` file at it with `$schema` for completion and checking in your editor.
- **Devtools**: the Audit tab now lists schema problems alongside its page checks.
