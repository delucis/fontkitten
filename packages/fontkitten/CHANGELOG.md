# fontkitten

## 0.0.12

### Patch Changes

- [`006e599`](https://github.com/delucis/fontkitten/commit/006e599fcaf1c1fb9f4e17c1e5a05d8e84c5218e) Thanks [@delucis](https://github.com/delucis)! - Fixes type of `Font#getName()` method to reflect removal of second parameter

## 0.0.11

### Patch Changes

- [#30](https://github.com/delucis/fontkitten/pull/30) [`1549440`](https://github.com/delucis/fontkitten/commit/1549440546e372bb5a8ed954f9a332221b039a93) Thanks [@delucis](https://github.com/delucis)! - Drops parsing for OpenType tables that are not directly used in Fontkitten APIs

  The following OpenType tables are no longer parsed and are not included on parsed font objects: `cvt`, `fpgm`, `prep`, `VORG`, `EBLC`, `BASE`, `GDEF`, `GPOS`, `JSTF`, `DSIG`, `gasp`, `hdmx`, `kern`, `LTSH`, `PCLT`, `VDMX`, `bsln`, `feat`, `just`, `morx`, and `opbd`.

## 0.0.10

### Patch Changes

- [#19](https://github.com/delucis/fontkitten/pull/19) [`79da3f1`](https://github.com/delucis/fontkitten/commit/79da3f1974332b16b969bd89bdf1f69832c59914) Thanks [@delucis](https://github.com/delucis)! - Reduces bundle size of fontkitten by about 25 KB by removing unused internal code

## 0.0.9

### Patch Changes

- [`5dcbab5`](https://github.com/delucis/fontkitten/commit/5dcbab524cddfe5bfff9c396f20bc9a51f0d5ddc) Thanks [@delucis](https://github.com/delucis)! - Fixes the bundle published to npm

## 0.0.8

### Patch Changes

- [#14](https://github.com/delucis/fontkitten/pull/14) [`940eb9d`](https://github.com/delucis/fontkitten/commit/940eb9d4ccdb241db949ec2a97f7a3458d34d5b4) Thanks [@delucis](https://github.com/delucis)! - Reduces install size further by bundling some dependencies

## 0.0.7

### Patch Changes

- [`664b697`](https://github.com/delucis/fontkitten/commit/664b697556763425ada1f624c61067e9d862dbe1) Thanks [@delucis](https://github.com/delucis)! - Updates README to reflect new install size

## 0.0.6

### Patch Changes

- [#10](https://github.com/delucis/fontkitten/pull/10) [`cbf1a09`](https://github.com/delucis/fontkitten/commit/cbf1a09c837e5c3df533dd7f825308851d33f9c4) Thanks [@delucis](https://github.com/delucis)! - Reduces install size significantly by replacing the `brotli` dependency with a smaller implementation.

## 0.0.5

### Patch Changes

- [#8](https://github.com/delucis/fontkitten/pull/8) [`202d023`](https://github.com/delucis/fontkitten/commit/202d023ef93b6b9706c4870b27c3349925cbc398) Thanks [@delucis](https://github.com/delucis)! - Exports types from `fontkitten` so they can be used by downstream projects
