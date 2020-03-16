import {EntityMetadata} from "./EntityMetadata";
import {ColumnMetadata} from "./ColumnMetadata";
import {TemporalMetadataArgs} from "../metadata-args/TemporalMetadataArgs";

/**
 * Index metadata contains all information about table's index.
 */
export class TemporalMetadata {

    // ---------------------------------------------------------------------
    // Public Properties
    // ---------------------------------------------------------------------
    /**
     * Entity metadata of the class to which this index is applied.
     */
    entityMetadata: EntityMetadata;

    /**
     * Historical table name. The default would be table name + '_historical' suffix.
     */
    historicalTableName?: string;

    /**
     * System Start time column name.
     * The DB uses this columns to sets the value for the SysStartTime column to the begin time of the current
     * transaction.
     */
    sysStartTimeColumnName: string;

    /**
     * The DB sets the value for the SysStartTime column to the begin time of the current transaction (in the UTC time zone) based on the system clock which uses GETUTCDATE() function by default, you user wants to use custom function or doesn't need UTC time he can pass function name as a parameter.
     */
    getDateFunction?: string;

    /**
     * System End time column name.
     *
     */
    sysEndTimeColumnName: string;

    /**
     * what precision use for sysStart/End columns
    */
   precision?: number;


    defaultColumnSettings: object = {
        type: "datetime2",
        nullable: false,
        select: true,
        insert: true,
        update: true,
        precision: 3
    };

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(entityMetadata: EntityMetadata, args: TemporalMetadataArgs) {
        this.entityMetadata = entityMetadata;
        this.historicalTableName = args.historicalTableName;
        this.sysStartTimeColumnName = args.sysStartTimeColumnName;
        this.sysEndTimeColumnName = args.sysEndTimeColumnName;
        this.getDateFunction = args.getDateFunction;
        this.precision = args.precision;
    }

    // ---------------------------------------------------------------------
    // Public Build Methods
    // ---------------------------------------------------------------------

    /**
     * Builds entity column properties and parse default values.
     */
    build(): this {
        if (!(this.entityMetadata.columns.some((c: ColumnMetadata) => this.sysStartTimeColumnName === c.propertyName))) {
            if (this.precision !== undefined) {
                Object.assign(this.defaultColumnSettings, { scale: this.precision });
            }
            const startTimeColumn: ColumnMetadata = new ColumnMetadata({
                connection: this.entityMetadata.connection,
                entityMetadata: this.entityMetadata,
                args: {
                    target: this.entityMetadata.target,
                    mode: "regular",
                    propertyName: this.sysStartTimeColumnName,
                    options: this.defaultColumnSettings
                }
            }).build(this.entityMetadata.connection);
            this.entityMetadata.registerColumn(startTimeColumn);
        }


        if (!(this.entityMetadata.columns.some((c: ColumnMetadata) => this.sysEndTimeColumnName === c.propertyName))) {
            const endTimeColumn: ColumnMetadata = new ColumnMetadata({
                connection: this.entityMetadata.connection,
                entityMetadata: this.entityMetadata,
                args: {
                    target: this.entityMetadata.target,
                    mode: "regular",
                    propertyName: this.sysEndTimeColumnName,
                    options: this.defaultColumnSettings
                }
            }).build(this.entityMetadata.connection);
            this.entityMetadata.registerColumn(endTimeColumn);
        }
        return this;
    }

}