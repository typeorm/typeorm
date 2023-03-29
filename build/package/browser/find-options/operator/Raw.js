import { FindOperator } from "../FindOperator";
export function Raw(valueOrSqlGenerator, sqlGeneratorParameters) {
    if (typeof valueOrSqlGenerator !== 'function') {
        return new FindOperator("raw", valueOrSqlGenerator, false);
    }
    return new FindOperator("raw", [], true, true, valueOrSqlGenerator, sqlGeneratorParameters);
}

//# sourceMappingURL=Raw.js.map
