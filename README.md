# @augu/tanuki
> 🐻 **Personal build-tool framework for building libraries and applications for my TypeScript projects**

## Usage
> CLI:

```sh
$ tanuki src/index.ts --out dist/index.js --esm --cjs --minify --sourcemap --docs
```

> Programmatic:

```js
const tanuki = require('@augu/tanuki');
const entryPoints = tanuki.extractEntryPoints();

tanuki.build(entryPoints, {
  out: 'dist/index.js',
  esm: true,
  cjs: true,
  minify: true,
  sourcemap: true,
  docs: true
});
```

## Why?
I don't want to re-configure my TypeScript tool-chain every second, so I want to create a unified one that works
really well within my workflow.

This also means that I can use the same tool-chain for all my projects, and it will work just fine! And it has a documentation
generator which is linked to [docs.floofy.dev](https://github.com/Noelware/docs).

This is meant for my ***personal*** usage, you don't have to use this if you don't feel like it.

## License
**@augu/tanuki** is released under the **MIT** License.
