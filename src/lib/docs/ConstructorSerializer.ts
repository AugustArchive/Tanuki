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

import { DocSerializer } from './DocSerializer';
import { parseType } from './util/parse';
import consola from 'consola';

export const ConstructorSerializer: DocSerializer = {
  serialize(declaration) {
    const log = consola.withScope('tanuki:serialization:constructor');
    const result: Record<string, any> = {
      signatures: [],
    };

    for (const signature of declaration.signatures!) {
      if (signature.type === undefined) {
        log.warn('unable to retrieve type for constructor signature:', JSON.stringify(signature, null, 2));
        continue;
      }

      const sign: Record<string, any> = {
        type: {
          type: signature.type!.type,
          value: parseType(signature.type!),
        },

        as_string: `${signature.name}${
          signature.parameters !== undefined
            ? `(${signature.parameters.map((param) => `${param.name}: ${parseType(param.type!)}`).join(', ')})`
            : '()'
        }`,
      };

      if (signature.comment !== undefined) sign.comment = signature.comment;
      result.signatures.push(sign);
    }

    if (declaration.comment !== undefined) result.comment = declaration.comment;
    return result;
  },
};
