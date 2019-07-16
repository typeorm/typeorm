import {WhereExpression} from "./WhereExpression";

export interface BracketOptions {
    negate?: boolean;
}

/**
 * Syntax sugar.
 * Allows to use brackets in WHERE expressions for better syntax.
 */
export class Brackets {
    
    /**
     * Signals the brackets to be enclosed with NOT 
     */
    negate?: boolean;

    /**
     * WHERE expression that will be taken into brackets.
     */
    whereFactory: (qb: WhereExpression) => any;

    /**
     * Given WHERE query builder that will build a WHERE expression that will be taken into brackets.
     */
    constructor(whereFactory: (qb: WhereExpression) => any, options: BracketOptions = {}) {
        this.whereFactory = whereFactory;
        this.negate = options.negate;
    }

}