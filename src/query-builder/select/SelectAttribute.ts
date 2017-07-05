import {QueryExpressionMap} from "../QueryExpressionMap";
import {SelectQueryBuilder} from "../SelectQueryBuilder";

/**
 */
export class SelectAttribute {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    alias?: string;

    mapToProperty: string;

    queryBuilderFactory?: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private expressionMap: QueryExpressionMap) {
    }


}