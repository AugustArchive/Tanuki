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

import { JSONOutput } from 'typedoc';

/**
 * Represents a serializer interface to provide serialization
 * between Typedoc and [docs.floofy.dev](https://github.com/Noelware/docs).
 *
 * @typeparam **T** The object that it's going to serialize
 */
export interface DocSerializer {
  /**
   * Serializes this {@link T object} and returns a JSON object about it.
   * @param obj The object to serialize
   * @return A JSON object blob
   */
  serialize(obj: JSONOutput.DeclarationReflection): Record<string, unknown>;
}

/**
 * Represents a serializer that serializes accessors.
 */
export interface DocAccessorSerializer {
  /**
   * Serializes this {@link JSONOutput.SignatureReflection object} and returns a JSON object about it.
   * @param obj The array to serialize
   * @return A JSON array blob
   */
  serialize(obj: JSONOutput.SignatureReflection[]): any[];
}
