import type { JSONOutput } from 'typedoc';
import { isObject } from '@augu/utils';

/**
 * Represents functions of determining if anything is that property related to
 * typedoc.
 *
 * @internal
 */
// credit: https://github.com/dbots-pkg/ts-docgen/blob/main/src/util/types.ts#L4-L57
// eslint-disable-next-line
export namespace is {
  function createIsType(value: unknown, type: string) {
    return isObject(value) && (value as any).type === type;
  }

  export const arrayType = (value: unknown): value is JSONOutput.ArrayType => createIsType(value, 'array');
  export const conditional = (value: unknown): value is JSONOutput.ConditionalType =>
    createIsType(value, 'conditional');

  export const indexedAccess = (value: unknown): value is JSONOutput.IndexedAccessType =>
    createIsType(value, 'indexedAccess');

  export const inferred = (value: unknown): value is JSONOutput.InferredType => createIsType(value, 'inferred');
  export const intersection = (value: unknown): value is JSONOutput.IntersectionType =>
    createIsType(value, 'intersection');

  export const intrinsic = (value: unknown): value is JSONOutput.IntrinsicType => createIsType(value, 'intrinsic');
  export const predicate = (value: unknown): value is JSONOutput.PredicateType => createIsType(value, 'predicate');
  export const reference = (value: unknown): value is JSONOutput.ReferenceType => createIsType(value, 'reference');
  export const reflection = (value: unknown): value is JSONOutput.ReflectionType => createIsType(value, 'reflection');
  export const literal = (value: unknown): value is JSONOutput.LiteralType => createIsType(value, 'literal');
  export const tuple = (value: unknown): value is JSONOutput.TupleType => createIsType(value, 'tuple');
  export const typeOperator = (value: unknown): value is JSONOutput.TypeOperatorType =>
    createIsType(value, 'typeOperator');

  export const union = (value: unknown): value is JSONOutput.UnionType => createIsType(value, 'union');
  export const unknown = (value: unknown): value is JSONOutput.UnknownType => createIsType(value, 'unknown');
}
