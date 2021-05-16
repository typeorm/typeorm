import {WhereExpression} from "./WhereExpression";

/**
 * Syntax sugar.
 * Allows to use brackets in WHERE expressions for better syntax.
 */
export class Brackets {

    /**
     * WHERE expression that will be taken into brackets.
     */
    whereFactory: (qb: WhereExpression) => any;

    /**
     * Given WHERE query builder that will build a WHERE expression that will be taken into brackets.
     */
    constructor(whereFactory: (qb: WhereExpression) => any) {
        this.whereFactory = whereFactory;
    }

}