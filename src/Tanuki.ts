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

import consola, { Consola } from 'consola';
import * as utils from './internal/utils';
import { basename, dirname, join, sep } from 'path';
import ProgressBar from 'progress';
import * as esbuild from 'esbuild';
import Shell from './internal/Shell';
import ora from 'ora';
import ts from 'typescript';
import { readFile, writeFile, mkdir, rm } from 'fs/promises';
import { existsSync } from 'fs';

/**
 * The options for {@link Tanuki.build __Tanuki#build__}.
 */
export interface TanukiBuildOptions {
  /**
   * If the artifacts should have a `.mjs` extensions outputted to the `outDir`
   * folder. This is disabled and ignored if {@link TanukiBuildOptions.mode the build mode}
   * is set to {@link BuildMode.Application}.
   */
  esm?: boolean;

  /**
   * If the artifacts should be minified. This is disabled and ignored if {@link TanukiBuildOptions.mode the build mode}
   * is set to {@link BuildMode.Application}.
   */
  minify?: boolean;

  /**
   * If the build command should generate documentation with `docs/current.json`,
   * `docs/master.json`, and `docs/<version>/docs.json` variants. This is disabled and ignored if {@link TanukiBuildOptions.mode the build mode}
   * is set to {@link BuildMode.Application}.
   */
  docs?: boolean;

  /**
   * Returns the build mode.
   */
  mode?: BuildMode;
}

/**
 * Returns the build mode for running the {@link Tanuki.build __build__} command.
 */
export enum BuildMode {
  /**
   * This is returned if the build artifacts should be in library mode. This means,
   * it'll generate documentation for this version, `master`/`main`, and all branches.
   *
   * If `S3_ACCESS_KEY` or `S3_SECRET_KEY` environment variables are set,
   * it'll upload it to S3 using the `BUCKET` environment variable.
   */
  Library = 'library',

  /**
   * This is returned if the build artifacts should be in application mode. This means,
   * `docs`, `cjs`, `esm`, and `minify` is disabled from being used *and* will use the TypeScript
   * compiler instead of **`esbuild`**.
   */
  Application = 'app',
}

/**
 * Represents the current Tanuki instance running. You can grab
 * the current instance by using the static getter {@link Tanuki.instance},
 * which will return this Tanuki instance.
 */
export class Tanuki {
  private static _instance: Tanuki;
  private readonly logger: Consola = consola.withScope('tanuki');

  constructor() {
    if (!Tanuki._instance) Tanuki._instance = this;
  }

  /**
   * Returns the current {@link Tanuki} instance.
   */
  static get instance() {
    return this._instance;
  }

  /**
   * Builds the artifacts.
   * @param options The options to build all artifacts.
   */
  build(options: TanukiBuildOptions = {}) {
    this.logger.info('Building artifacts...');

    // default to application
    const mode = options.mode ?? BuildMode.Application;
    switch (mode) {
      case BuildMode.Application:
        return this._buildApplication();

      case BuildMode.Library:
        return this._buildLibrary({
          esm: options.esm ?? false,
          minify: options.minify ?? false,
          docs: options.docs ?? false,
        });

      default:
        this.logger.error(`Invalid mode: "${mode}".`);
        break;
    }
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

  private async _buildLibrary({ esm, minify, docs }: Required<Omit<TanukiBuildOptions, 'mode'>>) {
    this.logger.info('Compiling artifacts with `esbuild`...');
    this.logger.info(
      `Emit ES Modules: ${esm ? 'yes' : 'no'} | Minified: ${minify ? 'yes' : 'no'} | Provide Documentation: ${
        docs ? 'yes' : 'no'
      }`
    );

    if (existsSync(join(process.cwd(), 'dist')))
      await rm(join(process.cwd(), 'dist'), { recursive: true, force: true });

    const options: esbuild.BuildOptions = {
      bundle: true,
      entryPoints: [join(process.cwd(), 'src', 'index.ts')],
      outfile: join(process.cwd(), 'dist', '__output.cjs'),
      format: 'cjs',
      platform: 'node',
      target: 'node14',
    };

    if (minify) options.minify = true;

    // create cjs build
    await esbuild.build(options);

    if (esm) {
      const output = utils.cjsToEsm(
        require.resolve(join(process.cwd(), 'dist', '__output.cjs')),
        join(process.cwd(), 'dist', '__output.cjs'),
        '__output.cjs'
      );

      await writeFile(join(process.cwd(), 'dist', '__output.mjs'), output + '\n');
      this.logger.success(`Created ES module in ${join(process.cwd(), 'dist', '__output.mjs')}`);
    }

    this.logger.success(`Created CommonJS module in ${join(process.cwd(), 'dist', '__output.cjs')}`);
  }

  private async _buildApplication() {
    // find tsconfig.json
    const file = ts.findConfigFile(process.cwd(), ts.sys.fileExists);
    if (!file) {
      throw new TypeError(`Unable to find \`tsconfig.json\` file in ${file}.`);
    }

    this.logger.debug(`Found tsconfig.json in ${file}!`);
    const [fatal, parsed] = utils.getTsConfig(file);

    if (fatal || parsed === undefined) {
      throw new Error('Unable to parse `tsconfig.json` for some reason. :shrug:');
    }

    this.logger.info(`Using TypeScript v${ts.version} under path ${dirname(require.resolve('typescript'))}`);
    const program = ts.createProgram({
      rootNames: parsed!.fileNames,
      options: {
        noEmit: true,
        ...parsed!.options,
      },
      projectReferences: parsed?.projectReferences,
    });

    // Respect `noEmit` variable.
    if (parsed!.options.noEmit === true) {
      this.logger.warn('`noEmit` was passed, not doing anything.');
      return;
    }

    // emit all files
    const spinner = ora({
      text: 'Building project artifacts...',
      isSilent: false,
    }).start();

    const emitted = program.emit();
    const diagnostics = ts.getPreEmitDiagnostics(program).concat(emitted.diagnostics);
    if (diagnostics.length > 0) {
      spinner.warn('Woops! Some errors have occured while compiling:');
      for (const diagnostic of diagnostics) {
        if (diagnostic.file) {
          const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start!);
          const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');

          this.logger.error(`[${diagnostic.file.fileName}:${line + 1}:${character + 1}] ${message}`);
        } else {
          this.logger.error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
        }
      }

      return;
    }

    spinner.succeed('Project artifacts have been collected.');

    const progress = new ProgressBar(':bar | :current/:total (:percent) :etas', {
      total: parsed!.fileNames.length,
      complete: '\x1b[32m█\x1b[0m',
      incomplete: '█',
    });

    // Now we have all the files! :D
    // Now we do compiler magic.
    const files = parsed!.fileNames;

    if (existsSync(join(process.cwd(), 'dist')))
      await rm(join(process.cwd(), 'dist'), { force: true, recursive: true });

    for (const file of files) {
      const content = await readFile(file, 'utf-8');
      const transpiled = ts.transpileModule(content, {
        compilerOptions: parsed!.options,
      });

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

    this.logger.success('Project has been compiled.');
  }
}
