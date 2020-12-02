import {ExpressionBuilder} from "../../Expression";

export const CurrentDate = () => new CurrentDateBuilder();

export class CurrentDateBuilder extends ExpressionBuilder {
    build = () => "CURRENT_DATE";
}
