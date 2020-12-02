import {Expression} from "../../../Expression";
import {QuantifierBuildable} from "./Quantifier";
import {AllBuildable} from "./All";

export const Some = (values: Expression) => new SomeBuildable(values);

export class SomeBuildable extends QuantifierBuildable {
    get quantifier(): string { return "SOME"; }
    negate = () => new AllBuildable(this.values);
}
