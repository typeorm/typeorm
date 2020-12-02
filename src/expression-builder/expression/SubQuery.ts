import {ExpressionBuilder} from "../Expression";
import {ExpressionBuildInterface} from "../ExpressionBuildInterface";
import {QueryBuilder} from "../../query-builder/builder/QueryBuilder";

export function SubQuery(generator: (qb: QueryBuilder<any>) => QueryBuilder<any>): SubQueryBuilder {
    return new SubQueryBuilder(generator);
}

export class SubQueryBuilder extends ExpressionBuilder {
    constructor(readonly generator: (qb: QueryBuilder<any>) => QueryBuilder<any>) {
        super();
    }

    build(eb: ExpressionBuildInterface, ctx: any): string {
        const qb = this.generator(eb.createSubQuery(ctx));
        const query = eb.buildSubQuery(ctx, qb);
        if (query.startsWith("(") && query.endsWith(")")) return query;
        return `(${query})`;
    }
}
