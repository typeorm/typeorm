import {ExpressionBuilder} from "../../Expression";

export const CurrentTime = () => new CurrentTimeBuilder();

export class CurrentTimeBuilder extends ExpressionBuilder {
    build = () => "CURRENT_TIME";
}
