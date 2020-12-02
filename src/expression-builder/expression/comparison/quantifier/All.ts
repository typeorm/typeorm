import {Expression} from "../../../Expression";
import {QuantifierBuildable} from "./Quantifier";
import {AnyBuildable} from "./Any";

export const All = (values: Expression) => new AllBuildable(values);

export class AllBuildable extends QuantifierBuildable {
    get quantifier(): string { return "ALL"; }
    negate = () => new AnyBuildable(this.values);
}
