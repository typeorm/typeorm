import {CockroachDriver} from "../../driver/cockroachdb/CockroachDriver";
import {EntityTarget} from "../../common/EntityTarget";
import {SqlServerDriver} from "../../driver/sqlserver/SqlServerDriver";
import {PostgresDriver} from "../../driver/postgres/PostgresDriver";
import {MissingDeleteDateColumnError} from "../../error/MissingDeleteDateColumnError";
import {OracleDriver} from "../../driver/oracle/OracleDriver";
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
     * Creates UPDATE expression used to perform query.
     */
    protected createModificationExpression() {
        const metadata = this.expressionMap.mainAlias!.hasMetadata ? this.expressionMap.mainAlias!.metadata : undefined;
        if (!metadata)
            throw new Error(`Cannot get entity metadata for the given alias "${this.expressionMap.mainAlias}"`);
        if (!metadata.deleteDateColumn) {
            throw new MissingDeleteDateColumnError(metadata);
        }

        // prepare columns and values to be updated
        const updateColumnAndValues: string[] = [];

        switch (this.expressionMap.queryType) {
            case "soft-delete":
                updateColumnAndValues.push(this.escape(metadata.deleteDateColumn.databaseName) + " = CURRENT_TIMESTAMP");
                break;
            case "restore":
                updateColumnAndValues.push(this.escape(metadata.deleteDateColumn.databaseName) + " = NULL");
                break;
            default:
                throw new Error(`The queryType must be "soft-delete" or "restore"`);
        }
        if (metadata.versionColumn)
            updateColumnAndValues.push(this.escape(metadata.versionColumn.databaseName) + " = " + this.escape(metadata.versionColumn.databaseName) + " + 1");
        if (metadata.updateDateColumn)
            updateColumnAndValues.push(this.escape(metadata.updateDateColumn.databaseName) + " = CURRENT_TIMESTAMP"); // todo: fix issue with CURRENT_TIMESTAMP(6) being used, can "DEFAULT" be used?!

        if (updateColumnAndValues.length <= 0) {
            throw new UpdateValuesMissingError();
        }

        // get a table name and all column database names
        const whereExpression = this.createWhereExpression();
        const returningExpression = this.createReturningExpression();

        // generate and return sql update query
        if (returningExpression && (this.connection.driver instanceof PostgresDriver || this.connection.driver instanceof OracleDriver || this.connection.driver instanceof CockroachDriver)) {
            return `UPDATE ${this.getTableName(this.getMainTableName())} SET ${updateColumnAndValues.join(", ")}${whereExpression} RETURNING ${returningExpression}`;
        } else if (returningExpression && this.connection.driver instanceof SqlServerDriver) {
            return `UPDATE ${this.getTableName(this.getMainTableName())} SET ${updateColumnAndValues.join(", ")} OUTPUT ${returningExpression}${whereExpression}`;
        } else {
            return `UPDATE ${this.getTableName(this.getMainTableName())} SET ${updateColumnAndValues.join(", ")}${whereExpression}`; // todo: how do we replace aliases in where to nothing?
        }
    }
}
