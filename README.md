# @augu/tanuki

> 🐻 **Personal build-tool framework for building libraries and applications for my TypeScript projects**
>
> Deprecated because didn't work out. :(

## Usage

> CLI:

```sh
$ tanuki build --mode ["app" / "mode"] [--esm "true" / "false"] [--minfy "true" / "false"]
```

> Programmatic:

```js
const { Tanuki, BuildMode } = require('@augu/tanuki');
const tanuki = new Tanuki({
  name: 'project name',
});

tanuki.build({ esm: true, minify: true, mode: BuildMode.Library });
tanuki.docs();
tanuki.lint(['src/**/*.ts']);
```

## Why?

I don't want to re-configure my TypeScript tool-chain every second, so I want to create a unified one that works
really well within my workflow.

This also means that I can use the same tool-chain for all my projects, and it will work just fine! And it has a documentation
generator which is linked to [docs.floofy.dev](https://github.com/Noelware/docs).

This is meant for my **_personal_** usage, you don't have to use this if you don't feel like it.

## License

**@augu/tanuki** is released under the **MIT** License.
