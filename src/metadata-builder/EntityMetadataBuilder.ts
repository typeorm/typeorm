import {EntityMetadata} from "../metadata/EntityMetadata";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {IndexMetadata} from "../metadata/IndexMetadata";
import {RelationMetadata} from "../metadata/RelationMetadata";
import {EmbeddedMetadata} from "../metadata/EmbeddedMetadata";
import {MetadataArgsStorage} from "../metadata-args/MetadataArgsStorage";
import {EmbeddedMetadataArgs} from "../metadata-args/EmbeddedMetadataArgs";
import {RelationIdMetadata} from "../metadata/RelationIdMetadata";
import {RelationCountMetadata} from "../metadata/RelationCountMetadata";
import {MetadataUtils} from "./MetadataUtils";
import {TableMetadataArgs} from "../metadata-args/TableMetadataArgs";
import {JunctionEntityMetadataBuilder} from "./JunctionEntityMetadataBuilder";
import {ClosureJunctionEntityMetadataBuilder} from "./ClosureJunctionEntityMetadataBuilder";
import {RelationJoinColumnBuilder} from "./RelationJoinColumnBuilder";
import {Connection} from "../connection/Connection";
import {EntityListenerMetadata} from "../metadata/EntityListenerMetadata";
import {ColumnOptions} from "../decorator/options/ColumnOptions";
import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
import {LazyRelationsWrapper} from "../lazy-loading/LazyRelationsWrapper";

/**
 * Builds EntityMetadata objects and all its sub-metadatas.
 */
export class EntityMetadataBuilder {

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Used to build entity metadatas of the junction entities.
     */
    protected junctionEntityMetadataBuilder: JunctionEntityMetadataBuilder;

    /**
     * Used to build entity metadatas of the closure junction entities.
     */
    protected closureJunctionEntityMetadataBuilder: ClosureJunctionEntityMetadataBuilder;

    /**
     * Used to build join columns of the relations.
     */
    protected relationJoinColumnBuilder: RelationJoinColumnBuilder;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private connection: Connection,
                private metadataArgsStorage: MetadataArgsStorage) {

        this.junctionEntityMetadataBuilder = new JunctionEntityMetadataBuilder(connection);
        this.closureJunctionEntityMetadataBuilder = new ClosureJunctionEntityMetadataBuilder(connection);
        this.relationJoinColumnBuilder = new RelationJoinColumnBuilder(connection);
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Builds a complete entity metadatas for the given entity classes.
     */
    build(entityClasses?: Function[]): EntityMetadata[] {

        // if entity classes to filter entities by are given then do filtering, otherwise use all
        const allTables = entityClasses ? this.metadataArgsStorage.filterTables(entityClasses) : this.metadataArgsStorage.tables;

        // filter out table metadata args for those we really create entity metadatas and tables in the db
        const realTables = allTables.filter(table => table.type === "regular" || table.type === "closure" || table.type === "class-table-child" || table.type === "single-table-child");

        // create entity metadatas for a user defined entities (marked with @Entity decorator or loaded from entity schemas)
        const entityMetadatas = realTables.map(tableArgs => this.createEntityMetadata(tableArgs));

        // calculate entity metadata computed properties and all its sub-metadatas
        entityMetadatas.forEach(entityMetadata => this.computeEntityMetadata(entityMetadata));

        // calculate entity metadata's inverse properties
        entityMetadatas.forEach(entityMetadata => this.computeInverseProperties(entityMetadata, entityMetadatas));

        // go through all entity metadatas and create foreign keys / junction entity metadatas for their relations
        entityMetadatas
            .filter(entityMetadata => entityMetadata.tableType !== "single-table-child")
            .forEach(entityMetadata => {

                // create entity's relations join columns (for many-to-one and one-to-one owner)
                entityMetadata.relations.filter(relation => relation.isOneToOne || relation.isManyToOne).forEach(relation => {
                    const joinColumns = this.metadataArgsStorage.filterJoinColumns(relation.target, relation.propertyName);
                    const foreignKey = this.relationJoinColumnBuilder.build(joinColumns, relation); // create a foreign key based on its metadata args
                    if (foreignKey) {
                        relation.registerForeignKeys(foreignKey); // push it to the relation and thus register there a join column
                        entityMetadata.foreignKeys.push(foreignKey);
                    }
                });

                // create junction entity metadatas for entity many-to-many relations
                entityMetadata.relations.filter(relation => relation.isManyToMany).forEach(relation => {
                    const joinTable = this.metadataArgsStorage.findJoinTable(relation.target, relation.propertyName);
                    if (!joinTable) return; // no join table set - no need to do anything (it means this is many-to-many inverse side)

                    // here we create a junction entity metadata for a new junction table of many-to-many relation
                    const junctionEntityMetadata = this.junctionEntityMetadataBuilder.build(relation, joinTable);
                    relation.registerForeignKeys(...junctionEntityMetadata.foreignKeys);
                    relation.registerJunctionEntityMetadata(junctionEntityMetadata);

                    // compute new entity metadata properties and push it to entity metadatas pool
                    this.computeEntityMetadata(junctionEntityMetadata);
                    this.computeInverseProperties(junctionEntityMetadata, entityMetadatas);
                    entityMetadatas.push(junctionEntityMetadata);
                });

                // update entity metadata depend properties
                entityMetadata.relationsWithJoinColumns = entityMetadata.relations.filter(relation => relation.isWithJoinColumn);
                entityMetadata.hasNonNullableRelations = entityMetadata.relationsWithJoinColumns.some(relation => !relation.isNullable || relation.isPrimary);
        });

        // generate closure junction tables for all closure tables
        entityMetadatas
            .filter(metadata => metadata.isClosure)
            .forEach(entityMetadata => {
                const closureJunctionEntityMetadata = this.closureJunctionEntityMetadataBuilder.build(entityMetadata);
                entityMetadata.closureJunctionTable = closureJunctionEntityMetadata;
                this.computeEntityMetadata(closureJunctionEntityMetadata);
                this.computeInverseProperties(closureJunctionEntityMetadata, entityMetadatas);
                entityMetadatas.push(closureJunctionEntityMetadata);
            });

        // after all metadatas created we set parent entity metadata for class-table inheritance
        entityMetadatas
            .filter(metadata => metadata.tableType === "single-table-child" || metadata.tableType === "class-table-child")
            .forEach(entityMetadata => {
                const inheritanceTree: any[] = entityMetadata.target instanceof Function
                    ? MetadataUtils.getInheritanceTree(entityMetadata.target)
                    : [entityMetadata.target];

                const parentMetadata = entityMetadatas.find(metadata => {
                    return inheritanceTree.find(inheritance => inheritance === metadata.target) && (metadata.inheritanceType === "single-table" || metadata.inheritanceType === "class-table");
                });

                if (parentMetadata) {
                    entityMetadata.parentEntityMetadata = parentMetadata;
                    if (parentMetadata.inheritanceType === "single-table")
                        entityMetadata.tableName = parentMetadata.tableName;
                }
            });

        // after all metadatas created we set child entity metadatas for class-table inheritance
        entityMetadatas.forEach(metadata => {
            metadata.childEntityMetadatas = entityMetadatas.filter(childMetadata => {
                return metadata.target instanceof Function
                    && childMetadata.target instanceof Function
                    && MetadataUtils.isInherited(childMetadata.target, metadata.target);
            });
        });

        // generate keys for tables with single-table inheritance
        entityMetadatas
            .filter(metadata => metadata.inheritanceType === "single-table" && metadata.discriminatorColumn)
            .forEach(entityMetadata => this.createKeysForTableInheritance(entityMetadata));

        // build all indices (need to do it after relations and their join columns are built)
        entityMetadatas.forEach(entityMetadata => {
            entityMetadata.indices.forEach(index => index.build(this.connection.namingStrategy));
        });

        entityMetadatas
            .filter(metadata => !!metadata.parentEntityMetadata && metadata.tableType === "class-table-child")
            .forEach(metadata => {
                const parentPrimaryColumns = metadata.parentEntityMetadata.primaryColumns;
                const parentRelationColumns = parentPrimaryColumns.map(parentPrimaryColumn => {
                    const columnName = this.connection.namingStrategy.classTableInheritanceParentColumnName(metadata.parentEntityMetadata.tableName, parentPrimaryColumn.propertyPath);
                    const column = new ColumnMetadata({
                        connection: this.connection,
                        entityMetadata: metadata,
                        referencedColumn: parentPrimaryColumn,
                        args: {
                            target: metadata.target,
                            propertyName: columnName,
                            mode: "parentId",
                            options: <ColumnOptions> {
                                name: columnName,
                                type: parentPrimaryColumn.type,
                                unique: true,
                                nullable: false,
                                primary: true
                            }
                        }
                    });
                    metadata.registerColumn(column);
                    column.build(this.connection.namingStrategy);
                    return column;
                });

                metadata.foreignKeys = [
                    new ForeignKeyMetadata({
                        entityMetadata: metadata,
                        referencedEntityMetadata: metadata.parentEntityMetadata,
                        namingStrategy: this.connection.namingStrategy,
                        columns: parentRelationColumns,
                        referencedColumns: parentPrimaryColumns,
                        onDelete: "CASCADE"
                    })
                ];
            });

        // add lazy initializer for entity relations
        entityMetadatas
            .filter(metadata => metadata.target instanceof Function)
            .forEach(entityMetadata => {
                entityMetadata.relations
                    .filter(relation => relation.isLazy)
                    .forEach(relation => {
                        const lazyRelationsWrapper = new LazyRelationsWrapper(this.connection);
                        lazyRelationsWrapper.wrap((entityMetadata.target as Function).prototype, relation);
                    });
            });

        return entityMetadatas;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Creates entity metadata from the given table args.
     * Creates column, relation, etc. metadatas for everything this entity metadata owns.
     */
    protected createEntityMetadata(tableArgs: TableMetadataArgs): EntityMetadata {

        // we take all "inheritance tree" from a target entity to collect all stored metadata args
        // (by decorators or inside entity schemas). For example for target Post < ContentModel < Unit
        // it will be an array of [Post, ContentModel, Unit] and we can then get all metadata args of those classes
        const inheritanceTree: any[] = tableArgs.target instanceof Function
            ? MetadataUtils.getInheritanceTree(tableArgs.target)
            : [tableArgs.target]; // todo: implement later here inheritance for string-targets

        // if single table inheritance used, we need to copy all children columns in to parent table
        let singleTableChildrenTargets: any[];
        if (tableArgs.type === "single-table-child") {
            singleTableChildrenTargets = this.metadataArgsStorage
                .filterSingleTableChildren(tableArgs.target)
                .map(args => args.target)
                .filter(target => target instanceof Function);

            inheritanceTree.push(...singleTableChildrenTargets);

        } else if (tableArgs.type === "class-table-child") {
            inheritanceTree.forEach(inheritanceTreeItem => {
                const isParent = !!this.metadataArgsStorage.inheritances.find(i => i.target === inheritanceTreeItem);
                if (isParent)
                    inheritanceTree.splice(inheritanceTree.indexOf(inheritanceTreeItem), 1);
            });
        }

        const entityMetadata = new EntityMetadata({
            connection: this.connection,
            args: tableArgs
        });

        const inheritanceType = this.metadataArgsStorage.findInheritanceType(tableArgs.target);
        entityMetadata.inheritanceType = inheritanceType ? inheritanceType.type : undefined;

        const discriminatorValue = this.metadataArgsStorage.findDiscriminatorValue(tableArgs.target);
        entityMetadata.discriminatorValue = discriminatorValue ? discriminatorValue.value : (tableArgs.target as any).name; // todo: pass this to naming strategy to generate a name

        entityMetadata.embeddeds = this.createEmbeddedsRecursively(entityMetadata, this.metadataArgsStorage.filterEmbeddeds(inheritanceTree));
        entityMetadata.ownColumns = this.metadataArgsStorage.filterColumns(inheritanceTree).map(args => {
            const column = new ColumnMetadata({ connection: this.connection, entityMetadata, args });
            // console.log(column.propertyName);
            // if single table inheritance used, we need to mark all inherit table columns as nullable
            if (singleTableChildrenTargets && singleTableChildrenTargets.indexOf(args.target) !== -1)
                column.isNullable = true;
            return column;
        });

        entityMetadata.ownRelations = this.metadataArgsStorage.filterRelations(inheritanceTree).map(args => {
            return new RelationMetadata({ entityMetadata, args });
        });
        entityMetadata.relationIds = this.metadataArgsStorage.filterRelationIds(inheritanceTree).map(args => {
            return new RelationIdMetadata({ entityMetadata, args });
        });
        entityMetadata.relationCounts = this.metadataArgsStorage.filterRelationCounts(inheritanceTree).map(args => {
            return new RelationCountMetadata({ entityMetadata, args });
        });
        entityMetadata.indices = this.metadataArgsStorage.filterIndices(inheritanceTree).map(args => {
            return new IndexMetadata({ entityMetadata, args });
        });
        entityMetadata.listeners = this.metadataArgsStorage.filterListeners(inheritanceTree).map(args => {
            return new EntityListenerMetadata(args);
        });
        return entityMetadata;
    }

    /**
     * Creates from the given embedded metadata args real embedded metadatas with its columns and relations,
     * and does the same for all its sub-embeddeds (goes recursively).
     */
    protected createEmbeddedsRecursively(entityMetadata: EntityMetadata, embeddedArgs: EmbeddedMetadataArgs[]): EmbeddedMetadata[] {
        return embeddedArgs.map(embeddedArgs => {
            const embeddedMetadata = new EmbeddedMetadata({ entityMetadata: entityMetadata, args: embeddedArgs });
            embeddedMetadata.columns = this.metadataArgsStorage.filterColumns(embeddedMetadata.type).map(args => {
                return new ColumnMetadata({ connection: this.connection, entityMetadata, embeddedMetadata, args});
            });
            embeddedMetadata.relations = this.metadataArgsStorage.filterRelations(embeddedMetadata.type).map(args => {
                return new RelationMetadata({ entityMetadata, embeddedMetadata, args });
            });
            embeddedMetadata.embeddeds = this.createEmbeddedsRecursively(entityMetadata, this.metadataArgsStorage.filterEmbeddeds(embeddedMetadata.type));
            embeddedMetadata.embeddeds.forEach(subEmbedded => subEmbedded.parentEmbeddedMetadata = embeddedMetadata);
            return embeddedMetadata;
        });
    }

    /**
     * Computes all entity metadata's computed properties, and all its sub-metadatas (relations, columns, embeds, etc).
     */
    protected computeEntityMetadata(entityMetadata: EntityMetadata) {
        entityMetadata.embeddeds.forEach(embedded => embedded.build(this.connection.namingStrategy));
        entityMetadata.embeddeds.forEach(embedded => {
            embedded.columnsFromTree.forEach(column => column.build(this.connection.namingStrategy));
            embedded.relationsFromTree.forEach(relation => relation.build());
        });
        entityMetadata.ownColumns.forEach(column => column.build(this.connection.namingStrategy));
        entityMetadata.ownRelations.forEach(relation => relation.build());
        entityMetadata.relations = entityMetadata.embeddeds.reduce((relations, embedded) => relations.concat(embedded.relationsFromTree), entityMetadata.ownRelations);
        entityMetadata.oneToOneRelations = entityMetadata.relations.filter(relation => relation.isOneToOne);
        entityMetadata.oneToManyRelations = entityMetadata.relations.filter(relation => relation.isOneToMany);
        entityMetadata.manyToOneRelations = entityMetadata.relations.filter(relation => relation.isManyToOne);
        entityMetadata.manyToManyRelations = entityMetadata.relations.filter(relation => relation.isManyToMany);
        entityMetadata.ownerOneToOneRelations = entityMetadata.relations.filter(relation => relation.isOneToOneOwner);
        entityMetadata.ownerManyToManyRelations = entityMetadata.relations.filter(relation => relation.isManyToManyOwner);
        entityMetadata.treeParentRelation = entityMetadata.relations.find(relation => relation.isTreeParent);
        entityMetadata.treeChildrenRelation = entityMetadata.relations.find(relation => relation.isTreeChildren);
        entityMetadata.columns = entityMetadata.embeddeds.reduce((columns, embedded) => columns.concat(embedded.columnsFromTree), entityMetadata.ownColumns);
        entityMetadata.primaryColumns = entityMetadata.columns.filter(column => column.isPrimary);
        entityMetadata.hasMultiplePrimaryKeys = entityMetadata.primaryColumns.length > 1;
        entityMetadata.generatedColumn = entityMetadata.columns.find(column => column.isGenerated);
        entityMetadata.createDateColumn = entityMetadata.columns.find(column => column.isCreateDate);
        entityMetadata.updateDateColumn = entityMetadata.columns.find(column => column.isUpdateDate);
        entityMetadata.versionColumn = entityMetadata.columns.find(column => column.isVersion);
        entityMetadata.discriminatorColumn = entityMetadata.columns.find(column => column.isDiscriminator);
        entityMetadata.treeLevelColumn = entityMetadata.columns.find(column => column.isTreeLevel);
        entityMetadata.parentIdColumns = entityMetadata.columns.filter(column => column.isParentId);
        entityMetadata.objectIdColumn = entityMetadata.columns.find(column => column.isObjectId);
        entityMetadata.foreignKeys.forEach(foreignKey => foreignKey.build(this.connection.namingStrategy));
        entityMetadata.propertiesMap = entityMetadata.createPropertiesMap();
        entityMetadata.relationIds.forEach(relationId => relationId.build());
        entityMetadata.relationCounts.forEach(relationCount => relationCount.build());
        entityMetadata.embeddeds.forEach(embedded => {
            embedded.relationIdsFromTree.forEach(relationId => relationId.build());
            embedded.relationCountsFromTree.forEach(relationCount => relationCount.build());
        });
    }

    /**
     * Computes entity metadata's relations inverse side properties.
     */
    protected computeInverseProperties(entityMetadata: EntityMetadata, entityMetadatas: EntityMetadata[]) {
        entityMetadata.relations.forEach(relation => {

            // compute inverse side (related) entity metadatas for all relation metadatas
            const inverseEntityMetadata = entityMetadatas.find(m => m.target === relation.type || (typeof relation.type === "string" && m.targetName === relation.type));
            if (!inverseEntityMetadata)
                throw new Error("Entity metadata for " + entityMetadata.name + "#" + relation.propertyPath + " was not found. Check if you specified a correct entity object, check its really entity and its connected in the connection options.");

            relation.inverseEntityMetadata = inverseEntityMetadata;
            relation.inverseSidePropertyPath = relation.buildInverseSidePropertyPath();

            // and compute inverse relation and mark if it has such
            relation.inverseRelation = inverseEntityMetadata.relations.find(foundRelation => foundRelation.propertyPath === relation.inverseSidePropertyPath);
        });
    }

    /**
     * Creates indices for the table of single table inheritance.
     */
    protected createKeysForTableInheritance(entityMetadata: EntityMetadata) {
        entityMetadata.indices.push(
            new IndexMetadata({
                entityMetadata: entityMetadata,
                columns: [entityMetadata.discriminatorColumn!],
                args: {
                    target: entityMetadata.target,
                    unique: false
                }
            }),
            new IndexMetadata({
                entityMetadata: entityMetadata,
                columns: [...entityMetadata.primaryColumns, entityMetadata.discriminatorColumn!],
                args: {
                    target: entityMetadata.target,
                    unique: false
                }
            })
        );
    }

}

// generate virtual column with foreign key for class-table inheritance
/*entityMetadatas.forEach(entityMetadata => {
 if (!entityMetadata.parentEntityMetadata)
 return;

 const parentPrimaryColumns = entityMetadata.parentEntityMetadata.primaryColumns;
 const parentIdColumns = parentPrimaryColumns.map(primaryColumn => {
 const columnName = this.namingStrategy.classTableInheritanceParentColumnName(entityMetadata.parentEntityMetadata.tableName, primaryColumn.propertyName);
 const column = new ColumnMetadataBuilder(entityMetadata);
 column.type = primaryColumn.type;
 column.propertyName = primaryColumn.propertyName; // todo: check why needed
 column.givenName = columnName;
 column.mode = "parentId";
 column.isUnique = true;
 column.isNullable = false;
 // column.entityTarget = entityMetadata.target;
 return column;
 });

 // add foreign key
 const foreignKey = new ForeignKeyMetadataBuilder(
 entityMetadata,
 parentIdColumns,
 entityMetadata.parentEntityMetadata,
 parentPrimaryColumns,
 "CASCADE"
 );
 entityMetadata.ownColumns.push(...parentIdColumns);
 entityMetadata.foreignKeys.push(foreignKey);
 });*/


/*protected createEntityMetadata(metadata: EntityMetadata, options: {
 userSpecifiedTableName?: string,
 closureOwnerTableName?: string,
 }) {

 const tableNameUserSpecified = options.userSpecifiedTableName;
 const isClosureJunction = metadata.tableType === "closure-junction";
 const targetName = metadata.target instanceof Function ? (metadata.target as any).name : metadata.target;
 const tableNameWithoutPrefix = isClosureJunction
 ? this.namingStrategy.closureJunctionTableName(options.closureOwnerTableName!)
 : this.namingStrategy.tableName(targetName, options.userSpecifiedTableName);

 const tableName = this.namingStrategy.prefixTableName(this.driver.options.tablesPrefix, tableNameWithoutPrefix);

 // for virtual tables (like junction table) target is equal to undefined at this moment
 // we change this by setting virtual's table name to a target name
 // todo: add validation so targets with same schema names won't conflicts with virtual table names
 metadata.target = metadata.target ? metadata.target : tableName;
 metadata.targetName = targetName;
 metadata.givenTableName = tableNameUserSpecified;
 metadata.tableNameWithoutPrefix = tableNameWithoutPrefix;
 metadata.tableName = tableName;
 metadata.name = targetName ? targetName : tableName;
 // metadata.namingStrategy = this.namingStrategy;
 }*/

/*protected createEntityMetadata(tableArgs: any, argsForTable: any, ): EntityMetadata {
 const metadata = new EntityMetadata({
 junction: false,
 target: tableArgs.target,
 tablesPrefix: this.driver.options.tablesPrefix,
 namingStrategy: this.namingStrategy,
 tableName: argsForTable.name,
 tableType: argsForTable.type,
 orderBy: argsForTable.orderBy,
 engine: argsForTable.engine,
 skipSchemaSync: argsForTable.skipSchemaSync,
 columnMetadatas: columns,
 relationMetadatas: relations,
 relationIdMetadatas: relationIds,
 relationCountMetadatas: relationCounts,
 indexMetadatas: indices,
 embeddedMetadatas: embeddeds,
 inheritanceType: mergedArgs.inheritance ? mergedArgs.inheritance.type : undefined,
 discriminatorValue: discriminatorValueArgs ? discriminatorValueArgs.value : (tableArgs.target as any).name // todo: pass this to naming strategy to generate a name
 }, this.lazyRelationsWrapper);
 return metadata;
 }*/


// const tables = [mergedArgs.table].concat(mergedArgs.children);
// tables.forEach(tableArgs => {

// find embeddable tables for embeddeds registered in this table and create EmbeddedMetadatas from them
// const findEmbeddedsRecursively = (embeddedArgs: EmbeddedMetadataArgs[]) => {
//     const embeddeds: EmbeddedMetadata[] = [];
//     embeddedArgs.forEach(embedded => {
//         const embeddableTable = embeddableMergedArgs.find(embeddedMergedArgs => embeddedMergedArgs.table.target === embedded.type());
//         if (embeddableTable) {
//             const columns = embeddableTable.columns.toArray().map(args => new ColumnMetadata(args));
//             const relations = embeddableTable.relations.toArray().map(args => new RelationMetadata(args));
//             const subEmbeddeds = findEmbeddedsRecursively(embeddableTable.embeddeds.toArray());
//             embeddeds.push(new EmbeddedMetadata(columns, relations, subEmbeddeds, embedded));
//         }
//     });
//     return embeddeds;
// };
// const embeddeds = findEmbeddedsRecursively(mergedArgs.embeddeds.toArray());

// create metadatas from args
// const argsForTable = mergedArgs.inheritance && mergedArgs.inheritance.type === "single-table" ? mergedArgs.table : tableArgs;

// const table = new TableMetadata(argsForTable);
// const columns = mergedArgs.columns.toArray().map(args => {
//
//     // if column's target is a child table then this column should have all nullable columns
//     if (mergedArgs.inheritance &&
//         mergedArgs.inheritance.type === "single-table" &&
//         args.target !== mergedArgs.table.target && !!mergedArgs.children.find(childTable => childTable.target === args.target)) {
//         args.options.nullable = true;
//     }
//     return new ColumnMetadata(args);
// });
// const discriminatorValueArgs = mergedArgs.discriminatorValues.find(discriminatorValueArgs => {
//     return discriminatorValueArgs.target === tableArgs.target;
// });



// after all metadatas created we set parent entity metadata for class-table inheritance
// entityMetadatas.forEach(entityMetadata => {
//     const mergedArgs = realTables.find(args => args.target === entityMetadata.target);
//     if (mergedArgs && mergedArgs.parent) {
//         const parentEntityMetadata = entityMetadatas.find(entityMetadata => entityMetadata.target === (mergedArgs!.parent! as any).target); // todo: weird compiler error here, thats why type casing is used
//         if (parentEntityMetadata)
//             entityMetadata.parentEntityMetadata = parentEntityMetadata;
//     }
// });