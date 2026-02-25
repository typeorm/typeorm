import { EntityMetadata } from "../metadata/EntityMetadata"
import { ColumnMetadata } from "../metadata/ColumnMetadata"
import { IndexMetadata } from "../metadata/IndexMetadata"
import { RelationMetadata } from "../metadata/RelationMetadata"
import { EmbeddedMetadata } from "../metadata/EmbeddedMetadata"
import { MetadataArgsStorage } from "../metadata-args/MetadataArgsStorage"
import { EmbeddedMetadataArgs } from "../metadata-args/EmbeddedMetadataArgs"
import { RelationIdMetadata } from "../metadata/RelationIdMetadata"
import { RelationCountMetadata } from "../metadata/RelationCountMetadata"
import { EventListenerTypes } from "../metadata/types/EventListenerTypes"
import { MetadataUtils } from "./MetadataUtils"
import { TableMetadataArgs } from "../metadata-args/TableMetadataArgs"
import { JunctionEntityMetadataBuilder } from "./JunctionEntityMetadataBuilder"
import { ClosureJunctionEntityMetadataBuilder } from "./ClosureJunctionEntityMetadataBuilder"
import { RelationJoinColumnBuilder } from "./RelationJoinColumnBuilder"
import { DataSource } from "../data-source/DataSource"
import { EntityListenerMetadata } from "../metadata/EntityListenerMetadata"
import { UniqueMetadata } from "../metadata/UniqueMetadata"
import { CheckMetadata } from "../metadata/CheckMetadata"
import { ExclusionMetadata } from "../metadata/ExclusionMetadata"
import { TypeORMError } from "../error"
import { DriverUtils } from "../driver/DriverUtils"
import { ForeignKeyMetadata } from "../metadata/ForeignKeyMetadata"
import { InstanceChecker } from "../util/InstanceChecker"

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
    protected junctionEntityMetadataBuilder: JunctionEntityMetadataBuilder

    /**
     * Used to build entity metadatas of the closure junction entities.
     */
    protected closureJunctionEntityMetadataBuilder: ClosureJunctionEntityMetadataBuilder

    /**
     * Used to build join columns of the relations.
     */
    protected relationJoinColumnBuilder: RelationJoinColumnBuilder

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(
        private dataSource: DataSource,
        private metadataArgsStorage: MetadataArgsStorage,
    ) {
        this.junctionEntityMetadataBuilder = new JunctionEntityMetadataBuilder(
            dataSource,
        )
        this.closureJunctionEntityMetadataBuilder =
            new ClosureJunctionEntityMetadataBuilder(dataSource)
        this.relationJoinColumnBuilder = new RelationJoinColumnBuilder(
            dataSource,
        )
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Builds a complete entity metadatas for the given entity classes.
     * @param entityClasses
     */
    build(entityClasses?: Function[]): EntityMetadata[] {
        // if entity classes to filter entities by are given then do filtering, otherwise use all
        const allTables = entityClasses
            ? this.metadataArgsStorage.filterTables(entityClasses)
            : this.metadataArgsStorage.tables

        // filter out table metadata args for those we really create entity metadatas and tables in the db
        const realTables = allTables.filter(
            (table) =>
                table.type === "regular" ||
                table.type === "closure" ||
                table.type === "entity-child" ||
                table.type === "view",
        )

        // create entity metadatas for a user defined entities (marked with @Entity decorator or loaded from entity schemas)
        const entityMetadatas = realTables.map((tableArgs) =>
            this.createEntityMetadata(tableArgs),
        )

        // compute parent entity metadatas for table inheritance
        entityMetadatas.forEach((entityMetadata) =>
            this.computeParentEntityMetadata(entityMetadatas, entityMetadata),
        )

        // after all metadatas created we set child entity metadatas for table inheritance
        entityMetadatas.forEach((metadata) => {
            metadata.childEntityMetadatas = entityMetadatas.filter(
                (childMetadata) => {
                    return (
                        typeof metadata.target === "function" &&
                        typeof childMetadata.target === "function" &&
                        MetadataUtils.isInherited(
                            childMetadata.target,
                            metadata.target,
                        )
                    )
                },
            )
        })

        // build entity metadata (step0), first for non-single-table-inherited entity metadatas (dependant)
        entityMetadatas
            .filter(
                (entityMetadata) => entityMetadata.tableType !== "entity-child",
            )
            .forEach((entityMetadata) => entityMetadata.build())

        // build entity metadata (step0), now for single-table-inherited entity metadatas (dependant)
        entityMetadatas
            .filter(
                (entityMetadata) => entityMetadata.tableType === "entity-child",
            )
            .forEach((entityMetadata) => entityMetadata.build())

        // compute entity metadata columns, relations, etc. first for the regular, non-single-table-inherited entity metadatas
        entityMetadatas
            .filter(
                (entityMetadata) => entityMetadata.tableType !== "entity-child",
            )
            .forEach((entityMetadata) =>
                this.computeEntityMetadataStep1(
                    entityMetadatas,
                    entityMetadata,
                ),
            )

        // then do it for single table inheritance children (since they are depend on their parents to be built)
        entityMetadatas
            .filter(
                (entityMetadata) => entityMetadata.tableType === "entity-child",
            )
            .forEach((entityMetadata) =>
                this.computeEntityMetadataStep1(
                    entityMetadatas,
                    entityMetadata,
                ),
            )

        // calculate entity metadata computed properties and all its sub-metadatas
        entityMetadatas.forEach((entityMetadata) =>
            this.computeEntityMetadataStep2(entityMetadata),
        )

        // calculate entity metadata's inverse properties
        entityMetadatas.forEach((entityMetadata) =>
            this.computeInverseProperties(entityMetadata, entityMetadatas),
        )

        // go through all entity metadatas and create foreign keys / junction entity metadatas for their relations
        // CTI children have their own tables and relations, so they need join columns too
        entityMetadatas
            .filter(
                (entityMetadata) =>
                    entityMetadata.tableType !== "entity-child" ||
                    entityMetadata.isCtiChild,
            )
            .forEach((entityMetadata) => {
                // create entity's relations join columns (for many-to-one and one-to-one owner)
                entityMetadata.relations
                    .filter(
                        (relation) =>
                            relation.isOneToOne || relation.isManyToOne,
                    )
                    .forEach((relation) => {
                        const joinColumns =
                            this.metadataArgsStorage.filterJoinColumns(
                                relation.target,
                                relation.propertyName,
                            )
                        const { foreignKey, columns, uniqueConstraint } =
                            this.relationJoinColumnBuilder.build(
                                joinColumns,
                                relation,
                            ) // create a foreign key based on its metadata args
                        if (foreignKey) {
                            relation.registerForeignKeys(foreignKey) // push it to the relation and thus register there a join column
                            entityMetadata.foreignKeys.push(foreignKey)
                        }
                        if (columns) {
                            relation.registerJoinColumns(columns)
                        }
                        if (uniqueConstraint) {
                            if (
                                DriverUtils.isMySQLFamily(
                                    this.dataSource.driver,
                                ) ||
                                this.dataSource.driver.options.type ===
                                    "aurora-mysql" ||
                                this.dataSource.driver.options.type ===
                                    "mssql" ||
                                this.dataSource.driver.options.type === "sap" ||
                                this.dataSource.driver.options.type ===
                                    "spanner"
                            ) {
                                const index = new IndexMetadata({
                                    entityMetadata:
                                        uniqueConstraint.entityMetadata,
                                    columns: uniqueConstraint.columns,
                                    args: {
                                        target: uniqueConstraint.target!,
                                        name: uniqueConstraint.name,
                                        unique: true,
                                        synchronize: true,
                                    },
                                })

                                if (
                                    this.dataSource.driver.options.type ===
                                    "mssql"
                                ) {
                                    index.where = index.columns
                                        .map((column) => {
                                            return `${this.dataSource.driver.escape(
                                                column.databaseName,
                                            )} IS NOT NULL`
                                        })
                                        .join(" AND ")
                                }

                                if (
                                    this.dataSource.driver.options.type ===
                                    "spanner"
                                ) {
                                    index.isNullFiltered = true
                                }

                                if (relation.embeddedMetadata) {
                                    relation.embeddedMetadata.indices.push(
                                        index,
                                    )
                                } else {
                                    relation.entityMetadata.ownIndices.push(
                                        index,
                                    )
                                }
                                this.computeEntityMetadataStep2(entityMetadata)
                            } else {
                                if (relation.embeddedMetadata) {
                                    relation.embeddedMetadata.uniques.push(
                                        uniqueConstraint,
                                    )
                                } else {
                                    relation.entityMetadata.ownUniques.push(
                                        uniqueConstraint,
                                    )
                                }
                                this.computeEntityMetadataStep2(entityMetadata)
                            }
                        }

                        if (
                            foreignKey &&
                            this.dataSource.driver.options.type ===
                                "cockroachdb"
                        ) {
                            const index = new IndexMetadata({
                                entityMetadata: relation.entityMetadata,
                                columns: foreignKey.columns,
                                args: {
                                    target: relation.entityMetadata.target!,
                                    synchronize: true,
                                },
                            })
                            if (relation.embeddedMetadata) {
                                relation.embeddedMetadata.indices.push(index)
                            } else {
                                relation.entityMetadata.ownIndices.push(index)
                            }
                            this.computeEntityMetadataStep2(entityMetadata)
                        }
                    })

                // create junction entity metadatas for entity many-to-many relations
                entityMetadata.relations
                    .filter((relation) => relation.isManyToMany)
                    .forEach((relation) => {
                        const joinTable =
                            this.metadataArgsStorage.findJoinTable(
                                relation.target,
                                relation.propertyName,
                            )!
                        if (!joinTable) return // no join table set - no need to do anything (it means this is many-to-many inverse side)

                        // here we create a junction entity metadata for a new junction table of many-to-many relation
                        const junctionEntityMetadata =
                            this.junctionEntityMetadataBuilder.build(
                                relation,
                                joinTable,
                            )
                        relation.registerForeignKeys(
                            ...junctionEntityMetadata.foreignKeys,
                        )
                        relation.registerJoinColumns(
                            junctionEntityMetadata.ownIndices[0].columns,
                            junctionEntityMetadata.ownIndices[1].columns,
                        )
                        relation.registerJunctionEntityMetadata(
                            junctionEntityMetadata,
                        )

                        // compute new entity metadata properties and push it to entity metadatas pool
                        this.computeEntityMetadataStep2(junctionEntityMetadata)
                        this.computeInverseProperties(
                            junctionEntityMetadata,
                            entityMetadatas,
                        )
                        entityMetadatas.push(junctionEntityMetadata)
                    })
            })

        // update entity metadata depend properties
        entityMetadatas.forEach((entityMetadata) => {
            entityMetadata.relationsWithJoinColumns =
                entityMetadata.relations.filter(
                    (relation) => relation.isWithJoinColumn,
                )
            entityMetadata.hasNonNullableRelations =
                entityMetadata.relationsWithJoinColumns.some(
                    (relation) => !relation.isNullable || relation.isPrimary,
                )
        })

        // generate closure junction tables for all closure tables
        entityMetadatas
            .filter((metadata) => metadata.treeType === "closure-table")
            .forEach((entityMetadata) => {
                const closureJunctionEntityMetadata =
                    this.closureJunctionEntityMetadataBuilder.build(
                        entityMetadata,
                    )
                entityMetadata.closureJunctionTable =
                    closureJunctionEntityMetadata
                this.computeEntityMetadataStep2(closureJunctionEntityMetadata)
                this.computeInverseProperties(
                    closureJunctionEntityMetadata,
                    entityMetadatas,
                )
                entityMetadatas.push(closureJunctionEntityMetadata)
            })

        // generate keys for tables with single-table inheritance
        entityMetadatas
            .filter(
                (metadata) =>
                    metadata.inheritancePattern === "STI" &&
                    metadata.discriminatorColumn,
            )
            .forEach((entityMetadata) =>
                this.createKeysForTableInheritance(entityMetadata),
            )

        // build all indices (need to do it after relations and their join columns are built)
        entityMetadatas.forEach((entityMetadata) => {
            entityMetadata.indices.forEach((index) =>
                index.build(this.dataSource.namingStrategy),
            )
        })

        // build all unique constraints (need to do it after relations and their join columns are built)
        entityMetadatas.forEach((entityMetadata) => {
            entityMetadata.uniques.forEach((unique) =>
                unique.build(this.dataSource.namingStrategy),
            )
        })

        // build all check constraints
        entityMetadatas.forEach((entityMetadata) => {
            entityMetadata.checks.forEach((check) =>
                check.build(this.dataSource.namingStrategy),
            )
        })

        // build all exclusion constraints
        entityMetadatas.forEach((entityMetadata) => {
            entityMetadata.exclusions.forEach((exclusion) =>
                exclusion.build(this.dataSource.namingStrategy),
            )
        })

        // generate foreign keys for tables
        entityMetadatas.forEach((entityMetadata) =>
            this.createForeignKeys(entityMetadata, entityMetadatas),
        )

        // add lazy initializer for entity relations
        entityMetadatas
            .filter((metadata) => typeof metadata.target === "function")
            .forEach((entityMetadata) => {
                entityMetadata.relations
                    .filter((relation) => relation.isLazy)
                    .forEach((relation) => {
                        this.dataSource.relationLoader.enableLazyLoad(
                            relation,
                            (entityMetadata.target as Function).prototype,
                        )
                    })
            })

        entityMetadatas.forEach((entityMetadata) => {
            entityMetadata.columns.forEach((column) => {
                // const target = column.embeddedMetadata ? column.embeddedMetadata.type : column.target;
                const generated = this.metadataArgsStorage.findGenerated(
                    column.target,
                    column.propertyName,
                )
                if (generated) {
                    column.isGenerated = true
                    column.generationStrategy = generated.strategy
                    if (generated.strategy === "uuid") {
                        column.type = "uuid"
                    } else if (generated.strategy === "rowid") {
                        column.type = "int"
                    } else {
                        column.type = column.type || Number
                    }
                    column.build(this.dataSource)
                    this.computeEntityMetadataStep2(entityMetadata)
                }
            })
        })

        return entityMetadatas
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Creates entity metadata from the given table args.
     * Creates column, relation, etc. metadatas for everything this entity metadata owns.
     * @param tableArgs
     */
    protected createEntityMetadata(
        tableArgs: TableMetadataArgs,
    ): EntityMetadata {
        // we take all "inheritance tree" from a target entity to collect all stored metadata args
        // (by decorators or inside entity schemas). For example for target Post < ContentModel < Unit
        // it will be an array of [Post, ContentModel, Unit] and we can then get all metadata args of those classes
        const inheritanceTree: any[] =
            typeof tableArgs.target === "function"
                ? MetadataUtils.getInheritanceTree(tableArgs.target)
                : [tableArgs.target] // todo: implement later here inheritance for string-targets

        const tableInheritance = this.metadataArgsStorage.findInheritanceType(
            tableArgs.target,
        )
        const tableTree = this.metadataArgsStorage.findTree(tableArgs.target)

        // if single table inheritance used, we need to copy all children columns in to parent table
        // For CTI (class table inheritance), each entity keeps only its own columns
        let singleTableChildrenTargets: any[]
        if (
            tableInheritance &&
            tableInheritance.pattern === "STI"
        ) {
            singleTableChildrenTargets = this.metadataArgsStorage
                .filterSingleTableChildren(tableArgs.target)
                .map((args) => args.target)
                .filter((target) => typeof target === "function")

            inheritanceTree.push(...singleTableChildrenTargets)
        } else if (
            tableArgs.type === "entity-child" &&
            !tableInheritance
        ) {
            // entity-child without its own @TableInheritance — check if parent is STI
            // For STI children, merge parent's children into the tree
            // For CTI children, do NOT merge — each entity keeps its own columns
            const parentInheritance = this.metadataArgsStorage.inheritances.find(
                (inh) =>
                    typeof inh.target === "function" &&
                    typeof tableArgs.target === "function" &&
                    MetadataUtils.isInherited(
                        tableArgs.target as Function,
                        inh.target as Function,
                    ),
            )
            if (!parentInheritance || parentInheritance.pattern === "STI") {
                singleTableChildrenTargets = this.metadataArgsStorage
                    .filterSingleTableChildren(tableArgs.target)
                    .map((args) => args.target)
                    .filter((target) => typeof target === "function")
                inheritanceTree.push(...singleTableChildrenTargets)
            }
            // CTI children: inheritanceTree stays as-is (only class hierarchy)
        }

        return new EntityMetadata({
            connection: this.dataSource,
            args: tableArgs,
            inheritanceTree: inheritanceTree,
            tableTree: tableTree,
            inheritancePattern: tableInheritance
                ? tableInheritance.pattern
                : undefined,
        })
    }

    protected computeParentEntityMetadata(
        allEntityMetadatas: EntityMetadata[],
        entityMetadata: EntityMetadata,
    ) {
        // after all metadatas created we set parent entity metadata for table inheritance
        if (entityMetadata.tableType === "entity-child") {
            entityMetadata.parentEntityMetadata = allEntityMetadatas.find(
                (allEntityMetadata) => {
                    if (allEntityMetadata.inheritancePattern === "STI") {
                        // STI: parent's inheritanceTree includes child targets (merged in createEntityMetadata)
                        return (
                            allEntityMetadata.inheritanceTree.indexOf(
                                entityMetadata.target as Function,
                            ) !== -1
                        )
                    }
                    if (allEntityMetadata.inheritancePattern === "CTI") {
                        // CTI: child's inheritanceTree includes parent target (JS prototype chain)
                        return (
                            allEntityMetadata !== entityMetadata &&
                            entityMetadata.inheritanceTree.indexOf(
                                allEntityMetadata.target as Function,
                            ) !== -1
                        )
                    }
                    return false
                },
            )!
        }
    }

    protected computeEntityMetadataStep1(
        allEntityMetadatas: EntityMetadata[],
        entityMetadata: EntityMetadata,
    ) {
        const entityInheritance = this.metadataArgsStorage.findInheritanceType(
            entityMetadata.target,
        )

        const discriminatorValue =
            this.metadataArgsStorage.findDiscriminatorValue(
                entityMetadata.target,
            )

        if (typeof discriminatorValue !== "undefined") {
            entityMetadata.discriminatorValue = discriminatorValue.value
        } else {
            entityMetadata.discriminatorValue = (
                entityMetadata.target as any
            ).name
        }

        // if single table inheritance is used, we need to mark all embedded columns as nullable
        entityMetadata.embeddeds = this.createEmbeddedsRecursively(
            entityMetadata,
            this.metadataArgsStorage.filterEmbeddeds(
                entityMetadata.inheritanceTree,
            ),
        ).map((embedded: EmbeddedMetadata): EmbeddedMetadata => {
            if (entityMetadata.inheritancePattern === "STI") {
                embedded.columns = embedded.columns.map(
                    (column: ColumnMetadata): ColumnMetadata => {
                        column.isNullable = true
                        return column
                    },
                )
            }
            return embedded
        })

        entityMetadata.ownColumns = this.metadataArgsStorage
            .filterColumns(entityMetadata.inheritanceTree)
            .map((args) => {
                // for STI children we reuse columns created for their parents
                if (
                    entityMetadata.tableType === "entity-child" &&
                    !entityMetadata.isCtiChild
                ) {
                    return entityMetadata.parentEntityMetadata.ownColumns.find(
                        (column) => column.propertyName === args.propertyName,
                    )!
                }

                // for CTI children, skip parent's non-primary columns
                // (they live in the parent table and will be added to inheritedColumns later)
                if (entityMetadata.isCtiChild) {
                    const parentInheritanceTree =
                        entityMetadata.parentEntityMetadata.inheritanceTree
                    const isParentColumn =
                        parentInheritanceTree.indexOf(
                            args.target as Function,
                        ) !== -1
                    if (isParentColumn && !args.options.primary) {
                        return null
                    }
                }

                // for multiple table inheritance we can override default column values
                if (
                    entityMetadata.tableType === "regular" &&
                    args.target !== entityMetadata.target
                ) {
                    const childArgs = this.metadataArgsStorage.columns.find(
                        (c) =>
                            c.propertyName === args.propertyName &&
                            c.target === entityMetadata.target,
                    )
                    if (childArgs && childArgs.options.default) {
                        args.options.default = childArgs.options.default
                    }
                }

                const column = new ColumnMetadata({
                    connection: this.dataSource,
                    entityMetadata,
                    args,
                })

                // if single table inheritance used, we need to mark all inherit table columns as nullable
                const columnInSingleTableInheritedChild =
                    allEntityMetadatas.find(
                        (otherEntityMetadata) =>
                            otherEntityMetadata.tableType === "entity-child" &&
                            otherEntityMetadata.target === args.target,
                    )
                if (columnInSingleTableInheritedChild) column.isNullable = true
                return column
            })
            .filter(
                (col): col is ColumnMetadata => col !== null,
            )

        // for table inheritance we need to add a discriminator column
        //
        if (entityInheritance && entityInheritance.column) {
            const discriminatorColumnName =
                entityInheritance.column && entityInheritance.column.name
                    ? entityInheritance.column.name
                    : "type"
            let discriminatorColumn = entityMetadata.ownColumns.find(
                (column) => column.propertyName === discriminatorColumnName,
            )
            if (!discriminatorColumn) {
                discriminatorColumn = new ColumnMetadata({
                    connection: this.dataSource,
                    entityMetadata: entityMetadata,
                    args: {
                        target: entityMetadata.target,
                        mode: "virtual",
                        propertyName: discriminatorColumnName,
                        options: entityInheritance.column || {
                            name: discriminatorColumnName,
                            type: "varchar",
                            nullable: false,
                        },
                    },
                })
                discriminatorColumn.isVirtual = true
                discriminatorColumn.isDiscriminator = true
                entityMetadata.ownColumns.push(discriminatorColumn)
            } else {
                discriminatorColumn.isDiscriminator = true
            }
        }

        // add discriminator column to the child entity metadatas
        // discriminator column will not be there automatically since we are creating it in the code above
        if (entityMetadata.tableType === "entity-child") {
            const discriminatorColumn =
                entityMetadata.parentEntityMetadata.ownColumns.find(
                    (column) => column.isDiscriminator,
                )
            if (discriminatorColumn) {
                if (entityMetadata.isCtiChild) {
                    // CTI: discriminator lives on parent table, add to inheritedColumns
                    if (
                        !entityMetadata.inheritedColumns.find(
                            (column) => column === discriminatorColumn,
                        )
                    ) {
                        entityMetadata.inheritedColumns.push(
                            discriminatorColumn,
                        )
                    }
                } else {
                    // STI: discriminator shared in same table, add to ownColumns
                    if (
                        !entityMetadata.ownColumns.find(
                            (column) => column === discriminatorColumn,
                        )
                    ) {
                        entityMetadata.ownColumns.push(discriminatorColumn)
                    }
                }
            }
            // also copy the inheritance pattern & tree metadata
            // this comes in handy when inheritance and trees are used together
            entityMetadata.inheritancePattern =
                entityMetadata.parentEntityMetadata.inheritancePattern
            if (
                !entityMetadata.treeType &&
                !!entityMetadata.parentEntityMetadata.treeType
            ) {
                entityMetadata.treeType =
                    entityMetadata.parentEntityMetadata.treeType
                entityMetadata.treeOptions =
                    entityMetadata.parentEntityMetadata.treeOptions
                entityMetadata.treeParentRelation =
                    entityMetadata.parentEntityMetadata.treeParentRelation
                entityMetadata.treeLevelColumn =
                    entityMetadata.parentEntityMetadata.treeLevelColumn
            }
        }

        const { namingStrategy } = this.dataSource

        // check if tree is used then we need to add extra columns for specific tree types
        if (entityMetadata.treeType === "materialized-path") {
            entityMetadata.ownColumns.push(
                new ColumnMetadata({
                    connection: this.dataSource,
                    entityMetadata: entityMetadata,
                    materializedPath: true,
                    args: {
                        target: entityMetadata.target,
                        mode: "virtual",
                        propertyName: "mpath",
                        options: /*tree.column || */ {
                            name: namingStrategy.materializedPathColumnName,
                            type: String,
                            nullable: true,
                            default: "",
                        },
                    },
                }),
            )
        } else if (entityMetadata.treeType === "nested-set") {
            const { left, right } = namingStrategy.nestedSetColumnNames
            entityMetadata.ownColumns.push(
                new ColumnMetadata({
                    connection: this.dataSource,
                    entityMetadata: entityMetadata,
                    nestedSetLeft: true,
                    args: {
                        target: entityMetadata.target,
                        mode: "virtual",
                        propertyName: left,
                        options: /*tree.column || */ {
                            name: left,
                            type: Number,
                            nullable: false,
                            default: 1,
                        },
                    },
                }),
            )
            entityMetadata.ownColumns.push(
                new ColumnMetadata({
                    connection: this.dataSource,
                    entityMetadata: entityMetadata,
                    nestedSetRight: true,
                    args: {
                        target: entityMetadata.target,
                        mode: "virtual",
                        propertyName: right,
                        options: /*tree.column || */ {
                            name: right,
                            type: Number,
                            nullable: false,
                            default: 2,
                        },
                    },
                }),
            )
        }

        entityMetadata.ownRelations = this.metadataArgsStorage
            .filterRelations(entityMetadata.inheritanceTree)
            .map((args) => {
                // for STI children we reuse relations created for their parents
                if (
                    entityMetadata.tableType === "entity-child" &&
                    !entityMetadata.isCtiChild
                ) {
                    const parentRelation =
                        entityMetadata.parentEntityMetadata.ownRelations.find(
                            (relation) =>
                                relation.propertyName === args.propertyName,
                        )!
                    const type =
                        typeof args.type === "function"
                            ? (args.type as () => any)()
                            : args.type
                    if (parentRelation.type !== type) {
                        const clone = Object.create(parentRelation)
                        clone.type = type
                        clone.target = args.target
                        clone.declaringTarget = args.target
                        return clone
                    }

                    return parentRelation
                }

                // for CTI children, skip parent's relations
                // (they live in the parent table and will be added to inheritedRelations later)
                if (entityMetadata.isCtiChild) {
                    const parentInheritanceTree =
                        entityMetadata.parentEntityMetadata.inheritanceTree
                    const isParentRelation =
                        parentInheritanceTree.indexOf(
                            args.target as Function,
                        ) !== -1
                    if (isParentRelation) {
                        return null
                    }
                }

                return new RelationMetadata({ entityMetadata, args })
            })
            .filter(
                (rel): rel is RelationMetadata => rel !== null,
            )
        entityMetadata.relationIds = this.metadataArgsStorage
            .filterRelationIds(entityMetadata.inheritanceTree)
            .map((args) => {
                // for STI children we reuse relation ids created for their parents
                if (
                    entityMetadata.tableType === "entity-child" &&
                    !entityMetadata.isCtiChild
                )
                    return entityMetadata.parentEntityMetadata.relationIds.find(
                        (relationId) =>
                            relationId.propertyName === args.propertyName,
                    )!

                return new RelationIdMetadata({ entityMetadata, args })
            })
        entityMetadata.relationCounts = this.metadataArgsStorage
            .filterRelationCounts(entityMetadata.inheritanceTree)
            .map((args) => {
                // for STI children we reuse relation counts created for their parents
                if (
                    entityMetadata.tableType === "entity-child" &&
                    !entityMetadata.isCtiChild
                )
                    return entityMetadata.parentEntityMetadata.relationCounts.find(
                        (relationCount) =>
                            relationCount.propertyName === args.propertyName,
                    )!

                return new RelationCountMetadata({ entityMetadata, args })
            })
        entityMetadata.ownListeners = this.metadataArgsStorage
            .filterListeners(entityMetadata.inheritanceTree)
            .map((args) => {
                return new EntityListenerMetadata({
                    entityMetadata: entityMetadata,
                    args: args,
                })
            })
        entityMetadata.checks = this.metadataArgsStorage
            .filterChecks(entityMetadata.inheritanceTree)
            .map((args) => {
                return new CheckMetadata({ entityMetadata, args })
            })

        // Only PostgreSQL supports exclusion constraints.
        if (this.dataSource.driver.options.type === "postgres") {
            entityMetadata.exclusions = this.metadataArgsStorage
                .filterExclusions(entityMetadata.inheritanceTree)
                .map((args) => {
                    return new ExclusionMetadata({ entityMetadata, args })
                })
        }

        if (this.dataSource.driver.options.type === "cockroachdb") {
            entityMetadata.ownIndices = this.metadataArgsStorage
                .filterIndices(entityMetadata.inheritanceTree)
                .filter((args) => !args.unique)
                .map((args) => {
                    return new IndexMetadata({ entityMetadata, args })
                })

            const uniques = this.metadataArgsStorage
                .filterIndices(entityMetadata.inheritanceTree)
                .filter((args) => args.unique)
                .map((args) => {
                    return new UniqueMetadata({
                        entityMetadata: entityMetadata,
                        args: {
                            target: args.target,
                            name: args.name,
                            columns: args.columns,
                        },
                    })
                })
            entityMetadata.ownUniques.push(...uniques)
        } else {
            entityMetadata.ownIndices = this.metadataArgsStorage
                .filterIndices(entityMetadata.inheritanceTree)
                .map((args) => {
                    return new IndexMetadata({ entityMetadata, args })
                })
        }

        // This drivers stores unique constraints as unique indices.
        if (
            DriverUtils.isMySQLFamily(this.dataSource.driver) ||
            this.dataSource.driver.options.type === "aurora-mysql" ||
            this.dataSource.driver.options.type === "sap" ||
            this.dataSource.driver.options.type === "spanner"
        ) {
            const indices = this.metadataArgsStorage
                .filterUniques(entityMetadata.inheritanceTree)
                .map((args) => {
                    return new IndexMetadata({
                        entityMetadata: entityMetadata,
                        args: {
                            target: args.target,
                            name: args.name,
                            columns: args.columns,
                            unique: true,
                            synchronize: true,
                        },
                    })
                })
            entityMetadata.ownIndices.push(...indices)
        } else {
            const uniques = this.metadataArgsStorage
                .filterUniques(entityMetadata.inheritanceTree)
                .map((args) => {
                    return new UniqueMetadata({ entityMetadata, args })
                })
            entityMetadata.ownUniques.push(...uniques)
        }
    }

    /**
     * Creates from the given embedded metadata args real embedded metadatas with its columns and relations,
     * and does the same for all its sub-embeddeds (goes recursively).
     * @param entityMetadata
     * @param embeddedArgs
     */
    protected createEmbeddedsRecursively(
        entityMetadata: EntityMetadata,
        embeddedArgs: EmbeddedMetadataArgs[],
    ): EmbeddedMetadata[] {
        return embeddedArgs.map((embeddedArgs) => {
            const embeddedMetadata = new EmbeddedMetadata({
                entityMetadata: entityMetadata,
                args: embeddedArgs,
            })
            const targets: any[] =
                typeof embeddedMetadata.type === "function"
                    ? MetadataUtils.getInheritanceTree(embeddedMetadata.type)
                    : [embeddedMetadata.type] // todo: implement later here inheritance for string-targets

            embeddedMetadata.columns = this.metadataArgsStorage
                .filterColumns(targets)
                .map((args) => {
                    return new ColumnMetadata({
                        connection: this.dataSource,
                        entityMetadata,
                        embeddedMetadata,
                        args,
                    })
                })
            embeddedMetadata.relations = this.metadataArgsStorage
                .filterRelations(targets)
                .map((args) => {
                    // For single-table-inherited children, reuse the parent's
                    // embedded relation objects.  The join-column registration
                    // step only runs for the parent entity, so the parent's
                    // relation is the one that will receive joinColumns,
                    // isOwning, etc.  By sharing the same object the child
                    // automatically inherits those computed properties.
                    if (
                        entityMetadata.tableType === "entity-child" &&
                        entityMetadata.parentEntityMetadata
                    ) {
                        const parentEmbedded =
                            entityMetadata.parentEntityMetadata.allEmbeddeds.find(
                                (e) =>
                                    e.propertyName ===
                                    embeddedMetadata.propertyName,
                            )
                        if (parentEmbedded) {
                            const parentRelation =
                                parentEmbedded.relations.find(
                                    (r) => r.propertyName === args.propertyName,
                                )
                            if (parentRelation) return parentRelation
                        }
                    }

                    const relation = new RelationMetadata({
                        entityMetadata,
                        embeddedMetadata,
                        args,
                    })
                    // For STI scoping: set declaringTarget to the entity class
                    // that declared this embedded, not the embedded type itself.
                    relation.declaringTarget =
                        embeddedMetadata.declaringEntityTarget
                    return relation
                })
            embeddedMetadata.listeners = this.metadataArgsStorage
                .filterListeners(targets)
                .map((args) => {
                    return new EntityListenerMetadata({
                        entityMetadata,
                        embeddedMetadata,
                        args,
                    })
                })
            embeddedMetadata.indices = this.metadataArgsStorage
                .filterIndices(targets)
                .map((args) => {
                    return new IndexMetadata({
                        entityMetadata,
                        embeddedMetadata,
                        args,
                    })
                })
            embeddedMetadata.uniques = this.metadataArgsStorage
                .filterUniques(targets)
                .map((args) => {
                    return new UniqueMetadata({
                        entityMetadata,
                        embeddedMetadata,
                        args,
                    })
                })
            embeddedMetadata.relationIds = this.metadataArgsStorage
                .filterRelationIds(targets)
                .map((args) => {
                    return new RelationIdMetadata({ entityMetadata, args })
                })
            embeddedMetadata.relationCounts = this.metadataArgsStorage
                .filterRelationCounts(targets)
                .map((args) => {
                    return new RelationCountMetadata({ entityMetadata, args })
                })
            embeddedMetadata.embeddeds = this.createEmbeddedsRecursively(
                entityMetadata,
                this.metadataArgsStorage.filterEmbeddeds(targets),
            )
            embeddedMetadata.embeddeds.forEach((subEmbedded) => {
                subEmbedded.parentEmbeddedMetadata = embeddedMetadata
                // Propagate the declaring entity target down through nested
                // embedded chains so that STI scoping uses the entity class,
                // not an intermediate embedding class.
                subEmbedded.declaringEntityTarget =
                    embeddedMetadata.declaringEntityTarget
            })
            entityMetadata.allEmbeddeds.push(embeddedMetadata)
            return embeddedMetadata
        })
    }

    /**
     * Computes all entity metadata's computed properties, and all its sub-metadatas (relations, columns, embeds, etc).
     * @param entityMetadata
     */
    protected computeEntityMetadataStep2(entityMetadata: EntityMetadata) {
        // For CTI children, populate inherited columns/relations from parent.
        // These represent parent-table columns that the child accesses via JOIN.
        if (entityMetadata.isCtiChild) {
            const parentNonPkColumns =
                entityMetadata.parentEntityMetadata.ownColumns.filter(
                    (col) => !col.isPrimary,
                )
            // Merge with any already-added inherited columns (e.g. discriminator from step1)
            for (const col of parentNonPkColumns) {
                if (!entityMetadata.inheritedColumns.includes(col)) {
                    entityMetadata.inheritedColumns.push(col)
                }
            }
            entityMetadata.inheritedRelations =
                entityMetadata.parentEntityMetadata.ownRelations.slice()
        }

        entityMetadata.embeddeds.forEach((embedded) =>
            embedded.build(this.dataSource),
        )
        entityMetadata.embeddeds.forEach((embedded) => {
            embedded.columnsFromTree.forEach((column) =>
                column.build(this.dataSource),
            )
            embedded.relationsFromTree.forEach((relation) => relation.build())
        })
        entityMetadata.ownColumns.forEach((column) =>
            column.build(this.dataSource),
        )
        entityMetadata.ownRelations.forEach((relation) => relation.build())
        entityMetadata.relations = entityMetadata.embeddeds.reduce(
            (relations, embedded) =>
                relations.concat(embedded.relationsFromTree),
            entityMetadata.ownRelations,
        )
        // For CTI children, include inherited relations for full query visibility
        if (entityMetadata.isCtiChild) {
            entityMetadata.relations = entityMetadata.relations.concat(
                entityMetadata.inheritedRelations,
            )
        }
        entityMetadata.eagerRelations = entityMetadata.relations.filter(
            (relation) => relation.isEager,
        )

        // For STI parent entities, build a per-child scoped map of eager relations.
        // This prevents relations declared on one child from being eagerly loaded
        // when querying a sibling child entity, while correctly handling:
        //   - multi-level STI (Person → Employee → Teacher)
        //   - intermediate child queries (querying Employee returns Teacher rows)
        //   - embedded relations (declaringTarget is the entity, not the embed)
        if (
            entityMetadata.inheritancePattern === "STI" &&
            entityMetadata.childEntityMetadatas.length > 0
        ) {
            const childTargets = new Set(
                entityMetadata.childEntityMetadatas.map((m) => m.target),
            )

            // Pre-compute each child's inheritance tree as a Set for fast lookups
            const childInheritanceTrees = new Map<
                Function | string,
                Set<Function | string>
            >()
            for (const child of entityMetadata.childEntityMetadatas) {
                childInheritanceTrees.set(
                    child.target,
                    new Set(child.inheritanceTree),
                )
            }

            for (const childMetadata of entityMetadata.childEntityMetadatas) {
                const childTree = childInheritanceTrees.get(
                    childMetadata.target,
                )!

                // Build the set of allowed declaring targets for this child:
                // 1. The child itself
                // 2. Ancestors of this child within the STI hierarchy
                // 3. Descendants of this child (their rows appear in queries)
                const allowedTargets = new Set<Function | string>()
                allowedTargets.add(childMetadata.target)

                for (const otherChild of entityMetadata.childEntityMetadatas) {
                    if (otherChild.target === childMetadata.target) continue
                    // otherChild is an ancestor if it appears in this child's inheritance tree
                    if (childTree.has(otherChild.target)) {
                        allowedTargets.add(otherChild.target)
                    }
                    // otherChild is a descendant if this child appears in its inheritance tree
                    const otherTree = childInheritanceTrees.get(
                        otherChild.target,
                    )!
                    if (otherTree.has(childMetadata.target)) {
                        allowedTargets.add(otherChild.target)
                    }
                }

                const scopedEager = entityMetadata.eagerRelations.filter(
                    (relation) => {
                        if (!relation.declaringTarget) return true
                        // Include if declared on this child, its ancestors, or descendants
                        if (allowedTargets.has(relation.declaringTarget))
                            return true
                        // Include if declared on the parent (not on any child)
                        if (!childTargets.has(relation.declaringTarget))
                            return true
                        // Exclude — it belongs to a different branch
                        return false
                    },
                )
                entityMetadata.childEagerRelationsMap.set(
                    childMetadata.target,
                    scopedEager,
                )
            }
        }

        entityMetadata.lazyRelations = entityMetadata.relations.filter(
            (relation) => relation.isLazy,
        )
        entityMetadata.oneToOneRelations = entityMetadata.relations.filter(
            (relation) => relation.isOneToOne,
        )
        entityMetadata.oneToManyRelations = entityMetadata.relations.filter(
            (relation) => relation.isOneToMany,
        )
        entityMetadata.manyToOneRelations = entityMetadata.relations.filter(
            (relation) => relation.isManyToOne,
        )
        entityMetadata.manyToManyRelations = entityMetadata.relations.filter(
            (relation) => relation.isManyToMany,
        )
        entityMetadata.ownerOneToOneRelations = entityMetadata.relations.filter(
            (relation) => relation.isOneToOneOwner,
        )
        entityMetadata.ownerManyToManyRelations =
            entityMetadata.relations.filter(
                (relation) => relation.isManyToManyOwner,
            )
        entityMetadata.treeParentRelation = entityMetadata.relations.find(
            (relation) => relation.isTreeParent,
        )
        entityMetadata.treeChildrenRelation = entityMetadata.relations.find(
            (relation) => relation.isTreeChildren,
        )
        entityMetadata.columns = entityMetadata.embeddeds.reduce(
            (columns, embedded) => columns.concat(embedded.columnsFromTree),
            entityMetadata.ownColumns,
        )
        // For CTI children, include inherited columns for full query visibility
        if (entityMetadata.isCtiChild) {
            entityMetadata.columns = entityMetadata.columns.concat(
                entityMetadata.inheritedColumns,
            )
        }
        entityMetadata.listeners = entityMetadata.embeddeds.reduce(
            (listeners, embedded) =>
                listeners.concat(embedded.listenersFromTree),
            entityMetadata.ownListeners,
        )
        entityMetadata.afterLoadListeners = entityMetadata.listeners.filter(
            (listener) => listener.type === EventListenerTypes.AFTER_LOAD,
        )
        entityMetadata.afterInsertListeners = entityMetadata.listeners.filter(
            (listener) => listener.type === EventListenerTypes.AFTER_INSERT,
        )
        entityMetadata.afterUpdateListeners = entityMetadata.listeners.filter(
            (listener) => listener.type === EventListenerTypes.AFTER_UPDATE,
        )
        entityMetadata.afterRemoveListeners = entityMetadata.listeners.filter(
            (listener) => listener.type === EventListenerTypes.AFTER_REMOVE,
        )
        entityMetadata.afterSoftRemoveListeners =
            entityMetadata.listeners.filter(
                (listener) =>
                    listener.type === EventListenerTypes.AFTER_SOFT_REMOVE,
            )
        entityMetadata.afterRecoverListeners = entityMetadata.listeners.filter(
            (listener) => listener.type === EventListenerTypes.AFTER_RECOVER,
        )
        entityMetadata.beforeInsertListeners = entityMetadata.listeners.filter(
            (listener) => listener.type === EventListenerTypes.BEFORE_INSERT,
        )
        entityMetadata.beforeUpdateListeners = entityMetadata.listeners.filter(
            (listener) => listener.type === EventListenerTypes.BEFORE_UPDATE,
        )
        entityMetadata.beforeRemoveListeners = entityMetadata.listeners.filter(
            (listener) => listener.type === EventListenerTypes.BEFORE_REMOVE,
        )
        entityMetadata.beforeSoftRemoveListeners =
            entityMetadata.listeners.filter(
                (listener) =>
                    listener.type === EventListenerTypes.BEFORE_SOFT_REMOVE,
            )
        entityMetadata.beforeRecoverListeners = entityMetadata.listeners.filter(
            (listener) => listener.type === EventListenerTypes.BEFORE_RECOVER,
        )
        entityMetadata.indices = entityMetadata.embeddeds.reduce(
            (indices, embedded) => indices.concat(embedded.indicesFromTree),
            entityMetadata.ownIndices,
        )
        entityMetadata.uniques = entityMetadata.embeddeds.reduce(
            (uniques, embedded) => uniques.concat(embedded.uniquesFromTree),
            entityMetadata.ownUniques,
        )
        entityMetadata.primaryColumns = entityMetadata.columns.filter(
            (column) => column.isPrimary,
        )
        entityMetadata.nonVirtualColumns = entityMetadata.columns.filter(
            (column) => !column.isVirtual,
        )
        entityMetadata.ancestorColumns = entityMetadata.columns.filter(
            (column) => column.closureType === "ancestor",
        )
        entityMetadata.descendantColumns = entityMetadata.columns.filter(
            (column) => column.closureType === "descendant",
        )
        entityMetadata.hasMultiplePrimaryKeys =
            entityMetadata.primaryColumns.length > 1
        entityMetadata.generatedColumns = entityMetadata.columns.filter(
            (column) => column.isGenerated || column.isObjectId,
        )
        entityMetadata.hasUUIDGeneratedColumns =
            entityMetadata.columns.filter(
                (column) =>
                    column.isGenerated || column.generationStrategy === "uuid",
            ).length > 0
        entityMetadata.createDateColumn = entityMetadata.columns.find(
            (column) => column.isCreateDate,
        )
        entityMetadata.updateDateColumn = entityMetadata.columns.find(
            (column) => column.isUpdateDate,
        )
        entityMetadata.deleteDateColumn = entityMetadata.columns.find(
            (column) => column.isDeleteDate,
        )
        entityMetadata.versionColumn = entityMetadata.columns.find(
            (column) => column.isVersion,
        )
        entityMetadata.discriminatorColumn = entityMetadata.columns.find(
            (column) => column.isDiscriminator,
        )
        entityMetadata.treeLevelColumn = entityMetadata.columns.find(
            (column) => column.isTreeLevel,
        )
        entityMetadata.nestedSetLeftColumn = entityMetadata.columns.find(
            (column) => column.isNestedSetLeft,
        )
        entityMetadata.nestedSetRightColumn = entityMetadata.columns.find(
            (column) => column.isNestedSetRight,
        )
        entityMetadata.materializedPathColumn = entityMetadata.columns.find(
            (column) => column.isMaterializedPath,
        )
        entityMetadata.objectIdColumn = entityMetadata.columns.find(
            (column) => column.isObjectId,
        )
        entityMetadata.foreignKeys.forEach((foreignKey) =>
            foreignKey.build(this.dataSource.namingStrategy),
        )
        entityMetadata.propertiesMap = entityMetadata.createPropertiesMap()
        entityMetadata.relationIds.forEach((relationId) => relationId.build())
        entityMetadata.relationCounts.forEach((relationCount) =>
            relationCount.build(),
        )
        entityMetadata.embeddeds.forEach((embedded) => {
            embedded.relationIdsFromTree.forEach((relationId) =>
                relationId.build(),
            )
            embedded.relationCountsFromTree.forEach((relationCount) =>
                relationCount.build(),
            )
        })
    }

    /**
     * Computes entity metadata's relations inverse side properties.
     * @param entityMetadata
     * @param entityMetadatas
     */
    protected computeInverseProperties(
        entityMetadata: EntityMetadata,
        entityMetadatas: EntityMetadata[],
    ) {
        entityMetadata.relations.forEach((relation) => {
            // compute inverse side (related) entity metadatas for all relation metadatas
            const inverseEntityMetadata = entityMetadatas.find(
                (m) =>
                    m.target === relation.type ||
                    (typeof relation.type === "string" &&
                        (m.targetName === relation.type ||
                            m.givenTableName === relation.type)),
            )
            if (!inverseEntityMetadata)
                throw new TypeORMError(
                    "Entity metadata for " +
                        entityMetadata.name +
                        "#" +
                        relation.propertyPath +
                        " was not found. Check if you specified a correct entity object and if it's connected in the connection options.",
                )

            relation.inverseEntityMetadata = inverseEntityMetadata
            relation.inverseSidePropertyPath =
                relation.buildInverseSidePropertyPath()

            // and compute inverse relation and mark if it has such
            relation.inverseRelation = inverseEntityMetadata.relations.find(
                (foundRelation) =>
                    foundRelation.propertyPath ===
                    relation.inverseSidePropertyPath,
            )
        })
    }

    /**
     * Creates indices for the table of single table inheritance.
     * @param entityMetadata
     */
    protected createKeysForTableInheritance(entityMetadata: EntityMetadata) {
        const isDiscriminatorColumnAlreadyIndexed = entityMetadata.indices.some(
            ({ givenColumnNames }) =>
                !!givenColumnNames &&
                Array.isArray(givenColumnNames) &&
                givenColumnNames.length === 1 &&
                givenColumnNames[0] ===
                    entityMetadata.discriminatorColumn?.databaseName,
        )

        // If the discriminator column is already indexed, there is no need to
        // add another index on top of it.
        if (isDiscriminatorColumnAlreadyIndexed) {
            return
        }

        entityMetadata.indices.push(
            new IndexMetadata({
                entityMetadata: entityMetadata,
                columns: [entityMetadata.discriminatorColumn!],
                args: {
                    target: entityMetadata.target,
                    unique: false,
                },
            }),
        )
    }

    /**
     * Creates from the given foreign key metadata args real foreign key metadatas.
     * @param entityMetadata
     * @param entityMetadatas
     */
    protected createForeignKeys(
        entityMetadata: EntityMetadata,
        entityMetadatas: EntityMetadata[],
    ) {
        this.metadataArgsStorage
            .filterForeignKeys(entityMetadata.inheritanceTree)
            .forEach((foreignKeyArgs) => {
                const foreignKeyType =
                    typeof foreignKeyArgs.type === "function"
                        ? (foreignKeyArgs.type as () => any)()
                        : foreignKeyArgs.type

                const referencedEntityMetadata = entityMetadatas.find((m) =>
                    typeof foreignKeyType === "string"
                        ? m.targetName === foreignKeyType ||
                          m.givenTableName === foreignKeyType
                        : InstanceChecker.isEntitySchema(foreignKeyType)
                          ? m.target === foreignKeyType.options.name ||
                            m.target === foreignKeyType.options.target
                          : m.target === foreignKeyType,
                )

                if (!referencedEntityMetadata) {
                    throw new TypeORMError(
                        "Entity metadata for " +
                            entityMetadata.name +
                            (foreignKeyArgs.propertyName
                                ? "#" + foreignKeyArgs.propertyName
                                : "") +
                            " was not found. Check if you specified a correct entity object and if it's connected in the connection options.",
                    )
                }

                const columnNames = foreignKeyArgs.columnNames ?? []
                const referencedColumnNames =
                    foreignKeyArgs.referencedColumnNames ?? []

                const columns: ColumnMetadata[] = []
                const referencedColumns: ColumnMetadata[] = []

                if (foreignKeyArgs.propertyName) {
                    columnNames.push(foreignKeyArgs.propertyName)

                    if (foreignKeyArgs.inverseSide) {
                        if (typeof foreignKeyArgs.inverseSide === "function") {
                            referencedColumnNames.push(
                                foreignKeyArgs.inverseSide(
                                    referencedEntityMetadata.propertiesMap,
                                ),
                            )
                        } else {
                            referencedColumnNames.push(
                                foreignKeyArgs.inverseSide,
                            )
                        }
                    }
                }

                if (!referencedColumnNames.length) {
                    referencedColumns.push(
                        ...referencedEntityMetadata.primaryColumns,
                    )
                }

                const columnNameToColumn = (
                    columnName: string,
                    entityMetadata: EntityMetadata,
                ): ColumnMetadata => {
                    const column = entityMetadata.columns.find(
                        (column) =>
                            column.propertyName === columnName ||
                            column.databaseName === columnName,
                    )

                    if (column) return column

                    const foreignKeyName = foreignKeyArgs.name
                        ? '"' + foreignKeyArgs.name + '" '
                        : ""
                    const entityName = entityMetadata.targetName
                    throw new TypeORMError(
                        `Foreign key constraint ${foreignKeyName}contains column that is missing in the entity (${entityName}): ${columnName}`,
                    )
                }

                columns.push(
                    ...columnNames.map((columnName) =>
                        columnNameToColumn(columnName, entityMetadata),
                    ),
                )

                referencedColumns.push(
                    ...referencedColumnNames.map((columnName) =>
                        columnNameToColumn(
                            columnName,
                            referencedEntityMetadata,
                        ),
                    ),
                )

                entityMetadata.foreignKeys.push(
                    new ForeignKeyMetadata({
                        entityMetadata,
                        referencedEntityMetadata,
                        namingStrategy: this.dataSource.namingStrategy,
                        columns,
                        referencedColumns,
                        ...foreignKeyArgs,
                    }),
                )
            })
    }
}
