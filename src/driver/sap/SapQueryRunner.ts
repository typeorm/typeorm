import { BaseQueryRunnerHelper, AlterSafety } from "../BaseQueryRunnerHelper";

export class SapQueryRunner extends BaseQueryRunnerHelper {
    async alterColumn(table: any, column: any, newColumn: any) {
        const safety = BaseQueryRunnerHelper.isSafeAlter(column, newColumn);
        
        if (safety === AlterSafety.SHRINKING) {
            const tempColName = `${column.name}_tmp`;
            await this.query(`ALTER TABLE "${table.name}" ADD ("${tempColName}" ${newColumn.type})`);
            await this.query(`UPDATE "${table.name}" SET "${tempColName}" = "${column.name}"`);
            await this.query(`ALTER TABLE "${table.name}" DROP ("${column.name}")`);
            await this.query(`ALTER TABLE "${table.name}" RENAME COLUMN "${tempColName}" TO "${column.name}"`);
            return;
        }
        
        await this.query(`ALTER TABLE "${table.name}" ALTER ("${column.name}" ${newColumn.type})`);
    }
}
