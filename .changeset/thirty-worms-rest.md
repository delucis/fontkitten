---
'fontkitten': patch
---

Drops parsing for OpenType tables that are not directly used in Fontkitten APIs

The following OpenType tables are no longer parsed and are not included on parsed font objects: `cvt`, `fpgm`, `prep`, `VORG`, `EBLC`, `BASE`, `GDEF`, `GPOS`, `JSTF`, `DSIG`, `gasp`, `hdmx`, `kern`, `LTSH`, `PCLT`, `VDMX`, `bsln`, `feat`, `just`, `morx`, and `opbd`.
