import {FindOperator} from "../FindOperator";

/**
 * Find Options Operator.
 * Example: { someField: Raw([...]) }
 * Example: { someField: Raw((columnAlias) => `${columnAlias} = 5`) }
 * 
 * For escaping parameters use next syntax:
 * Example: { someField: Raw((columnAlias, parameters) => `${columnAlias} = ${parameters[0]}`, [5]) }
 */
export function Raw<T>(
    valueOrSqlGenerator: string | ((columnAlias: string, parameters: string[]) => string),
    sqlGeneratorParameters?: any[],
): FindOperator<any> {
    if (typeof valueOrSqlGenerator === 'function') {
        return new FindOperator("raw", sqlGeneratorParameters || [], true, true, valueOrSqlGenerator);   
    } else {
        return new FindOperator("raw", valueOrSqlGenerator, false);
    }    
}
