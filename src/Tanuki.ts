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

import Shell from './internal/Shell';

/**
 * Represents the current Tanuki instance running. You can grab
 * the current instance by using the static getter {@link Tanuki.instance},
 * which will return this Tanuki instance.
 */
export class Tanuki {
  private static _instance: Tanuki;

  constructor() {
    if (!Tanuki._instance) Tanuki._instance = this;
  }

  /**
   * Returns the current {@link Tanuki} instance.
   */
  static get instance() {
    return this._instance;
  }

  build() {
    return null;
  }

  buildCi() {
    this.lint('src', ['.ts', '.js', '.vue', '.tsx'], true);
  }

  docs() {
    return null;
  }

  lint(path: string, include?: string[], fix = true) {
    return Shell.exec(`eslint ${path} ${include ? `--ext ${include.join(',')} ` : ''}${fix ? '--fix ' : ''}`);
  }

  init() {
    return null;
  }
}
