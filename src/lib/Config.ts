/**
 * Copyright (c) 2021 Noel
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { cosmiconfig, Loader } from 'cosmiconfig';

/**
 * Represents the configuration of Tanuki.
 */
export interface Config {
  /**
   * The name of the project (required)
   */
  name: string;

  /**
   * Configuration for build artifacts
   */
  build?: BuildArtifactsConfig;

  /**
   * Configuration for ESLint
   */
  eslint?: ESLintConfig;

  /**
   * The path to your `tsconfig.json` if you need to specify it,
   * i.e, a monorepo.
   *
   * By default, it'll try to find it where you invoked the `tanuki` root command.
   */
  tsconfig?: string;

  /**
   * Configuration for Typedoc
   */
  typedoc?: TypedocConfig;
}

/**
 * Configuration for ESLint
 */
export interface ESLintConfig {
  /**
   * If we should apply the `--fix` flag
   * @default true
   */
  fix?: boolean;

  /**
   * A list of extra extensions to apply.
   * @default ['.d.ts', 'ts', 'js', 'jsx', 'tsx']
   */
  extensions?: string[];
}

/**
 * Configuration for building artifacts to run or to upload
 * to NPM.
 */
export interface BuildArtifactsConfig {
  /**
   * If the `build` / `build:ci` commands should output a `.mjs` file. If {@link BuildArtifactsConfig.esm} and
   * {@link BuildArtifactsConfig.cjs} are disabled or not defined, it'll only invoke `tsc` and not use `esbuild`.
   *
   * This is disabled in **application** mode.
   * @default false
   */
  esm?: boolean;

  /**
   * If the `build` / `build:ci` commands should be minified.
   *
   * This is disabled in **application** mode.
   * @default false
   */
  minify?: boolean;

  /**
   * If the `build` / `build:ci` commands should output documentation in `$ROOT/docs.json`.
   * @default false
   */
  provideDocs?: boolean;

  /**
   * Returns the upload system to use
   * @default 'fs'
   */
  uploader?: 's3' | 'fs';

  /**
   * Returns the build mode to use.
   */
  mode?: BuildMode;
}

/**
 * Returns the configuration for Typedoc
 */
export interface TypedocConfig {
  /**
   * If typedoc should operate in workspace mode, which Tanuki will emit docs.json in a
   * Array from than a object form. Read [more here](#)
   */
  workspaces?: boolean | string[];

  /**
   * If typedoc should use the `TypeDocReader` reader, which will find a `typedoc.json`
   * or `typedoc.js` file to load options from.
   */
  findTypedocFile?: boolean;
}

/**
 * Returns the build mode for running the {@link Tanuki.build __build__} command.
 */
export enum BuildMode {
  /**
   * This is returned if the build artifacts should be in library mode. This means,
   * it'll generate documentation for this version, `master`/`main`, and all branches.
   */
  Library = 'library',

  /**
   * This is returned if the build artifacts should be in application mode. This means,
   * `docs`, `cjs`, `esm`, and `minify` is disabled from being used *and* will use the TypeScript
   * compiler instead of **`esbuild`**.
   */
  Application = 'app',
}

/** @internal */
export const loader: Loader = (path) => {
  try {
    require('ts-node/register');
    const config = require(path);

    return config.default;
  } catch (ex) {
    throw ex;
  }
};

/** @internal */
export const findConfig = async () => {
  const config = cosmiconfig('tanuki', {
    searchPlaces: ['package.json', '.tanukirc', '.tanukirc.ts', '.tanukirc.js', '.tanukirc.json'],
    loaders: {
      '.ts': loader,
    },
  });

  const res = await config.search();

  if (res === null) return { name: 'unknown' } as Config;
  return res.config as Config;
};
