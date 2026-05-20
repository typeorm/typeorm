import { BaseQueryRunnerHelper } from "../BaseQueryRunnerHelper";

export class OracleQueryRunner extends BaseQueryRunnerHelper {
    async alterColumnType(table: any, column: any, newColumn: any) {
        const query = `ALTER TABLE "${table.name}" MODIFY ("${column.name}" ${newColumn.type})`;
        await this.query(query);
    }
}
