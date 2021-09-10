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

import { ESLint as Eslint } from 'eslint';
import { colors, styles } from 'leeks.js';
import consola from 'consola';

type DecouplePromise<T> = T extends Promise<infer U> ? U : never;
type DecoupleArray<T> = T extends (infer U)[] ? U : never;
type LintResult = DecouplePromise<ReturnType<Eslint['lintFiles']>>;

/**
 * Represents a internal class to provide pretty linting with Tanuki.
 * @internal
 */
export default class ESLint {
  private readonly logger = consola.withScope('tanuki:eslint');
  private eslint: Eslint;

  /**
   * Initializes a new {@link ESLint} instance.
   * @param fix If ESLint should fix the changes or not.
   */
  constructor(fix: boolean) {
    this.eslint = new Eslint({
      fix,
      extensions: ['.d.ts', 'ts', 'js', 'tsx', 'jsx'],
    });
  }

  /**
   * Lints all the files by a globbed path
   * @param files The files to read
   */
  async lint(files: string[]) {
    const results = await this.eslint.lintFiles(files);
    const warnings = results.reduce((acc, curr) => acc + curr.warningCount, 0);
    const errors = results.reduce((acc, curr) => acc + curr.warningCount, 0);

    this.logger.warn(`⚠️ ${warnings} warning(s) | ✖️ ${errors} error(s)`);
    for (const result of results.filter((s) => s.messages.length > 0)) {
      for (let i = 0; i < result.messages.length; i++) {
        const source = this._prettifySource(result, result.messages[i]);
        if (source === '') {
          this.logger.warn(
            `(unable to receive source trace)\n\n${colors.red('>')} ${colors.gray(result.messages[i].message)}`
          );
        } else {
          this.logger.warn(
            `${source}\n\n${colors.red('> ')} ${colors.gray(result.messages[i].message)}${
              result.messages[i].fatal ? ' (fatal)' : ''
            }`
          );
        }
      }
    }
  }

  private _prettifySource(result: DecoupleArray<LintResult>, message: DecoupleArray<LintResult[0]['messages']>) {
    if (!result.output) return '';

    // calculate source
    const lines = result.output.split(/\r?\n/);
    const start = Math.max(message.line - 3, 0);
    const end = Math.min(message.line + 2, lines.length);
    const maxWidth = String(end).length;

    // get source code from here
    return lines
      .slice(start, end)
      .map((line, index) => {
        const num = start + 1 + index;
        const gutter = ' ' + (' ' + num).slice(-maxWidth) + ' | ';
        if (num === message.line) {
          const spacing =
            colors.gray(gutter.replace(/\d/g, '')) + line.slice(0, message.column - 1).replace(/[^\t]/g, '');

          return colors.gray(gutter) + line + '\n ' + spacing + styles.bold(colors.red('^'));
        }

        return colors.gray(gutter) + line;
      })
      .join('\n');
  }
}
