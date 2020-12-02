import { ExpressionBuilder } from "../../Expression";

export const Null = () => new NullBuilder();

export class NullBuilder extends ExpressionBuilder {
    build = () => "NULL";
}
