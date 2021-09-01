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

import isValidIdentifier from 'is-valid-identifier';
import { relative, resolve } from 'path';
import ts from 'typescript';

/** @internal */
// Source: https://github.com/TypeStrong/typedoc/blob/master/src/lib/utils/options/readers/tsconfig.ts#L46-L63
export const getTsConfig = (path: string): [fatal: boolean, parsed: ts.ParsedCommandLine | null] => {
  let fatal = false;

  const tsconfig = ts.getParsedCommandLineOfConfigFile(
    path,
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: () => {
        fatal = true;
      },
    }
  );

  return [fatal, tsconfig ?? null];
};

// This is from https://github.com/addaleax/gen-esm-wrapper/blob/master/gen-esm-wrapper.js
// I wish there was a programmatic version of this library, but there is not. :(
export const cjsToEsm = (source: string, target: string, relPath: string) => {
  const cjsSource = require.resolve(source);
  const mod = require(cjsSource);
  const keys = new Set(Object.getOwnPropertyNames(mod));

  keys.delete('__esModule');
  if (typeof mod === 'function') {
    for (const key of ['length', 'prototype', 'name', 'caller']) keys.delete(key);
  } else if (typeof mod !== 'object' || mod === null) {
    keys.clear();
  }

  if (!relPath.startsWith('./') && !relPath.startsWith('../') && relPath !== '..') relPath = `./${relPath}`;
  let output = `import mod from ${JSON.stringify(relPath)};`;

  output += '\n'; // \n > \r\n
  for (const key of [...keys].sort()) {
    if (isValidIdentifier(key)) output += `export const ${key} = mod.${key};\n`;
  }

  output += '\nexport default mod;';
  return output;
};
