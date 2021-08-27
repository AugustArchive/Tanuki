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

import { isObject } from '@augu/utils';
import * as child from 'child_process';

/**
 * Utility class to work with executing terminal commands for async
 * and synchronous use.
 *
 * @internal
 */
export default class Shell {
  private constructor() {
    throw new Error('Cannot construct instances of arisu.Shell');
  }

  /**
   * Executes a shell command synchronously
   * @param command The command to execute
   * @returns The stdout of the command result or a {@link SyntaxError} has been thrown.
   */
  static exec(command: string): string;

  /**
   * Executes a shell command synchronously
   * @param command The command to execute
   * @param args The arguments to use
   * @returns The stdout of the command result or a {@link SyntaxError} has been thrown.
   */
  static exec(command: string, args?: string[]): string;

  /**
   * Runs a shell command synchronously
   * @param command The command to execute
   * @param options Any additional options to execute
   * @param args The arguments to use
   * @returns The stdout of the command result or a {@link SyntaxError} has been thrown.
   */
  static exec(command: string, options: child.ExecOptions, args?: string[]): string;
  static exec(command: string, argsOrOptions?: string[] | child.ExecOptions, args?: string[]) {
    let result: string | SyntaxError = '';
    const list = argsOrOptions !== undefined ? (Array.isArray(argsOrOptions) ? argsOrOptions : args ?? []) : args ?? [];
    const options = argsOrOptions !== undefined && isObject<child.ExecOptions>(argsOrOptions) ? argsOrOptions : {};

    child.exec(`${command}${list.length > 0 ? ` ${list.join(' ')}` : ''}`, options, (error, stdout, stderr) => {
      if (error !== null)
        result = new SyntaxError(`Unable to run "${command}${list.length > 0 ? ` ${list.join(' ')}` : ''}": ${stderr}`);
      else result = stdout;
    });

    if ((result as any) instanceof SyntaxError) throw result;

    return result;
  }
}
