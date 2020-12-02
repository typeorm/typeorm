import {ExpressionBuilder} from "../Expression";
import {ExpressionBuildInterface} from "../ExpressionBuildInterface";
import {ObjectLiteral} from "../../common/ObjectLiteral";

export function Raw(value: string, parameters?: ObjectLiteral): RawBuilder;
/** @deprecated */
export function Raw(generator: (columnAlias: string) => string, parameters?: ObjectLiteral): RawGeneratorBuilder;
export function Raw(valueOrGenerator: string | ((columnAlias: string) => string), parameters?: ObjectLiteral): RawBuilder | RawGeneratorBuilder {
    if (typeof valueOrGenerator === "function") return new RawGeneratorBuilder(valueOrGenerator, parameters);
    return new RawBuilder(valueOrGenerator);
}
export function r(strings: TemplateStringsArray, ...args: any[]) {
    return Raw(strings.map((s, i) => i === args.length ? s : s + args[i]).join(""));
}

export class RawBuilder extends ExpressionBuilder {
    constructor(readonly value: string, readonly parameters?: ObjectLiteral) {
        super();
    }

    build = (eb: ExpressionBuildInterface, ctx: any): string => eb.buildRaw(ctx, this.value, this.parameters);
}

export class RawGeneratorBuilder extends ExpressionBuilder {
    constructor(readonly generator: (columnAlias: string) => string, readonly parameters?: ObjectLiteral) {
        super();
    }

    get columnComparator(): boolean { return true; };

    build = (eb: ExpressionBuildInterface, ctx: any) =>
        eb.buildRaw(ctx, this.generator(eb.buildColumn(ctx)), this.parameters);
}
