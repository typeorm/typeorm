import {EntitySchema} from "./EntitySchema";
import {MetadataArgsStorage} from "../metadata-args/MetadataArgsStorage";
import {TableMetadataArgs} from "../metadata-args/TableMetadataArgs";
import {ColumnMetadataArgs} from "../metadata-args/ColumnMetadataArgs";
import {IndexMetadataArgs} from "../metadata-args/IndexMetadataArgs";
import {RelationMetadataArgs} from "../metadata-args/RelationMetadataArgs";
import {JoinColumnMetadataArgs} from "../metadata-args/JoinColumnMetadataArgs";
import {JoinTableMetadataArgs} from "../metadata-args/JoinTableMetadataArgs";
import {JoinTableOptions} from "../decorator/options/JoinTableOptions";
import {JoinTableMultipleColumnsOptions} from "../decorator/options/JoinTableMuplipleColumnsOptions";
import {ColumnMode} from "../metadata-args/types/ColumnMode";
import {GeneratedMetadataArgs} from "../metadata-args/GeneratedMetadataArgs";

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
            const table = schema.table || {} as any;
            const tableMetadata: TableMetadataArgs = {
                target: schema.target || schema.name,
                name: table.name,
                type: table.type || "regular",
                orderBy: table.orderBy
            };
            metadataArgsStorage.tables.push(tableMetadata);

            // add columns metadata args from the schema
            Object.keys(schema.columns).forEach(columnName => {
                const tableColumn = schema.columns[columnName];
                let mode: ColumnMode = "regular";
                if (tableColumn.createDate)
                    mode = "createDate";
                if (tableColumn.updateDate)
                    mode = "updateDate";
                if (tableColumn.version)
                    mode = "version";
                if (tableColumn.treeChildrenCount)
                    mode = "treeChildrenCount";
                if (tableColumn.treeLevel)
                    mode = "treeLevel";

                const columnAgrs: ColumnMetadataArgs = {
                    target: schema.target || schema.name,
                    mode: mode,
                    propertyName: columnName,
                    options: {
                        type: tableColumn.type,
                        name: tableColumn.name,
                        length: tableColumn.length,
                        primary: tableColumn.primary,
                        unique: tableColumn.unique,
                        nullable: tableColumn.nullable,
                        comment: tableColumn.comment,
                        default: tableColumn.default,
                        precision: tableColumn.precision,
                        scale: tableColumn.scale
                    }
                };
                metadataArgsStorage.columns.push(columnAgrs);

                if (tableColumn.generated) {
                    const generationArgs: GeneratedMetadataArgs = {
                        target: schema.target || schema.name,
                        propertyName: columnName,
                        strategy: typeof tableColumn.generated === "string" ? tableColumn.generated : "increment"
                    };
                    metadataArgsStorage.generations.push(generationArgs);
                }
            });

            // add relation metadata args from the schema
            if (schema.relations) {
                Object.keys(schema.relations).forEach(relationName => {
                    const relationSchema = schema.relations![relationName];
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
                            cascade: relationSchema.cascade,
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

            // add relation metadata args from the schema
            if (schema.indices) {
                Object.keys(schema.indices).forEach(indexName => {
                    const tableIndex = schema.indices![indexName];
                    const indexAgrs: IndexMetadataArgs = {
                        target: schema.target || schema.name,
                        name: indexName,
                        unique: tableIndex.unique,
                        sparse: tableIndex.sparse,
                        columns: tableIndex.columns
                    };
                    metadataArgsStorage.indices.push(indexAgrs);                        
                });
            }    

        });

        return metadataArgsStorage;
    }
}