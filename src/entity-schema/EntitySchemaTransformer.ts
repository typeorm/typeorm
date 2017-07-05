import {EntitySchema} from "./EntitySchema";
import {MetadataArgsStorage} from "../metadata-args/MetadataArgsStorage";
import {TableMetadataArgs} from "../metadata-args/TableMetadataArgs";
import {ColumnMetadataArgs} from "../metadata-args/ColumnMetadataArgs";
import {RelationMetadataArgs} from "../metadata-args/RelationMetadataArgs";
import {JoinColumnMetadataArgs} from "../metadata-args/JoinColumnMetadataArgs";
import {JoinTableMetadataArgs} from "../metadata-args/JoinTableMetadataArgs";
import {JoinTableOptions} from "../decorator/options/JoinTableOptions";
import {JoinTableMultipleColumnsOptions} from "../decorator/options/JoinTableMuplipleColumnsOptions";
import {ColumnMode} from "../metadata-args/types/ColumnMode";

/**
 * Transforms entity schema into metadata args storage.
 * The result will be just like entities read from decorators.
 */
export class EntitySchemaTransformer {

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Transforms entity schema into new metadata args storage object.
     */
    transform(schemas: EntitySchema[]): MetadataArgsStorage {
        const metadataArgsStorage = new MetadataArgsStorage();

        schemas.forEach(schema => {

            // add table metadata args from the schema
            const tableSchema = schema.table || {} as any;
            const table: TableMetadataArgs = {
                target: schema.target || schema.name,
                name: tableSchema.name,
                type: tableSchema.type || "regular",
                orderBy: tableSchema.orderBy
            };
            metadataArgsStorage.tables.push(table);

            // add columns metadata args from the schema
            Object.keys(schema.columns).forEach(columnName => {
                const columnSchema = schema.columns[columnName];
                let mode: ColumnMode = "regular";
                if (columnSchema.createDate)
                    mode = "createDate";
                if (columnSchema.updateDate)
                    mode = "updateDate";
                if (columnSchema.version)
                    mode = "version";
                if (columnSchema.treeChildrenCount)
                    mode = "treeChildrenCount";
                if (columnSchema.treeLevel)
                    mode = "treeLevel";

                const column: ColumnMetadataArgs = {
                    target: schema.target || schema.name,
                    mode: mode,
                    propertyName: columnName,
                    options: {
                        type: columnSchema.type,
                        name: columnSchema.name,
                        length: columnSchema.length,
                        primary: columnSchema.primary,
                        generated: columnSchema.generated,
                        unique: columnSchema.unique,
                        nullable: columnSchema.nullable,
                        comment: columnSchema.comment,
                        default: columnSchema.default,
                        precision: columnSchema.precision,
                        scale: columnSchema.scale
                    }
                };

                metadataArgsStorage.columns.push(column);
            });

            // add relation metadata args from the schema
            if (schema.relations) {
                Object.keys(schema.relations).forEach(relationName => {
                    const relationSchema = schema.relations[relationName];
                    const relation: RelationMetadataArgs = {
                        target: schema.target || schema.name,
                        propertyName: relationName,
                        relationType: relationSchema.type,
                        isLazy: relationSchema.isLazy || false,
                        type: relationSchema.target,
                        inverseSideProperty: relationSchema.inverseSide,
                        isTreeParent: relationSchema.isTreeParent,
                        isTreeChildren: relationSchema.isTreeChildren,
                        options: {
                            cascadeAll: relationSchema.cascadeAll,
                            cascadeInsert: relationSchema.cascadeInsert,
                            cascadeUpdate: relationSchema.cascadeUpdate,
                            cascadeRemove: relationSchema.cascadeRemove,
                            nullable: relationSchema.nullable,
                            onDelete: relationSchema.onDelete
                        }
                    };

                    metadataArgsStorage.relations.push(relation);

                    // add join column
                    if (relationSchema.joinColumn) {
                        if (typeof relationSchema.joinColumn === "boolean") {
                            const joinColumn: JoinColumnMetadataArgs = {
                                target: schema.target || schema.name,
                                propertyName: relationName
                            };
                            metadataArgsStorage.joinColumns.push(joinColumn);
                        } else {
                            const joinColumn: JoinColumnMetadataArgs = {
                                target: schema.target || schema.name,
                                propertyName: relationName,
                                name: relationSchema.joinColumn.name,
                                referencedColumnName: relationSchema.joinColumn.referencedColumnName
                            };
                            metadataArgsStorage.joinColumns.push(joinColumn);
                        }
                    }

                    // add join table
                    if (relationSchema.joinTable) {
                        if (typeof relationSchema.joinTable === "boolean") {
                            const joinTable: JoinTableMetadataArgs = {
                                target: schema.target || schema.name,
                                propertyName: relationName
                            };
                            metadataArgsStorage.joinTables.push(joinTable);
                        } else {
                            const joinTable: JoinTableMetadataArgs = {
                                target: schema.target || schema.name,
                                propertyName: relationName,
                                name: relationSchema.joinTable.name,
                                joinColumns: ((relationSchema.joinTable as JoinTableOptions).joinColumn ? [(relationSchema.joinTable as JoinTableOptions).joinColumn!] : (relationSchema.joinTable as JoinTableMultipleColumnsOptions).joinColumns) as any,
                                inverseJoinColumns: ((relationSchema.joinTable as JoinTableOptions).inverseJoinColumn ? [(relationSchema.joinTable as JoinTableOptions).inverseJoinColumn!] : (relationSchema.joinTable as JoinTableMultipleColumnsOptions).inverseJoinColumns) as any,
                            };
                            metadataArgsStorage.joinTables.push(joinTable);
                        }
                    }
                });
            }
        });

        return metadataArgsStorage;
    }
}