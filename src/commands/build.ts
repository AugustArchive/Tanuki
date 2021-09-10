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

import { BuildMode, Tanuki } from '..';
import * as yargs from 'yargs';

export default class BuildCommand implements yargs.CommandModule {
  command = 'build';
  describe = 'Builds the project artifacts.';

  handler(args: yargs.Arguments) {
    const mode = (args.mode ?? 'app') === BuildMode.Application ? BuildMode.Application : BuildMode.Library;
    return Tanuki.instance.build({
      mode,
      esm: (args.esm as boolean | undefined) ?? false,
      minify: (args.minify as boolean | undefined) ?? false,
      provideDocs: (args.docs as boolean | undefined) ?? false,
    });
  }

  builder(args: yargs.Argv) {
    return args
      .option('esm', {
        describe: 'If the artifact should include a .mjs file.',
        default: false,
      })
      .option('minify', {
        describe: 'If the built artifacts should be minified.',
        default: false,
      })
      .option('docs', {
        describe: 'If the build tool should emit Typedoc information, this is only in library mode.',
        default: false,
      })
      .option('mode', {
        describe:
          'Chooses which mode the build tool will use. Only values should be `app` or `library`, this will also check `package.json` under the `tanuki` object.',
        default: 'app',
        choices: [
          'app',
          'library',
          'lib', // add lib for short
        ],
      });
  }
}
