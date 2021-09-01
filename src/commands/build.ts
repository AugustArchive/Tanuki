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
import esbuild from 'esbuild';
import shell from '../internal/Shell';
import { Tanuki } from '..';

export default class BuildCommand implements yargs.CommandModule {
  command = 'build';
  describe = 'Builds the project artifacts.';

  async handler(args: yargs.Arguments) {
    return;
  }

  /*
    logger.info('Building project artifacts...');

    let mode = args.mode || args.mo || 'app';
    if (mode === 'lib') mode = 'library';

    logger.info(`Mode: ${mode}`);

    if (args.develop || args.dev) {
      logger.info('Invoking TypeScript compiler...');
      try {
        shell.exec('tsc');
      } catch (ex) {
        logger.error('Unable to build artifacts:');
        logger.error(ex as Error);

        process.exit(1);
      }

      logger.info('Built artifacts.');
      process.exit(0);
    }

    if (mode === 'app') {
      logger.info('Invoking TypeScript compiler...');
      try {
        shell.exec('tsc');
      } catch (ex) {
        logger.error('Unable to build artifacts:');
        logger.error(ex as Error);

        process.exit(1);
      }

      logger.info('Built artifacts.');
      process.exit(0);
    }

    const cjs = args.cjs ? (args.commonjs ? true : false) : false;
    const esm = args.esm ? (args.esmodules ? true : false) : false;
    const minify = args.m ? (args.minify ? true : false) : false;
    const docs = args.d ? (args.docs ? true : false) : false;

    logger.info(`|> Emit CommonJS: ${cjs ? 'yes' : 'no'}`);
    logger.info(`|> Emit ES Modules: ${esm ? 'yes' : 'no'}`);
    logger.info(`|> Minified Output: ${minify ? 'yes' : 'no'}`);
    logger.info(`|> Documentation: ${docs ? 'yes' : 'no'}`);
  */

  builder(args: yargs.Argv) {
    return args
      .option('cjs', {
        alias: 'commonjs',
        describe: 'If the artifact should be in CommonJS only.',
        default: false,
      })
      .option('esm', {
        alias: 'esmodules',
        describe:
          'If the artifact should be in ES Modules only. If both --esm and --cjs are combined, both artifacts will be built.',
        default: false,
      })
      .option('m', {
        alias: 'minify',
        describe: 'If the built artifacts should be minified.',
        default: false,
      })
      .option('d', {
        alias: 'docs',
        describe: 'If the build tool should emit Typedoc information, this is only in library mode.',
        default: false,
      })
      .option('mo', {
        alias: 'mode',
        describe:
          'Chooses which mode the build tool will use. Only values should be `app` or `library`, this will also check `package.json` under the `tanuki` object.',
        default: 'app',
        choices: [
          'app',
          'library',
          'lib', // add lib for short
        ],
      })
      .option('develop', {
        alias: 'dev',
        describe:
          "If we should only emit TypeScript using `tsc`, in library mode, it'll respect this while in `app` mode, it'll use tsc by default.",
        default: false,
      });
  }
}
