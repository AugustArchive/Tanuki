import { JSONOutput } from 'typedoc';
import { is } from './is';

/** @internal */
// credit: https://github.com/dbots-pkg/ts-docgen/blob/main/src/util/types.ts#L78
export const parseType = (type: JSONOutput.SomeType) => {
  if (is.arrayType(type)) return `${parseType(type.elementType)}[]`;
  if (is.conditional(type)) {
    const { trueType, falseType, extendsType, checkType } = type;
    return `${parseType(checkType)} extends ${parseType(extendsType)} ? ${parseType(trueType)} : ${parseType(
      falseType
    )}`;
  }

  if (is.indexedAccess(type)) return `${parseType(type.objectType)}[${parseType(type.indexType)}]`;
  if (is.intersection(type)) return type.types.map(parseType).join(' & ');
  if (is.predicate(type))
    return `${type.asserts ? 'asserts ' : ''}${type.name}${type.targetType ? ` is ${parseType(type.targetType)}` : ''}`;

  if (is.reference(type))
    return `${type.name}${type.typeArguments !== undefined ? `<${type.typeArguments.map(parseType).join(', ')}>` : ''}`;

  if (is.reflection(type)) {
    const block: Record<string, any> = {};
    const { children, signatures } = type.declaration!;
    if (children && children.length > 0) {
      for (let i = 0; i < children.length; i++) {
        const { type } = children[i];
        if (type) block[children[i].name] = parseType(type);
      }

      return `{\n${Object.keys(block)
        .map((k) => `${k}: ${block[k]}`)
        .join(',\n')}\n}`;
    }

    if (signatures && signatures.length > 0) {
      const list: string[] = [];

      for (let i = 0; i < signatures.length; i++) {
        const signature = signatures[i];
        const params = signature.parameters?.map(
          (param) => `${param.name}: ${param.type ? parseType(param.type) : 'unknown'}`
        );

        list.push(
          `(${params?.join(', ') ?? '...args: any[]'}) => ${signature.type ? parseType(signature.type) : 'unknown'}`
        );
      }

      return list.join('\n');
    }

    return '{}';
  }

  if (is.literal(type)) {
    if (typeof type.value === 'string') return `'${type.value}'`;
    return String(type.value);
  }

  if (is.tuple(type)) return `[${(type.elements ?? []).map(parseType).join(', ')}]`;
  if (is.typeOperator(type)) return `${type.operator} ${parseType(type.target)}`;
  if (is.union(type))
    return type.types
      .map(parseType)
      .filter((s) => Boolean(s) && s.trim().length > 0)
      .join(' | ');

  if (is.inferred(type) || is.intrinsic(type) || is.unknown(type)) return type.name;

  return 'unknown';
};
