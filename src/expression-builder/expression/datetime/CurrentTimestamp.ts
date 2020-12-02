import { ExpressionBuilder } from "../../Expression";

export const CurrentTimestamp = () => new CurrentTimestampBuilder();

export class CurrentTimestampBuilder extends ExpressionBuilder {
    build = () => "CURRENT_TIMESTAMP";
}
