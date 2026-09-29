---
'@docentjs/core': minor
'@docentjs/dom': minor
---

Themes and templates can say how tours look on phones: a `mobile` block (`layout` and `card`) in a theme file or template applies to every tour using it, so a theme can, for example, keep its classic card or always dock on small screens. Settings merge field by field, renderer options first, then the theme, then the tour. The theme file schema checks the new field, so `validateTheme` and `docent theme add` catch a misspelled value.
