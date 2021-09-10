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

import * as yargs from 'yargs';
import { Tanuki } from '..';
import consola from 'consola';

export default class LintCommand implements yargs.CommandModule {
  private readonly logger = consola.withScope('tanuki:lint');

  command = 'lint';
  describe = 'Runs ESLint in the current project.';

  handler(args: any) {
    if (!args.files) {
      this.logger.warn('Missing an array of files.');
      return;
    }

    console.log(args);
    return Tanuki.instance.lint(args.f ?? args.files ?? ['.']);
  }

  builder(args: yargs.Argv) {
    return args
      .option('f', {
        alias: 'files',
        describe: 'Returns a list of files to lint.',
        type: 'array',
        default: [],
      })
      .describe({
        files: 'Returns a list (globbing is supported) of files to lint.',
      });
  }
}
