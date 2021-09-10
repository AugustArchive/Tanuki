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

export const MethodSerializer: DocSerializer = {
  serialize(decl) {
    const result: Record<string, any> = {
      signatures: [],
    };

    if (decl.signatures && decl.signatures.length > 0) {
      for (const signature of decl.signatures) {
        const res: Record<string, any> = {
          type: {
            type: signature.type,
            value: parseType(signature.type!),
          },

          as_string: `${signature.name}${
            signature.parameters !== undefined
              ? `(${signature.parameters
                  .map((param) => `${param.name}: ${parseType(param.type!)}`)
                  .join(', ')}): ${parseType(signature.type!)}`
              : `(): ${parseType(signature.type!)}`
          }`,

          params: signature.parameters?.map((param) => {
            const h: Record<string, any> = {
              name: param.name,
              type: {
                type: param.type,
                value: parseType(param.type!),
              },

              default_value: param.defaultValue,
            };

            if (param.comment !== undefined) h.comment = param.comment;
            return h;
          }),

          return_type: {
            type: signature.type,
            value: parseType(signature.type!),
          },
        };

        if (signature.comment !== undefined) res.comment = signature.comment;

        result.signatures.push(res);
      }
    }

    return result;
  },
};
