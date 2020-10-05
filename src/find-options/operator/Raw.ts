import {FindOperator} from "../FindOperator";
import {ObjectLiteral} from "../../common/ObjectLiteral";

/**
 * Find Options Operator.
 * Example: { someField: Raw("12") }
 */
export function Raw<T>(value: string): FindOperator<any>;

/**
 * Find Options Operator.
 * Example: { someField: Raw((columnAlias) => `${columnAlias} = 5`) }
 */
export function Raw<T>(sqlGenerator: ((columnAlias: string) => string)): FindOperator<any>;

/**
 * Find Options Operator.
 * For escaping parameters use next syntax:
 * Example: { someField: Raw((columnAlias, parameters) => `${columnAlias} = ${parameters[0]}`, [5]) }
 */
export function Raw<T>(sqlGenerator: ((columnAlias: string, parameters: any[]) => string), parameters: any[]): FindOperator<any>;

/**
 * Find Options Operator.
 * For escaping parameters use next syntax:
 * Example: { someField: Raw((columnAlias) => `${columnAlias} = :value`, { value: 5 }) }
 */
export function Raw<T>(sqlGenerator: ((columnAlias: string) => string), parameters: ObjectLiteral): FindOperator<any>;

export function Raw<T>(
    valueOrSqlGenerator: string | ((columnAlias: string, parameters: any[]) => string),
    sqlGeneratorParameters?: any[] | ObjectLiteral,
): FindOperator<any> {
    if (typeof valueOrSqlGenerator !== 'function') {
        return new FindOperator("raw", valueOrSqlGenerator, false);
    }

    if (!sqlGeneratorParameters) {
        return new FindOperator("raw", [], true, true, valueOrSqlGenerator);
    }

    if (Array.isArray(sqlGeneratorParameters)) {
        return new FindOperator("raw", sqlGeneratorParameters, true, true, valueOrSqlGenerator);
    }
    
    return new FindOperator("raw", [], true, true, valueOrSqlGenerator, sqlGeneratorParameters);
}
