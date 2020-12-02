import { ExpressionBuilder } from "../../Expression";

export const Default = () => new DefaultBuilder();

export class DefaultBuilder extends ExpressionBuilder {
    build = () => "DEFAULT";
}
