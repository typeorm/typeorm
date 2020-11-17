import {EntityTarget} from "../../common/EntityTarget";
import {MissingDeleteDateColumnError} from "../../error/MissingDeleteDateColumnError";
import {UpdateValuesMissingError} from "../../error/UpdateValuesMissingError";
import {EntitySchema} from "../../entity-schema/EntitySchema";
import {UpdateQueryBuilder } from "./UpdateQueryBuilder";

/**
 * Allows to build complex sql queries in a fashion way and execute those queries.
 */
export class SoftDeleteQueryBuilder<Entity> extends UpdateQueryBuilder<Entity> {

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Specifies FROM which entity's table select/update/delete/soft-delete will be executed.
     * Also sets a main string alias of the selection data.
     */
    from<T>(entityTarget: EntityTarget<T>, aliasName?: string): SoftDeleteQueryBuilder<T> {
        entityTarget = entityTarget instanceof EntitySchema ? entityTarget.options.name : entityTarget;
        const mainAlias = this.createFromAlias(entityTarget, aliasName);
        this.expressionMap.setMainAlias(mainAlias);
        return (this as any) as SoftDeleteQueryBuilder<T>;
    }

    // -------------------------------------------------------------------------
    // Protected Implemented Methods
    // -------------------------------------------------------------------------

    /**
     * Creates list of columns and their values that are SET in the UPDATE expression.
     */
    protected createColumnValuesExpression(): string {
        if (!this.expressionMap.mainAlias!.hasMetadata)
            throw new Error(`Cannot get entity metadata for the given alias "${this.expressionMap.mainAlias}"`);

        const metadata = this.expressionMap.mainAlias!.metadata;
        if (!metadata.deleteDateColumn)
            throw new MissingDeleteDateColumnError(metadata);

        const columnValuesExpressions: string[] = [];

        if (this.expressionMap.queryType === "soft-delete") {
            columnValuesExpressions.push(this.escape(metadata.deleteDateColumn.databaseName) + " = CURRENT_TIMESTAMP");
        } else if (this.expressionMap.queryType === "restore") {
            columnValuesExpressions.push(this.escape(metadata.deleteDateColumn.databaseName) + " = NULL");
        } else {
            throw new Error(`The queryType must be "soft-delete" or "restore"`);
        }

        if (metadata.versionColumn)
            columnValuesExpressions.push(this.escape(metadata.versionColumn.databaseName) + " = " + this.escape(metadata.versionColumn.databaseName) + " + 1");
        if (metadata.updateDateColumn)
            columnValuesExpressions.push(this.escape(metadata.updateDateColumn.databaseName) + " = CURRENT_TIMESTAMP"); // todo: fix issue with CURRENT_TIMESTAMP(6) being used, can "DEFAULT" be used?!

        if (columnValuesExpressions.length <= 0) {
            throw new UpdateValuesMissingError();
        }

        return columnValuesExpressions.join(", ");
    }
}
