---
"fontkitten": patch
---

Avoids returning an invalid x-height of `0` for font files that don’t specify an x-height in their OS/2 table (these fonts now return `undefined`)
