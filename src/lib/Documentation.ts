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

import {
  EnumSerializer,
  FunctionSerializer,
  VariableSerializer,
  TypeAliasSerializer,
  GetterSerializer,
  SetterSerializer,
  ConstructorSerializer,
  PropertySerializer,
  MethodSerializer,
} from './docs';

import { Application, JSONOutput, ReflectionKind, TypeDocOptions, TypeDocReader } from 'typedoc';
import { mkdir, rm, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { Tanuki } from '..';
import { join } from 'path';
import consola from 'consola';
import ts from './TypeScript';
import ora from 'ora';

/**
 * Represents a internal class to provide documentation in a well-formatted
 * JSON file. If wanted, it'll upload to S3 and you can read the contents
 * from there.
 *
 * @internal
 */
export default class Documentation {
  /**
   * Returns the format version of the `docs.json` file.
   */
  public static readonly FORMAT_VERSION: number = 1;

  /**
   * Returns a singleton of this {@link Documentation} class.
   */
  public static readonly instance = new Documentation();
  private readonly logger = consola.withScope('tanuki:docs');

  async serialize() {
    this.logger.info('Now serializing project for documentation...');

    const config = Tanuki.instance.config.typedoc ?? { workspaces: false };
    const parsed = ts.findTsConfig();
    const app = new Application();

    // load `TypeDocReader` if config.typedocFile is defined
    if (config.findTypedocFile === true) app.options.addReader(new TypeDocReader());

    const defaultOptions: Partial<TypeDocOptions> = {
      excludeInternal: true,
      excludePrivate: true,
      excludeProtected: true,
      entryPoints: ['src/index.ts'],
      tsconfig: Tanuki.instance.config.tsconfig,
      pretty: true,
    };

    // add defaults
    app.bootstrap(defaultOptions);

    // add compiler options
    app.options.setCompilerOptions(parsed.fileNames, parsed.options, parsed.projectReferences);
    const spinner = ora('Generating documentation...').start();
    const reflection = app.convert();

    if (!reflection) {
      spinner.fail('I think something went wrong woomy!');
      return;
    }

    spinner.succeed('Received project reflection, woomy!');
    const DOCS_PATH = join(process.cwd(), 'docs', 'docs.json');
    const output = {
      format_version: Documentation.FORMAT_VERSION,
      children: [] as any[],
      date: Date.now(),
    };

    if (!existsSync(join(process.cwd(), 'docs'))) await mkdir(join(process.cwd(), 'docs'));
    await app.generateJson(reflection, join(process.cwd(), 'docs', 'tmp.json'));

    const data = require(join(process.cwd(), 'docs', 'tmp.json')) as JSONOutput.ProjectReflection;
    if (!data.children) {
      this.logger.warn('No root elements were specified. Emitting empty...');
      await rm(join(process.cwd(), 'docs', 'tmp.json'));
      await writeFile(DOCS_PATH, JSON.stringify(output, null, 4));

      return;
    }

    for (const child of data.children) {
      const block = this._traverseChild(child);
      output.children.push(block);
    }

    await rm(join(process.cwd(), 'docs', 'tmp.json'));
    await writeFile(DOCS_PATH, JSON.stringify(output, null, 4));
    this.logger.info(`Generated documentation in ${DOCS_PATH}!`);
  }

  private _traverseChild(child: JSONOutput.DeclarationReflection) {
    let block: Record<string, any> = {
      name: child.name,
      kind: child.kindString,
    };

    if (child.comment !== undefined) block.comment = child.comment;

    // switch by getters
    switch (child.kind) {
      case ReflectionKind.Class:
        {
          if (!child.children) break;

          block.children = [];
          for (const ch of child.children) block.children.push(this._traverseChild(ch));
        }
        break;

      case ReflectionKind.Constructor:
        {
          const result = ConstructorSerializer.serialize(child);
          block = {
            ...block,
            ...result,
          };
        }
        break;

      case ReflectionKind.Property:
        {
          const result = PropertySerializer.serialize(child);
          block = {
            ...block,
            ...result,
          };
        }
        break;

      case ReflectionKind.Variable:
        {
          const result = VariableSerializer.serialize(child);
          block = {
            ...block,
            ...result,
          };
        }
        break;

      case ReflectionKind.Enum:
        {
          const result = EnumSerializer.serialize(child);
          block = {
            ...block,
            ...result,
          };
        }
        break;

      case ReflectionKind.Function:
        {
          const result = FunctionSerializer.serialize(child);
          block = {
            ...block,
            ...result,
          };
        }
        break;

      case ReflectionKind.Method:
        {
          const result = MethodSerializer.serialize(child);
          block = {
            ...block,
            ...result,
          };
        }
        break;

      case ReflectionKind.Accessor:
        {
          if (child.getSignature !== undefined) {
            const result = GetterSerializer.serialize(child.getSignature as any);
            block.getters = result;
          }

          if (child.setSignature !== undefined) {
            const result = SetterSerializer.serialize(child.setSignature as any);
            block.setters = result;
          }
        }
        break;

      case ReflectionKind.TypeAlias:
        {
          const result = TypeAliasSerializer.serialize(child);
          block = {
            ...block,
            ...result,
          };
        }
        break;

      case ReflectionKind.Interface:
        {
          if (!child.children) break;

          block.children = [];
          for (const ch of child.children) block.children.push(this._traverseChild(ch));
        }
        break;

      default:
        this.logger.warn(`Unknown ${child.kindString}: ${child.name}`);
        break;
    }

    return block;
  }
}
