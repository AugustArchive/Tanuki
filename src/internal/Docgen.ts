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

/* eslint-disable camelcase */

import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import * as typedoc from 'typedoc';
import { join } from 'path';
import Logger from '@ayanaware/logger';
import rimraf from 'rimraf';
import ts from 'typescript';

/**
 * Represents the options for the {@link DocumentationGenerator}.
 * @internal
 */
export interface DocgenOptions {
  /**
   * If this project is a multi-project workspace. If so, the documentation
   * file will emit:
   *
   * ```json
   * {
   *    "format_version": 1,
   *    "workspaces": true,
   *    "packages": {
   *        "project1": [],
   *        "project2": []
   *    }
   * }
   * ```
   */
  workspaces?: boolean;

  /**
   * The working tsconfig.json file to use, if this isn't provided,
   * it'll use `./tsconfig.json` if there is one. If {@link DocgenOptions.workspaces workspaces}
   * is set to true, it'll traverse through `./<workspace>/tsconfig.json` and use that instead.
   */
  tsconfig?: string;

  /**
   * Returns the entrypoints for this project, if this isn't specified,
   * it'll use `['src/index.ts']`.
   */
  entryPoints?: string[];
}

/**
 * Represents a documentation generator to emit a JSON file
 * towards `.tanuki/docs.json`, which can be read by [docs.floofy.dev](https://github.com/Noelware/docs).
 *
 * @internal
 */
export default class DocumentationGenerator {
  private readonly logger: Logger = Logger.get(DocumentationGenerator);

  /**
   * Returns the format version.
   */
  private static get FORMAT_VERSION() {
    return 1;
  }

  private _findTsconfig(path: string): [parsed: ts.ParsedCommandLine | undefined, fatal: boolean] {
    // Source: https://github.com/TypeStrong/typedoc/blob/master/src/lib/utils/options/readers/tsconfig.ts#L46-L63
    let isFatal = false;
    let error = null as any; // `error` will just be "null", so let's just cast it to any.

    const tsconfig = ts.getParsedCommandLineOfConfigFile(
      path,
      {},
      {
        ...ts.sys,
        onUnRecoverableConfigFileDiagnostic: (_err) => {
          isFatal = true;
        },
      }
    );

    return [tsconfig, isFatal];
  }

  /**
   * Runs the documentation generator.
   * @internal
   */
  async run(options: DocgenOptions = { tsconfig: './tsconfig.json' }) {
    this.logger.info('Generating documentation...');
    this.logger.info(`|> TypeScript: v${ts.version}`); // TODO: use `require.resolve` for versions?
    this.logger.info(`|> Format:     ${DocumentationGenerator.FORMAT_VERSION}`);

    const DOCS_PATH = join(process.cwd(), 'docs');
    if (existsSync(DOCS_PATH)) rimraf.sync(DOCS_PATH);
    await mkdir(DOCS_PATH);

    if (options.workspaces !== undefined) {
      this.logger.error('Workspaces are not supported at this given moment.');
      return;
    }

    const application = new typedoc.Application();
    application.bootstrap({
      excludeInternal: true,
      excludePrivate: true,
      excludeProtected: true,
      entryPoints: options.entryPoints ?? ['src/index.ts'],
      tsconfig: options.tsconfig!,
      pretty: true,
    });

    const [tsconfig, fatal] = this._findTsconfig(options.tsconfig!);
    if (!tsconfig || fatal) {
      this.logger.error(`Unable to find tsconfig.json in ${application.options.getValue('tsconfig')}`);
      return;
    }

    application.options.setCompilerOptions(tsconfig.fileNames, tsconfig.options, tsconfig.projectReferences);
    this.logger.info('Generating documentation, this may take a while!');

    const reflection = application.convert();
    if (!reflection) {
      this.logger.error('Unable to retrieve the project reflection, did I do something wrong, woomy?');
      return;
    }

    const out = join(DOCS_PATH, 'docs.json');
    const serialized = {
      format_version: DocumentationGenerator.FORMAT_VERSION,
      generated_at: new Date(),
      workspaces: false,
      children: [] as any[],
    };

    if (!reflection.children) {
      this.logger.warn("Project reflection didn't have any children, emitting empty output...");
      await writeFile(out, JSON.stringify(serialized));

      return;
    }

    for (const child of reflection.children) {
      const block = this._traverseChild(child);
      serialized.children.push(block);
    }

    await writeFile(out, JSON.stringify(serialized));
    this.logger.info(`Generated documentation in ${out}!`);
  }

  private _traverseChild(child: typedoc.DeclarationReflection) {
    const block: Record<string, any> = {
      name: child.name,
      kind: child.kindString,
      flags: {
        public: child.flags.hasFlag(typedoc.ReflectionFlag.Public),
      },
    };

    if (child.hasComment()) {
      const comment: Record<string, any> = {
        text: child.comment!.shortText,
      };

      if (child.comment!.tags.length > 0) {
        comment.tags = child.comment!.tags.map((s) => ({
          param: s.paramName,
          text: s.text,
          tag: s.tagName,
        }));
      }

      if (child.comment!.returns !== undefined) comment.returns = child.comment!.returns;
      block.comment = comment;
    }

    return block;
  }
}
