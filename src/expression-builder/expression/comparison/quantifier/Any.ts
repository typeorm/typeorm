import {Expression} from "../../../Expression";
import {QuantifierBuildable} from "./Quantifier";
import {AllBuildable} from "./All";

export const Any = (values: Expression) => new AnyBuildable(values);

export class AnyBuildable extends QuantifierBuildable {
    get quantifier(): string { return "ANY"; }
    negate = () => new AllBuildable(this.values);
}
