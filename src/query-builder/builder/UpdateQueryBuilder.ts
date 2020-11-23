import {CockroachDriver} from "../../driver/cockroachdb/CockroachDriver";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {QueryRunner} from "../../query-runner/QueryRunner";
import {SqlServerDriver} from "../../driver/sqlserver/SqlServerDriver";
import {PostgresDriver} from "../../driver/postgres/PostgresDriver";
import {UpdateResult} from "../result/UpdateResult";
import {ReturningResultsEntityUpdator} from "../ReturningResultsEntityUpdator";
import {BroadcasterResult} from "../../subscriber/BroadcasterResult";
import {OracleDriver} from "../../driver/oracle/OracleDriver";
import {UpdateValuesMissingError} from "../../error/UpdateValuesMissingError";
import {QueryDeepPartialEntity} from "../QueryPartialEntity";
import {ModificationQueryBuilder} from "./ModificationQueryBuilder";

/**
 * Allows to build complex sql queries in a fashion way and execute those queries.
 */
export class UpdateQueryBuilder<Entity> extends ModificationQueryBuilder<Entity, UpdateResult> {

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Values needs to be updated.
     */
    set(values: QueryDeepPartialEntity<Entity>): this {
        this.expressionMap.valuesSet = values;
        return this;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Creates list of columns and their values that are SET in the UPDATE expression.
     */
    protected createColumnValuesExpression(): string {
        const valuesSet = this.getValueSet();
        const metadata = this.expressionMap.mainAlias!.hasMetadata ? this.expressionMap.mainAlias!.metadata : undefined;

        const newParameters: ObjectLiteral = {};
        let parametersCount = this.connection.driver.hasIndexedParameters()
            ? Object.keys(this.expressionMap.nativeParameters).length : 0;

        const updatedColumns: (string | ColumnMetadata)[] =
            !metadata ? Object.keys(valuesSet) : metadata.extractColumnsInEntity(valuesSet)
                .filter(column => column.isUpdate);

        const columnValuesExpressions = updatedColumns.map(columnOrKey => {
            const column = columnOrKey instanceof ColumnMetadata ? columnOrKey : undefined;
            const columnName = column ? column.databaseName : columnOrKey as string;
            const value = column ? column.getEntityValue(valuesSet) : valuesSet[columnOrKey as string];

            const paramName = `upd_${columnName}`; // TODO: Improve naming
            const createParamExpression = (value: any) => {
                if (!this.connection.driver.hasIndexedParameters()) {
                    newParameters[paramName] = value;
                } else {
                    this.expressionMap.nativeParameters[paramName] = value;
                }
                return this.connection.driver.createParameter(paramName, parametersCount++);
            };

            const expression = this.createColumnValuePersistExpression(column, value, createParamExpression);
            return `${this.escape(columnName)} = ${expression}`;
        });

        if (metadata) {
            if (metadata.versionColumn && !updatedColumns.includes(metadata.versionColumn as any))
                columnValuesExpressions.push(this.escape(metadata.versionColumn.databaseName) + " = " + this.escape(metadata.versionColumn.databaseName) + " + 1");
            if (metadata.updateDateColumn && !updatedColumns.includes(metadata.updateDateColumn))
                columnValuesExpressions.push(this.escape(metadata.updateDateColumn.databaseName) + " = CURRENT_TIMESTAMP"); // todo: fix issue with CURRENT_TIMESTAMP(6) being used, can "DEFAULT" be used?!
        }

        if (columnValuesExpressions.length <= 0) {
            throw new UpdateValuesMissingError();
        }

        // we re-write parameters this way because we want our "UPDATE ... SET" parameters to be first in the list of "nativeParameters"
        // because some drivers like mysql depend on order of parameters
        if (!this.connection.driver.hasIndexedParameters()) {
            this.expressionMap.nativeParameters = Object.assign(newParameters, this.expressionMap.nativeParameters);
        }

        return columnValuesExpressions.join(", ");
    }

    /**
     * Gets array of values need to be inserted into the target table.
     */
    protected getValueSet(): ObjectLiteral {
        if (this.expressionMap.valuesSet instanceof Object)
            return this.expressionMap.valuesSet;

        throw new UpdateValuesMissingError();
    }

    // -------------------------------------------------------------------------
    // Protected Implemented Methods
    // -------------------------------------------------------------------------

    /**
     * Creates UPDATE expression used to perform query.
     */
    protected createModificationExpression() {
        const tableName = this.getTableName(this.getMainTableName());
        const valuesExpression = this.createColumnValuesExpression();
        const whereExpression = this.createWhereExpression();
        const returningExpression = this.createReturningExpression();

        const query = ["UPDATE", tableName, "SET", valuesExpression];

        // add OUTPUT expression
        if (returningExpression && this.connection.driver instanceof SqlServerDriver) {
            query.push("OUTPUT", returningExpression);
        }

        // add WHERE expression
        if (whereExpression) query.push(whereExpression);

        // add RETURNING expression
        if (returningExpression && (this.connection.driver instanceof PostgresDriver || this.connection.driver instanceof OracleDriver || this.connection.driver instanceof CockroachDriver)) {
            query.push("RETURNING", returningExpression);
        }

        return query.join(" ");
    }

    /**
     * Executes sql generated by query builder and returns raw database results.
     */
    protected async executeInsideTransaction(queryRunner: QueryRunner): Promise<UpdateResult> {
        let declareSql: string | null = null;
        let selectOutputSql: string | null = null;

        // if update entity mode is enabled we may need extra columns for the returning statement
        const returningResultsEntityUpdator = new ReturningResultsEntityUpdator(queryRunner, this.expressionMap);
        if (this.expressionMap.updateEntity === true &&
            this.expressionMap.mainAlias!.hasMetadata &&
            this.expressionMap.whereEntities.length > 0) {
            this.expressionMap.extraReturningColumns = returningResultsEntityUpdator.getUpdationReturningColumns();

            if (this.expressionMap.extraReturningColumns.length > 0 && this.connection.driver instanceof SqlServerDriver) {
                declareSql = this.connection.driver.buildTableVariableDeclaration("@OutputTable", this.expressionMap.extraReturningColumns);
                selectOutputSql = `SELECT * FROM @OutputTable`;
            }
        }

        // execute query
        const [updateSql, parameters] = this.getQueryAndParameters();
        const updateResult = new UpdateResult();
        const statements = [declareSql, updateSql, selectOutputSql];
        const result = await queryRunner.query(
            statements.filter(sql => sql != null).join(";\n\n"),
            parameters,
        );
        queryRunner.processUpdateQueryResult(result, updateResult);

        // if we are updating entities and entity updation is enabled we must update some of entity columns (like version, update date, etc.)
        if (this.expressionMap.updateEntity === true &&
            this.expressionMap.mainAlias!.hasMetadata &&
            this.expressionMap.whereEntities.length > 0) {
            await returningResultsEntityUpdator.update(updateResult, this.expressionMap.whereEntities);
        }

        return updateResult;
    }

    protected executeBeforeQueryBroadcast(queryRunner: QueryRunner, broadcastResult: BroadcasterResult) {
        queryRunner.broadcaster.broadcastBeforeUpdateEvent(broadcastResult, this.expressionMap.mainAlias!.metadata, this.expressionMap.valuesSet);
    }

    protected executeAfterQueryBroadcast(queryRunner: QueryRunner, broadcastResult: BroadcasterResult, result: UpdateResult) {
        queryRunner.broadcaster.broadcastAfterUpdateEvent(broadcastResult, this.expressionMap.mainAlias!.metadata);
    }
}
