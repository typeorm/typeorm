import {Exp, Expression, ExpressionBuilder} from "../../Expression";
import {OperatorBuilder} from "../Operator";
import {Conditions} from "../Conditions";
import {isPlainObjectConditions} from "../../ExpressionUtils";

export function DistributiveOperatorGen<T extends DistributiveOperatorBuilder>(
    builder: () => { new (operands: [...Expression[]]): T }
): (...expressions: any[]) => T | ExpressionBuilder {
    return (...expressions: any[]): T | ExpressionBuilder => {
        const mapped = expressions
            .map(e => isPlainObjectConditions(e) ? Conditions(e) : e)
            .flatMap(e => e instanceof builder() ? e.operands : e);

        if (mapped.length === 0) throw new Error("No expressions passed to distributive operator"); // TODO: CRITICAL
        if (mapped.length === 1) return mapped[0] instanceof ExpressionBuilder ? mapped[0] : Exp(mapped[0]);
        return new (builder())(mapped);
    };
}

export abstract class DistributiveOperatorBuilder extends OperatorBuilder<any[]> {}
