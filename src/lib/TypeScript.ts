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

import { mkdir, rm, writeFile, readFile } from 'fs/promises';
import { basename, dirname, join, sep } from 'path';
import type { BuildArtifactsConfig } from './Config';
import esbuild, { BuildOptions } from 'esbuild';
import { colors, styles } from 'leeks.js';
import { cjsToEsm, getTsConfig } from './utils';
import { existsSync } from 'fs';
import ProgressBar from 'progress';
import { Tanuki } from '../Tanuki';
import consola from 'consola';
import ora from 'ora';
import ts from 'typescript';

/** @internal */
export default class TypeScript {
  private static readonly logger = consola.withScope('tanuki:ts');

  static findTsConfig() {
    let file!: string;
    if (Tanuki.instance.config.tsconfig !== undefined) {
      file = Tanuki.instance.config.tsconfig;
    } else {
      file = ts.findConfigFile(process.cwd(), ts.sys.fileExists)!;
    }

    if (!file) throw new Error(`Unable to locale \`tsconfig.json\` file in path "${file}"`);

    this.logger.debug(`Found config file in ${file}.`);
    const [fatal, parsed] = getTsConfig(file);
    if (fatal || parsed === undefined) throw new Error('Unable to parse `tsconfig.json`');

    return parsed!;
  }

  static async buildApp() {
    let file!: string;
    if (Tanuki.instance.config.tsconfig !== undefined) {
      file = Tanuki.instance.config.tsconfig;
    } else {
      file = ts.findConfigFile(process.cwd(), ts.sys.fileExists)!;
    }

    if (!file) throw new Error(`Unable to locale \`tsconfig.json\` file in path "${file}"`);

    this.logger.debug(`Found config file in ${file}.`);
    const [fatal, parsed] = getTsConfig(file);
    if (fatal || parsed === undefined) throw new Error('Unable to parse `tsconfig.json`');

    this.logger.info(`Using TypeScript v${ts.version} under ${dirname(require.resolve('typescript'))}`);
    const program = ts.createProgram({
      rootNames: parsed!.fileNames,
      options: {
        noEmit: true,
        ...parsed!.options,
      },

      projectReferences: parsed?.projectReferences,
    });

    // respect `noEmit`
    if (parsed!.options.noEmit === true) this.logger.warn('Will not emit files, will only type-check.');

    const spinner = ora('Building project artifacts...');
    const emit = program.emit();
    const diagnostics = ts.getPreEmitDiagnostics(program).concat(emit.diagnostics);
    if (diagnostics.length > 0) {
      spinner.warn('Uh oh, some errors have occured while compiling:');
      for (let i = 0; i < diagnostics.length; i++) {
        const diagnostic = diagnostics[i];
        if (diagnostic.file) {
          const sourceCode = diagnostic.file.getFullText();
          const lines = sourceCode.split(/\r?\n/);

          const { line, character: char } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start!);
          const start = Math.max(line - 3, 0);
          const end = Math.min(char + 2, lines.length);
          const maxWidth = String(end).length;

          const embeddedSource = lines
            .slice(start, end)
            .map((l, index) => {
              const num = start + 1 + index;
              const gutter = ' ' + (' ' + num).slice(-maxWidth) + ' | ';
              if (num === line) {
                const spacing = colors.gray(gutter.replace(/\d/g, '')) + l.slice(0, char - 1).replace(/[^\t]/g, '');

                return colors.gray(gutter) + line + '\n ' + spacing + styles.bold(colors.red('^'));
              }

              return colors.gray(gutter) + line;
            })
            .join('\n');

          const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
          this.logger.fatal(
            `${embeddedSource}\n\n${colors.red('>')} ${colors.gray(
              `${diagnostic.file.fileName}:${line + 1}:${char + 1}`
            )} | ${message}`
          );
        } else {
          this.logger.error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
        }
      }
    }

    spinner.succeed('Completed project artifacts.');
    if (parsed!.options.noEmit === true) {
      this.logger.info('done.');
      return;
    }

    const progress = new ProgressBar(':bar - :current/:total (:percent)', {
      total: parsed!.fileNames.length,
      complete: '\x1b[32m█\x1b[0m',
      incomplete: '█',
    });

    const buildDir = parsed!.options.outDir ?? 'build';
    if (existsSync(buildDir)) await rm(join(process.cwd(), buildDir), { recursive: true, force: true });

    for (const file of parsed!.fileNames) {
      const content = await readFile(file, 'utf-8');
      const transpiled = ts.transpileModule(content, { compilerOptions: parsed!.options });

      const base = basename(file);
      const path = file.split(sep);
      path.pop();

      const actualPath = path.map((s) => (s !== 'src' ? s : 'dist')).join(sep);

      if (!existsSync(actualPath)) await mkdir(actualPath);
      await writeFile(
        join(actualPath, `${base.slice(0, base.length - 3)}.js`),
        `/* eslint-disable */\n// prettier-ignore\n${transpiled.outputText}`
      );

      progress.tick();
    }

    this.logger.info('completed :3');
  }

  static async buildLib({ esm, minify }: Required<Pick<BuildArtifactsConfig, 'esm' | 'minify'>>) {
    this.logger.info(
      `Compiling artifacts with \`esbuild\`!${esm ? '\n- Emitting ESModule output.' : ''}${
        minify ? '\n- Minified Output' : ''
      }`
    );

    let file!: string;
    if (Tanuki.instance.config.tsconfig !== undefined) {
      file = Tanuki.instance.config.tsconfig;
    } else {
      file = ts.findConfigFile(process.cwd(), ts.sys.fileExists)!;
    }

    if (!file) throw new Error(`Unable to locale \`tsconfig.json\` file in path "${file}"`);

    this.logger.debug(`Found config file in ${file}.`);
    const [fatal, parsed] = getTsConfig(file);
    if (fatal || parsed === undefined) throw new Error('Unable to parse `tsconfig.json`');

    this.logger.info(`Using TypeScript v${ts.version} under ${dirname(require.resolve('typescript'))}`);
    const buildDir = parsed!.options.outDir ?? 'build';
    if (existsSync(buildDir)) await rm(join(process.cwd(), buildDir), { recursive: true, force: true });

    const options: BuildOptions = {
      bundle: true,
      entryPoints: [join(process.cwd(), 'src', 'index.ts')],
      outfile: join(buildDir, `${Tanuki.instance.config.name}.cjs`),
      format: 'cjs',
      platform: 'node',
      target: 'node14',
    };

    if (minify) options.minify = true;
    await esbuild.build(options);

    if (esm) {
      const output = cjsToEsm(
        require.resolve(join(buildDir, `${Tanuki.instance.config.name}.cjs`)),
        join(buildDir, `${Tanuki.instance.config.name}.cjs`),
        `${Tanuki.instance.config.name}.cjs`
      );

      await writeFile(join(buildDir, `${Tanuki.instance.config.name}.mjs`), output + '\n');
      this.logger.info('Emitted ESModule file.');
    }

    this.logger.info('completed :3');
  }
}
