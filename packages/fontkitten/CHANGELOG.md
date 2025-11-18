# fontkitten

## 0.0.16

### Patch Changes

- [#48](https://github.com/delucis/fontkitten/pull/48) [`1ffc98a`](https://github.com/delucis/fontkitten/commit/1ffc98aa9df646d39cc6ae51f54ec7368d8e3e1a) Thanks [@delucis](https://github.com/delucis)! - Fixes a rare case where glyphs without layers in color fonts could cause infinite recursion

## 0.0.15

### Patch Changes

- [`44ce622`](https://github.com/delucis/fontkitten/commit/44ce622f8e964e5e0d5591dea81c5d2d26a566e7) Thanks [@delucis](https://github.com/delucis)! - Adds a new `isCollection` property to make it easier to discriminate between `Font` and `FontCollection` objects

- [`3a0a308`](https://github.com/delucis/fontkitten/commit/3a0a30892de2768962b4aa6d935493a35be9fac5) Thanks [@delucis](https://github.com/delucis)! - Adds a type definition for the `advanceHeight` property on glyphs

- [`e26d666`](https://github.com/delucis/fontkitten/commit/e26d666802296b533ea1267ed2998b399fa14229) Thanks [@delucis](https://github.com/delucis)! - Removes an unused internal `copy()` method on the `BBox` class

## 0.0.14

### Patch Changes

- [#43](https://github.com/delucis/fontkitten/pull/43) [`315b336`](https://github.com/delucis/fontkitten/commit/315b3360f6f4cafc4774c9ff660c650f3a025d38) Thanks [@delucis](https://github.com/delucis)! - Fixes `Path#bbox` getter

- [#43](https://github.com/delucis/fontkitten/pull/43) [`315b336`](https://github.com/delucis/fontkitten/commit/315b3360f6f4cafc4774c9ff660c650f3a025d38) Thanks [@delucis](https://github.com/delucis)! - Fixes bounding box access on WOFF2 fonts

## 0.0.13

### Patch Changes

- [#39](https://github.com/delucis/fontkitten/pull/39) [`a96a752`](https://github.com/delucis/fontkitten/commit/a96a75245ce657d0a2928d593fdb2e54716d49de) Thanks [@delucis](https://github.com/delucis)! - Removes the `Glyph#render()` and `Path#toFunction()` APIs, which previously provided a way to render a glyph to a `<canvas>` context

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
