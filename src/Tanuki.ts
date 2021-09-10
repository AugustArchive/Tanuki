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

import { Documentation, ESLint, TypeScript, Config } from './lib';
import { BuildMode } from './lib/Config';

/**
 * Returns the entrypoint of Tanuki. This is where all commands are executed at.
 */
export class Tanuki {
  /**
   * Returns the singleton of this {@link Tanuki} instance.
   */
  static instance: Tanuki;

  /**
   * Creates a new instance of {@link Tanuki}.
   * @param config The configuration object to use.
   */
  constructor(public config: Config) {
    if (!Tanuki.instance) Tanuki.instance = this;
  }

  /**
   * returns `'b'`.
   */
  get a() {
    return 'b';
  }

  /**
   * sets `uwu` = val
   */
  set a(val: string) {
    this['uwu'] = val;
  }

  /**
   * Runs the documentation generator and parses the entries.
   */
  docs() {
    return Documentation.instance.serialize();
  }

  /**
   * Runs `eslint` to lint files.
   * @param files The list of files to lint for
   */
  lint(files: string[]) {
    const eslint = new ESLint(this.config.eslint?.fix ?? true);
    return eslint.lint(files);
  }

  /**
   * Runs the `build` command within the programmatic usage of Tanuki.
   */
  async build(options?: Partial<Config['build']>) {
    const { mode, esm, minify, provideDocs: docs } = options ?? { mode: BuildMode.Application };
    switch (mode) {
      case BuildMode.Application:
        return TypeScript.buildApp();

      case BuildMode.Library:
        {
          await TypeScript.buildLib({ esm: esm ?? false, minify: minify ?? false });
          if (docs === true) await this.docs();
        }
        break;

      default:
        throw new Error(`Invalid build mode: ${mode}`);
    }
  }
}
