import { TypeCompatibilityRegistry, TransitionClass } from '../../migration/TypeCompatibilityRegistry';
import { ColumnValueHandler } from '../../migration/ColumnValueHandler';

// ... (Existing imports)

export class PostgresQueryRunner extends QueryRunner {
    // ... (Existing methods)

    private async generateColumnAlteration(column: any, newColumn: any, options: any) {
        const fromType = ColumnValueHandler.canonicalizeType(column.type);
        const toType = ColumnValueHandler.canonicalizeType(newColumn.type);
        const fromLength = ColumnValueHandler.normalizeNumeric(column.length);
        const toLength = ColumnValueHandler.normalizeNumeric(newColumn.length);

        const transition = TypeCompatibilityRegistry.getTransitionClass(fromType, toType, fromLength, toLength);
        const upQueries: string[] = [];
        const downQueries: string[] = [];
        const deferredDownQueries: string[] = [];

        if (transition === TransitionClass.INCOMPATIBLE) {
            // Fallback to legacy DROP+ADD for fundamentally different types
            return this.generateDropAddSequence(column, newColumn);
        }

        if (transition === TransitionClass.NARROW && !options.migrationsAllowLossyAlter) {
            throw new Error(`Narrowing migration detected for column ${column.name}. Set migrationsAllowLossyAlter: true to permit potential data loss.`);
        }

        // PHASE 2: Execute - Implement Zero-Loss Default Guard
        if (column.default !== undefined) {
            upQueries.push(`ALTER TABLE "${column.tableName}" ALTER COLUMN "${column.name}" DROP DEFAULT`);
        }

        upQueries.push(`ALTER TABLE "${column.tableName}" ALTER COLUMN "${column.name}" TYPE ${newColumn.type}${newColumn.length ? `(${newColumn.length})` : ''}`);

        if (newColumn.default !== undefined) {
            upQueries.push(`ALTER TABLE "${column.tableName}" ALTER COLUMN "${column.name}" SET DEFAULT ${newColumn.default}`);
        }

        // Symmetrical Rollback: Inverse of the UP sequence
        if (newColumn.default !== undefined) {
            downQueries.push(`ALTER TABLE "${column.tableName}" ALTER COLUMN "${column.name}" DROP DEFAULT`);
        }
        downQueries.push(`ALTER TABLE "${column.tableName}" ALTER COLUMN "${column.name}" TYPE ${column.type}${column.length ? `(${column.length})` : ''}`);
        if (column.default !== undefined) {
            downQueries.push(`ALTER TABLE "${column.tableName}" ALTER COLUMN "${column.name}" SET DEFAULT ${column.default}`);
        }

        return { upQueries, downQueries, deferredDownQueries };
    }

    private async handleRename(column: any, newName: string) {
        const up = `ALTER TABLE "${column.tableName}" RENAME COLUMN "${column.name}" TO "${newName}"`;
        const down = `ALTER TABLE "${column.tableName}" RENAME COLUMN "${newName}" TO "${column.name}"`;
        
        // Constraint 1: Deferred Down-Query Queue
        // We return the down query separately to be pushed to the end of the array
        return { up, deferredDown: down };
    }
}
