"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityMetadataBuilder = void 0;
var tslib_1 = require("tslib");
var CockroachDriver_1 = require("../driver/cockroachdb/CockroachDriver");
var SapDriver_1 = require("../driver/sap/SapDriver");
var EntityMetadata_1 = require("../metadata/EntityMetadata");
var ColumnMetadata_1 = require("../metadata/ColumnMetadata");
var IndexMetadata_1 = require("../metadata/IndexMetadata");
var RelationMetadata_1 = require("../metadata/RelationMetadata");
var EmbeddedMetadata_1 = require("../metadata/EmbeddedMetadata");
var RelationIdMetadata_1 = require("../metadata/RelationIdMetadata");
var RelationCountMetadata_1 = require("../metadata/RelationCountMetadata");
var EventListenerTypes_1 = require("../metadata/types/EventListenerTypes");
var MetadataUtils_1 = require("./MetadataUtils");
var JunctionEntityMetadataBuilder_1 = require("./JunctionEntityMetadataBuilder");
var ClosureJunctionEntityMetadataBuilder_1 = require("./ClosureJunctionEntityMetadataBuilder");
var RelationJoinColumnBuilder_1 = require("./RelationJoinColumnBuilder");
var EntityListenerMetadata_1 = require("../metadata/EntityListenerMetadata");
var UniqueMetadata_1 = require("../metadata/UniqueMetadata");
var MysqlDriver_1 = require("../driver/mysql/MysqlDriver");
var CheckMetadata_1 = require("../metadata/CheckMetadata");
var SqlServerDriver_1 = require("../driver/sqlserver/SqlServerDriver");
var PostgresDriver_1 = require("../driver/postgres/PostgresDriver");
var ExclusionMetadata_1 = require("../metadata/ExclusionMetadata");
var AuroraDataApiDriver_1 = require("../driver/aurora-data-api/AuroraDataApiDriver");
/**
 * Builds EntityMetadata objects and all its sub-metadatas.
 */
var EntityMetadataBuilder = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function EntityMetadataBuilder(connection, metadataArgsStorage) {
        this.connection = connection;
        this.metadataArgsStorage = metadataArgsStorage;
        this.junctionEntityMetadataBuilder = new JunctionEntityMetadataBuilder_1.JunctionEntityMetadataBuilder(connection);
        this.closureJunctionEntityMetadataBuilder = new ClosureJunctionEntityMetadataBuilder_1.ClosureJunctionEntityMetadataBuilder(connection);
        this.relationJoinColumnBuilder = new RelationJoinColumnBuilder_1.RelationJoinColumnBuilder(connection);
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Builds a complete entity metadatas for the given entity classes.
     */
    EntityMetadataBuilder.prototype.build = function (entityClasses) {
        var _this = this;
        // if entity classes to filter entities by are given then do filtering, otherwise use all
        var allTables = entityClasses ? this.metadataArgsStorage.filterTables(entityClasses) : this.metadataArgsStorage.tables;
        // filter out table metadata args for those we really create entity metadatas and tables in the db
        var realTables = allTables.filter(function (table) { return table.type === "regular" || table.type === "closure" || table.type === "entity-child" || table.type === "view"; });
        // create entity metadatas for a user defined entities (marked with @Entity decorator or loaded from entity schemas)
        var entityMetadatas = realTables.map(function (tableArgs) { return _this.createEntityMetadata(tableArgs); });
        // compute parent entity metadatas for table inheritance
        entityMetadatas.forEach(function (entityMetadata) { return _this.computeParentEntityMetadata(entityMetadatas, entityMetadata); });
        // after all metadatas created we set child entity metadatas for table inheritance
        entityMetadatas.forEach(function (metadata) {
            metadata.childEntityMetadatas = entityMetadatas.filter(function (childMetadata) {
                return metadata.target instanceof Function
                    && childMetadata.target instanceof Function
                    && MetadataUtils_1.MetadataUtils.isInherited(childMetadata.target, metadata.target);
            });
        });
        // build entity metadata (step0), first for non-single-table-inherited entity metadatas (dependant)
        entityMetadatas
            .filter(function (entityMetadata) { return entityMetadata.tableType !== "entity-child"; })
            .forEach(function (entityMetadata) { return entityMetadata.build(); });
        // build entity metadata (step0), now for single-table-inherited entity metadatas (dependant)
        entityMetadatas
            .filter(function (entityMetadata) { return entityMetadata.tableType === "entity-child"; })
            .forEach(function (entityMetadata) { return entityMetadata.build(); });
        // compute entity metadata columns, relations, etc. first for the regular, non-single-table-inherited entity metadatas
        entityMetadatas
            .filter(function (entityMetadata) { return entityMetadata.tableType !== "entity-child"; })
            .forEach(function (entityMetadata) { return _this.computeEntityMetadataStep1(entityMetadatas, entityMetadata); });
        // then do it for single table inheritance children (since they are depend on their parents to be built)
        entityMetadatas
            .filter(function (entityMetadata) { return entityMetadata.tableType === "entity-child"; })
            .forEach(function (entityMetadata) { return _this.computeEntityMetadataStep1(entityMetadatas, entityMetadata); });
        // calculate entity metadata computed properties and all its sub-metadatas
        entityMetadatas.forEach(function (entityMetadata) { return _this.computeEntityMetadataStep2(entityMetadata); });
        // calculate entity metadata's inverse properties
        entityMetadatas.forEach(function (entityMetadata) { return _this.computeInverseProperties(entityMetadata, entityMetadatas); });
        // go through all entity metadatas and create foreign keys / junction entity metadatas for their relations
        entityMetadatas
            .filter(function (entityMetadata) { return entityMetadata.tableType !== "entity-child"; })
            .forEach(function (entityMetadata) {
            // create entity's relations join columns (for many-to-one and one-to-one owner)
            entityMetadata.relations.filter(function (relation) { return relation.isOneToOne || relation.isManyToOne; }).forEach(function (relation) {
                var joinColumns = _this.metadataArgsStorage.filterJoinColumns(relation.target, relation.propertyName);
                var _a = _this.relationJoinColumnBuilder.build(joinColumns, relation), foreignKey = _a.foreignKey, columns = _a.columns, uniqueConstraint = _a.uniqueConstraint; // create a foreign key based on its metadata args
                if (foreignKey) {
                    relation.registerForeignKeys(foreignKey); // push it to the relation and thus register there a join column
                    entityMetadata.foreignKeys.push(foreignKey);
                }
                if (columns) {
                    relation.registerJoinColumns(columns);
                }
                if (uniqueConstraint) {
                    if (_this.connection.driver instanceof MysqlDriver_1.MysqlDriver || _this.connection.driver instanceof AuroraDataApiDriver_1.AuroraDataApiDriver
                        || _this.connection.driver instanceof SqlServerDriver_1.SqlServerDriver || _this.connection.driver instanceof SapDriver_1.SapDriver) {
                        var index = new IndexMetadata_1.IndexMetadata({
                            entityMetadata: uniqueConstraint.entityMetadata,
                            columns: uniqueConstraint.columns,
                            args: {
                                target: uniqueConstraint.target,
                                name: uniqueConstraint.name,
                                unique: true,
                                synchronize: true
                            }
                        });
                        if (_this.connection.driver instanceof SqlServerDriver_1.SqlServerDriver) {
                            index.where = index.columns.map(function (column) {
                                return _this.connection.driver.escape(column.databaseName) + " IS NOT NULL";
                            }).join(" AND ");
                        }
                        if (relation.embeddedMetadata) {
                            relation.embeddedMetadata.indices.push(index);
                        }
                        else {
                            relation.entityMetadata.ownIndices.push(index);
                        }
                        _this.computeEntityMetadataStep2(entityMetadata);
                    }
                    else {
                        if (relation.embeddedMetadata) {
                            relation.embeddedMetadata.uniques.push(uniqueConstraint);
                        }
                        else {
                            relation.entityMetadata.ownUniques.push(uniqueConstraint);
                        }
                        _this.computeEntityMetadataStep2(entityMetadata);
                    }
                }
                if (foreignKey && _this.connection.driver instanceof CockroachDriver_1.CockroachDriver) {
                    var index = new IndexMetadata_1.IndexMetadata({
                        entityMetadata: relation.entityMetadata,
                        columns: foreignKey.columns,
                        args: {
                            target: relation.entityMetadata.target,
                            synchronize: true
                        }
                    });
                    if (relation.embeddedMetadata) {
                        relation.embeddedMetadata.indices.push(index);
                    }
                    else {
                        relation.entityMetadata.ownIndices.push(index);
                    }
                    _this.computeEntityMetadataStep2(entityMetadata);
                }
            });
            // create junction entity metadatas for entity many-to-many relations
            entityMetadata.relations.filter(function (relation) { return relation.isManyToMany; }).forEach(function (relation) {
                var joinTable = _this.metadataArgsStorage.findJoinTable(relation.target, relation.propertyName);
                if (!joinTable)
                    return; // no join table set - no need to do anything (it means this is many-to-many inverse side)
                // here we create a junction entity metadata for a new junction table of many-to-many relation
                var junctionEntityMetadata = _this.junctionEntityMetadataBuilder.build(relation, joinTable);
                relation.registerForeignKeys.apply(relation, tslib_1.__spreadArray([], tslib_1.__read(junctionEntityMetadata.foreignKeys)));
                relation.registerJoinColumns(junctionEntityMetadata.ownIndices[0].columns, junctionEntityMetadata.ownIndices[1].columns);
                relation.registerJunctionEntityMetadata(junctionEntityMetadata);
                // compute new entity metadata properties and push it to entity metadatas pool
                _this.computeEntityMetadataStep2(junctionEntityMetadata);
                _this.computeInverseProperties(junctionEntityMetadata, entityMetadatas);
                entityMetadatas.push(junctionEntityMetadata);
            });
        });
        // update entity metadata depend properties
        entityMetadatas
            .forEach(function (entityMetadata) {
            entityMetadata.relationsWithJoinColumns = entityMetadata.relations.filter(function (relation) { return relation.isWithJoinColumn; });
            entityMetadata.hasNonNullableRelations = entityMetadata.relationsWithJoinColumns.some(function (relation) { return !relation.isNullable || relation.isPrimary; });
        });
        // generate closure junction tables for all closure tables
        entityMetadatas
            .filter(function (metadata) { return metadata.treeType === "closure-table"; })
            .forEach(function (entityMetadata) {
            var closureJunctionEntityMetadata = _this.closureJunctionEntityMetadataBuilder.build(entityMetadata);
            entityMetadata.closureJunctionTable = closureJunctionEntityMetadata;
            _this.computeEntityMetadataStep2(closureJunctionEntityMetadata);
            _this.computeInverseProperties(closureJunctionEntityMetadata, entityMetadatas);
            entityMetadatas.push(closureJunctionEntityMetadata);
        });
        // generate keys for tables with single-table inheritance
        entityMetadatas
            .filter(function (metadata) { return metadata.inheritancePattern === "STI" && metadata.discriminatorColumn; })
            .forEach(function (entityMetadata) { return _this.createKeysForTableInheritance(entityMetadata); });
        // build all indices (need to do it after relations and their join columns are built)
        entityMetadatas.forEach(function (entityMetadata) {
            entityMetadata.indices.forEach(function (index) { return index.build(_this.connection.namingStrategy); });
        });
        // build all unique constraints (need to do it after relations and their join columns are built)
        entityMetadatas.forEach(function (entityMetadata) {
            entityMetadata.uniques.forEach(function (unique) { return unique.build(_this.connection.namingStrategy); });
        });
        // build all check constraints
        entityMetadatas.forEach(function (entityMetadata) {
            entityMetadata.checks.forEach(function (check) { return check.build(_this.connection.namingStrategy); });
        });
        // build all exclusion constraints
        entityMetadatas.forEach(function (entityMetadata) {
            entityMetadata.exclusions.forEach(function (exclusion) { return exclusion.build(_this.connection.namingStrategy); });
        });
        // add lazy initializer for entity relations
        entityMetadatas
            .filter(function (metadata) { return metadata.target instanceof Function; })
            .forEach(function (entityMetadata) {
            entityMetadata.relations
                .filter(function (relation) { return relation.isLazy; })
                .forEach(function (relation) {
                _this.connection.relationLoader.enableLazyLoad(relation, entityMetadata.target.prototype);
            });
        });
        entityMetadatas.forEach(function (entityMetadata) {
            entityMetadata.columns.forEach(function (column) {
                // const target = column.embeddedMetadata ? column.embeddedMetadata.type : column.target;
                var generated = _this.metadataArgsStorage.findGenerated(column.target, column.propertyName);
                if (generated) {
                    column.isGenerated = true;
                    column.generationStrategy = generated.strategy;
                    if (generated.strategy === "uuid") {
                        column.type = "uuid";
                    }
                    else if (generated.strategy === "rowid") {
                        column.type = "int";
                    }
                    else {
                        column.type = column.type || Number;
                    }
                    column.build(_this.connection);
                    _this.computeEntityMetadataStep2(entityMetadata);
                }
            });
        });
        return entityMetadatas;
    };
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Creates entity metadata from the given table args.
     * Creates column, relation, etc. metadatas for everything this entity metadata owns.
     */
    EntityMetadataBuilder.prototype.createEntityMetadata = function (tableArgs) {
        // we take all "inheritance tree" from a target entity to collect all stored metadata args
        // (by decorators or inside entity schemas). For example for target Post < ContentModel < Unit
        // it will be an array of [Post, ContentModel, Unit] and we can then get all metadata args of those classes
        var inheritanceTree = tableArgs.target instanceof Function
            ? MetadataUtils_1.MetadataUtils.getInheritanceTree(tableArgs.target)
            : [tableArgs.target]; // todo: implement later here inheritance for string-targets
        var tableInheritance = this.metadataArgsStorage.findInheritanceType(tableArgs.target);
        var tableTree = this.metadataArgsStorage.findTree(tableArgs.target);
        // if single table inheritance used, we need to copy all children columns in to parent table
        var singleTableChildrenTargets;
        if ((tableInheritance && tableInheritance.pattern === "STI") || tableArgs.type === "entity-child") {
            singleTableChildrenTargets = this.metadataArgsStorage
                .filterSingleTableChildren(tableArgs.target)
                .map(function (args) { return args.target; })
                .filter(function (target) { return target instanceof Function; });
            inheritanceTree.push.apply(inheritanceTree, tslib_1.__spreadArray([], tslib_1.__read(singleTableChildrenTargets)));
        }
        return new EntityMetadata_1.EntityMetadata({
            connection: this.connection,
            args: tableArgs,
            inheritanceTree: inheritanceTree,
            tableTree: tableTree,
            inheritancePattern: tableInheritance ? tableInheritance.pattern : undefined
        });
    };
    EntityMetadataBuilder.prototype.computeParentEntityMetadata = function (allEntityMetadatas, entityMetadata) {
        // after all metadatas created we set parent entity metadata for table inheritance
        if (entityMetadata.tableType === "entity-child") {
            entityMetadata.parentEntityMetadata = allEntityMetadatas.find(function (allEntityMetadata) {
                return allEntityMetadata.inheritanceTree.indexOf(entityMetadata.target) !== -1 && allEntityMetadata.inheritancePattern === "STI";
            });
        }
    };
    EntityMetadataBuilder.prototype.computeEntityMetadataStep1 = function (allEntityMetadatas, entityMetadata) {
        var _a, _b, _c;
        var _this = this;
        var entityInheritance = this.metadataArgsStorage.findInheritanceType(entityMetadata.target);
        var discriminatorValue = this.metadataArgsStorage.findDiscriminatorValue(entityMetadata.target);
        if (typeof discriminatorValue !== "undefined") {
            entityMetadata.discriminatorValue = discriminatorValue.value;
        }
        else {
            entityMetadata.discriminatorValue = entityMetadata.target.name;
        }
        // if single table inheritance is used, we need to mark all embedded columns as nullable
        entityMetadata.embeddeds = this.createEmbeddedsRecursively(entityMetadata, this.metadataArgsStorage.filterEmbeddeds(entityMetadata.inheritanceTree))
            .map(function (embedded) {
            if (entityMetadata.inheritancePattern === "STI") {
                embedded.columns = embedded.columns.map(function (column) {
                    column.isNullable = true;
                    return column;
                });
            }
            return embedded;
        });
        entityMetadata.ownColumns = this.metadataArgsStorage
            .filterColumns(entityMetadata.inheritanceTree)
            .map(function (args) {
            // for single table children we reuse columns created for their parents
            if (entityMetadata.tableType === "entity-child")
                return entityMetadata.parentEntityMetadata.ownColumns.find(function (column) { return column.propertyName === args.propertyName; });
            var column = new ColumnMetadata_1.ColumnMetadata({ connection: _this.connection, entityMetadata: entityMetadata, args: args });
            // if single table inheritance used, we need to mark all inherit table columns as nullable
            var columnInSingleTableInheritedChild = allEntityMetadatas.find(function (otherEntityMetadata) { return otherEntityMetadata.tableType === "entity-child" && otherEntityMetadata.target === args.target; });
            if (columnInSingleTableInheritedChild)
                column.isNullable = true;
            return column;
        });
        // for table inheritance we need to add a discriminator column
        //
        if (entityInheritance && entityInheritance.column) {
            var discriminatorColumnName_1 = entityInheritance.column && entityInheritance.column.name ? entityInheritance.column.name : "type";
            var discriminatorColumn = entityMetadata.ownColumns.find(function (column) { return column.propertyName === discriminatorColumnName_1; });
            if (!discriminatorColumn) {
                discriminatorColumn = new ColumnMetadata_1.ColumnMetadata({
                    connection: this.connection,
                    entityMetadata: entityMetadata,
                    args: {
                        target: entityMetadata.target,
                        mode: "virtual",
                        propertyName: discriminatorColumnName_1,
                        options: entityInheritance.column || {
                            name: discriminatorColumnName_1,
                            type: "varchar",
                            nullable: false
                        }
                    }
                });
                discriminatorColumn.isVirtual = true;
                discriminatorColumn.isDiscriminator = true;
                entityMetadata.ownColumns.push(discriminatorColumn);
            }
            else {
                discriminatorColumn.isDiscriminator = true;
            }
        }
        // add discriminator column to the child entity metadatas
        // discriminator column will not be there automatically since we are creating it in the code above
        if (entityMetadata.tableType === "entity-child") {
            var discriminatorColumn_1 = entityMetadata.parentEntityMetadata.ownColumns.find(function (column) { return column.isDiscriminator; });
            if (discriminatorColumn_1 && !entityMetadata.ownColumns.find(function (column) { return column === discriminatorColumn_1; })) {
                entityMetadata.ownColumns.push(discriminatorColumn_1);
            }
        }
        var namingStrategy = this.connection.namingStrategy;
        // check if tree is used then we need to add extra columns for specific tree types
        if (entityMetadata.treeType === "materialized-path") {
            entityMetadata.ownColumns.push(new ColumnMetadata_1.ColumnMetadata({
                connection: this.connection,
                entityMetadata: entityMetadata,
                materializedPath: true,
                args: {
                    target: entityMetadata.target,
                    mode: "virtual",
                    propertyName: "mpath",
                    options: /*tree.column || */ {
                        name: namingStrategy.materializedPathColumnName,
                        type: "varchar",
                        nullable: true,
                        default: ""
                    }
                }
            }));
        }
        else if (entityMetadata.treeType === "nested-set") {
            var _d = namingStrategy.nestedSetColumnNames, left = _d.left, right = _d.right;
            entityMetadata.ownColumns.push(new ColumnMetadata_1.ColumnMetadata({
                connection: this.connection,
                entityMetadata: entityMetadata,
                nestedSetLeft: true,
                args: {
                    target: entityMetadata.target,
                    mode: "virtual",
                    propertyName: left,
                    options: /*tree.column || */ {
                        name: left,
                        type: "integer",
                        nullable: false,
                        default: 1
                    }
                }
            }));
            entityMetadata.ownColumns.push(new ColumnMetadata_1.ColumnMetadata({
                connection: this.connection,
                entityMetadata: entityMetadata,
                nestedSetRight: true,
                args: {
                    target: entityMetadata.target,
                    mode: "virtual",
                    propertyName: right,
                    options: /*tree.column || */ {
                        name: right,
                        type: "integer",
                        nullable: false,
                        default: 2
                    }
                }
            }));
        }
        entityMetadata.ownRelations = this.metadataArgsStorage.filterRelations(entityMetadata.inheritanceTree).map(function (args) {
            // for single table children we reuse relations created for their parents
            if (entityMetadata.tableType === "entity-child")
                return entityMetadata.parentEntityMetadata.ownRelations.find(function (relation) { return relation.propertyName === args.propertyName; });
            return new RelationMetadata_1.RelationMetadata({ entityMetadata: entityMetadata, args: args });
        });
        entityMetadata.relationIds = this.metadataArgsStorage.filterRelationIds(entityMetadata.inheritanceTree).map(function (args) {
            // for single table children we reuse relation ids created for their parents
            if (entityMetadata.tableType === "entity-child")
                return entityMetadata.parentEntityMetadata.relationIds.find(function (relationId) { return relationId.propertyName === args.propertyName; });
            return new RelationIdMetadata_1.RelationIdMetadata({ entityMetadata: entityMetadata, args: args });
        });
        entityMetadata.relationCounts = this.metadataArgsStorage.filterRelationCounts(entityMetadata.inheritanceTree).map(function (args) {
            // for single table children we reuse relation counts created for their parents
            if (entityMetadata.tableType === "entity-child")
                return entityMetadata.parentEntityMetadata.relationCounts.find(function (relationCount) { return relationCount.propertyName === args.propertyName; });
            return new RelationCountMetadata_1.RelationCountMetadata({ entityMetadata: entityMetadata, args: args });
        });
        entityMetadata.ownListeners = this.metadataArgsStorage.filterListeners(entityMetadata.inheritanceTree).map(function (args) {
            return new EntityListenerMetadata_1.EntityListenerMetadata({ entityMetadata: entityMetadata, args: args });
        });
        entityMetadata.checks = this.metadataArgsStorage.filterChecks(entityMetadata.inheritanceTree).map(function (args) {
            return new CheckMetadata_1.CheckMetadata({ entityMetadata: entityMetadata, args: args });
        });
        // Only PostgreSQL supports exclusion constraints.
        if (this.connection.driver instanceof PostgresDriver_1.PostgresDriver) {
            entityMetadata.exclusions = this.metadataArgsStorage.filterExclusions(entityMetadata.inheritanceTree).map(function (args) {
                return new ExclusionMetadata_1.ExclusionMetadata({ entityMetadata: entityMetadata, args: args });
            });
        }
        if (this.connection.driver instanceof CockroachDriver_1.CockroachDriver) {
            entityMetadata.ownIndices = this.metadataArgsStorage.filterIndices(entityMetadata.inheritanceTree)
                .filter(function (args) { return !args.unique; })
                .map(function (args) {
                return new IndexMetadata_1.IndexMetadata({ entityMetadata: entityMetadata, args: args });
            });
            var uniques = this.metadataArgsStorage.filterIndices(entityMetadata.inheritanceTree)
                .filter(function (args) { return args.unique; })
                .map(function (args) {
                return new UniqueMetadata_1.UniqueMetadata({
                    entityMetadata: entityMetadata,
                    args: {
                        target: args.target,
                        name: args.name,
                        columns: args.columns,
                    }
                });
            });
            (_a = entityMetadata.ownUniques).push.apply(_a, tslib_1.__spreadArray([], tslib_1.__read(uniques)));
        }
        else {
            entityMetadata.ownIndices = this.metadataArgsStorage.filterIndices(entityMetadata.inheritanceTree).map(function (args) {
                return new IndexMetadata_1.IndexMetadata({ entityMetadata: entityMetadata, args: args });
            });
        }
        // Mysql and SAP HANA stores unique constraints as unique indices.
        if (this.connection.driver instanceof MysqlDriver_1.MysqlDriver || this.connection.driver instanceof AuroraDataApiDriver_1.AuroraDataApiDriver || this.connection.driver instanceof SapDriver_1.SapDriver) {
            var indices = this.metadataArgsStorage.filterUniques(entityMetadata.inheritanceTree).map(function (args) {
                return new IndexMetadata_1.IndexMetadata({
                    entityMetadata: entityMetadata,
                    args: {
                        target: args.target,
                        name: args.name,
                        columns: args.columns,
                        unique: true,
                        synchronize: true
                    }
                });
            });
            (_b = entityMetadata.ownIndices).push.apply(_b, tslib_1.__spreadArray([], tslib_1.__read(indices)));
        }
        else {
            var uniques = this.metadataArgsStorage.filterUniques(entityMetadata.inheritanceTree).map(function (args) {
                return new UniqueMetadata_1.UniqueMetadata({ entityMetadata: entityMetadata, args: args });
            });
            (_c = entityMetadata.ownUniques).push.apply(_c, tslib_1.__spreadArray([], tslib_1.__read(uniques)));
        }
    };
    /**
     * Creates from the given embedded metadata args real embedded metadatas with its columns and relations,
     * and does the same for all its sub-embeddeds (goes recursively).
     */
    EntityMetadataBuilder.prototype.createEmbeddedsRecursively = function (entityMetadata, embeddedArgs) {
        var _this = this;
        return embeddedArgs.map(function (embeddedArgs) {
            var embeddedMetadata = new EmbeddedMetadata_1.EmbeddedMetadata({ entityMetadata: entityMetadata, args: embeddedArgs });
            var targets = MetadataUtils_1.MetadataUtils.getInheritanceTree(embeddedMetadata.type);
            embeddedMetadata.columns = _this.metadataArgsStorage.filterColumns(targets).map(function (args) {
                return new ColumnMetadata_1.ColumnMetadata({ connection: _this.connection, entityMetadata: entityMetadata, embeddedMetadata: embeddedMetadata, args: args });
            });
            embeddedMetadata.relations = _this.metadataArgsStorage.filterRelations(targets).map(function (args) {
                return new RelationMetadata_1.RelationMetadata({ entityMetadata: entityMetadata, embeddedMetadata: embeddedMetadata, args: args });
            });
            embeddedMetadata.listeners = _this.metadataArgsStorage.filterListeners(targets).map(function (args) {
                return new EntityListenerMetadata_1.EntityListenerMetadata({ entityMetadata: entityMetadata, embeddedMetadata: embeddedMetadata, args: args });
            });
            embeddedMetadata.indices = _this.metadataArgsStorage.filterIndices(targets).map(function (args) {
                return new IndexMetadata_1.IndexMetadata({ entityMetadata: entityMetadata, embeddedMetadata: embeddedMetadata, args: args });
            });
            embeddedMetadata.uniques = _this.metadataArgsStorage.filterUniques(targets).map(function (args) {
                return new UniqueMetadata_1.UniqueMetadata({ entityMetadata: entityMetadata, embeddedMetadata: embeddedMetadata, args: args });
            });
            embeddedMetadata.relationIds = _this.metadataArgsStorage.filterRelationIds(targets).map(function (args) {
                return new RelationIdMetadata_1.RelationIdMetadata({ entityMetadata: entityMetadata, args: args });
            });
            embeddedMetadata.relationCounts = _this.metadataArgsStorage.filterRelationCounts(targets).map(function (args) {
                return new RelationCountMetadata_1.RelationCountMetadata({ entityMetadata: entityMetadata, args: args });
            });
            embeddedMetadata.embeddeds = _this.createEmbeddedsRecursively(entityMetadata, _this.metadataArgsStorage.filterEmbeddeds(targets));
            embeddedMetadata.embeddeds.forEach(function (subEmbedded) { return subEmbedded.parentEmbeddedMetadata = embeddedMetadata; });
            entityMetadata.allEmbeddeds.push(embeddedMetadata);
            return embeddedMetadata;
        });
    };
    /**
     * Computes all entity metadata's computed properties, and all its sub-metadatas (relations, columns, embeds, etc).
     */
    EntityMetadataBuilder.prototype.computeEntityMetadataStep2 = function (entityMetadata) {
        var _this = this;
        entityMetadata.embeddeds.forEach(function (embedded) { return embedded.build(_this.connection); });
        entityMetadata.embeddeds.forEach(function (embedded) {
            embedded.columnsFromTree.forEach(function (column) { return column.build(_this.connection); });
            embedded.relationsFromTree.forEach(function (relation) { return relation.build(); });
        });
        entityMetadata.ownColumns.forEach(function (column) { return column.build(_this.connection); });
        entityMetadata.ownRelations.forEach(function (relation) { return relation.build(); });
        entityMetadata.relations = entityMetadata.embeddeds.reduce(function (relations, embedded) { return relations.concat(embedded.relationsFromTree); }, entityMetadata.ownRelations);
        entityMetadata.eagerRelations = entityMetadata.relations.filter(function (relation) { return relation.isEager; });
        entityMetadata.lazyRelations = entityMetadata.relations.filter(function (relation) { return relation.isLazy; });
        entityMetadata.oneToOneRelations = entityMetadata.relations.filter(function (relation) { return relation.isOneToOne; });
        entityMetadata.oneToManyRelations = entityMetadata.relations.filter(function (relation) { return relation.isOneToMany; });
        entityMetadata.manyToOneRelations = entityMetadata.relations.filter(function (relation) { return relation.isManyToOne; });
        entityMetadata.manyToManyRelations = entityMetadata.relations.filter(function (relation) { return relation.isManyToMany; });
        entityMetadata.ownerOneToOneRelations = entityMetadata.relations.filter(function (relation) { return relation.isOneToOneOwner; });
        entityMetadata.ownerManyToManyRelations = entityMetadata.relations.filter(function (relation) { return relation.isManyToManyOwner; });
        entityMetadata.treeParentRelation = entityMetadata.relations.find(function (relation) { return relation.isTreeParent; });
        entityMetadata.treeChildrenRelation = entityMetadata.relations.find(function (relation) { return relation.isTreeChildren; });
        entityMetadata.columns = entityMetadata.embeddeds.reduce(function (columns, embedded) { return columns.concat(embedded.columnsFromTree); }, entityMetadata.ownColumns);
        entityMetadata.listeners = entityMetadata.embeddeds.reduce(function (columns, embedded) { return columns.concat(embedded.listenersFromTree); }, entityMetadata.ownListeners);
        entityMetadata.afterLoadListeners = entityMetadata.listeners.filter(function (listener) { return listener.type === EventListenerTypes_1.EventListenerTypes.AFTER_LOAD; });
        entityMetadata.afterInsertListeners = entityMetadata.listeners.filter(function (listener) { return listener.type === EventListenerTypes_1.EventListenerTypes.AFTER_INSERT; });
        entityMetadata.afterUpdateListeners = entityMetadata.listeners.filter(function (listener) { return listener.type === EventListenerTypes_1.EventListenerTypes.AFTER_UPDATE; });
        entityMetadata.afterRemoveListeners = entityMetadata.listeners.filter(function (listener) { return listener.type === EventListenerTypes_1.EventListenerTypes.AFTER_REMOVE; });
        entityMetadata.beforeInsertListeners = entityMetadata.listeners.filter(function (listener) { return listener.type === EventListenerTypes_1.EventListenerTypes.BEFORE_INSERT; });
        entityMetadata.beforeUpdateListeners = entityMetadata.listeners.filter(function (listener) { return listener.type === EventListenerTypes_1.EventListenerTypes.BEFORE_UPDATE; });
        entityMetadata.beforeRemoveListeners = entityMetadata.listeners.filter(function (listener) { return listener.type === EventListenerTypes_1.EventListenerTypes.BEFORE_REMOVE; });
        entityMetadata.indices = entityMetadata.embeddeds.reduce(function (columns, embedded) { return columns.concat(embedded.indicesFromTree); }, entityMetadata.ownIndices);
        entityMetadata.uniques = entityMetadata.embeddeds.reduce(function (columns, embedded) { return columns.concat(embedded.uniquesFromTree); }, entityMetadata.ownUniques);
        entityMetadata.primaryColumns = entityMetadata.columns.filter(function (column) { return column.isPrimary; });
        entityMetadata.nonVirtualColumns = entityMetadata.columns.filter(function (column) { return !column.isVirtual; });
        entityMetadata.ancestorColumns = entityMetadata.columns.filter(function (column) { return column.closureType === "ancestor"; });
        entityMetadata.descendantColumns = entityMetadata.columns.filter(function (column) { return column.closureType === "descendant"; });
        entityMetadata.hasMultiplePrimaryKeys = entityMetadata.primaryColumns.length > 1;
        entityMetadata.generatedColumns = entityMetadata.columns.filter(function (column) { return column.isGenerated || column.isObjectId; });
        entityMetadata.hasUUIDGeneratedColumns = entityMetadata.columns.filter(function (column) { return column.isGenerated || column.generationStrategy === "uuid"; }).length > 0;
        entityMetadata.createDateColumn = entityMetadata.columns.find(function (column) { return column.isCreateDate; });
        entityMetadata.updateDateColumn = entityMetadata.columns.find(function (column) { return column.isUpdateDate; });
        entityMetadata.deleteDateColumn = entityMetadata.columns.find(function (column) { return column.isDeleteDate; });
        entityMetadata.versionColumn = entityMetadata.columns.find(function (column) { return column.isVersion; });
        entityMetadata.discriminatorColumn = entityMetadata.columns.find(function (column) { return column.isDiscriminator; });
        entityMetadata.treeLevelColumn = entityMetadata.columns.find(function (column) { return column.isTreeLevel; });
        entityMetadata.nestedSetLeftColumn = entityMetadata.columns.find(function (column) { return column.isNestedSetLeft; });
        entityMetadata.nestedSetRightColumn = entityMetadata.columns.find(function (column) { return column.isNestedSetRight; });
        entityMetadata.materializedPathColumn = entityMetadata.columns.find(function (column) { return column.isMaterializedPath; });
        entityMetadata.objectIdColumn = entityMetadata.columns.find(function (column) { return column.isObjectId; });
        entityMetadata.foreignKeys.forEach(function (foreignKey) { return foreignKey.build(_this.connection.namingStrategy); });
        entityMetadata.propertiesMap = entityMetadata.createPropertiesMap();
        entityMetadata.relationIds.forEach(function (relationId) { return relationId.build(); });
        entityMetadata.relationCounts.forEach(function (relationCount) { return relationCount.build(); });
        entityMetadata.embeddeds.forEach(function (embedded) {
            embedded.relationIdsFromTree.forEach(function (relationId) { return relationId.build(); });
            embedded.relationCountsFromTree.forEach(function (relationCount) { return relationCount.build(); });
        });
    };
    /**
     * Computes entity metadata's relations inverse side properties.
     */
    EntityMetadataBuilder.prototype.computeInverseProperties = function (entityMetadata, entityMetadatas) {
        entityMetadata.relations.forEach(function (relation) {
            // compute inverse side (related) entity metadatas for all relation metadatas
            var inverseEntityMetadata = entityMetadatas.find(function (m) { return m.target === relation.type || (typeof relation.type === "string" && (m.targetName === relation.type || m.givenTableName === relation.type)); });
            if (!inverseEntityMetadata)
                throw new Error("Entity metadata for " + entityMetadata.name + "#" + relation.propertyPath + " was not found. Check if you specified a correct entity object and if it's connected in the connection options.");
            relation.inverseEntityMetadata = inverseEntityMetadata;
            relation.inverseSidePropertyPath = relation.buildInverseSidePropertyPath();
            // and compute inverse relation and mark if it has such
            relation.inverseRelation = inverseEntityMetadata.relations.find(function (foundRelation) { return foundRelation.propertyPath === relation.inverseSidePropertyPath; });
        });
    };
    /**
     * Creates indices for the table of single table inheritance.
     */
    EntityMetadataBuilder.prototype.createKeysForTableInheritance = function (entityMetadata) {
        entityMetadata.indices.push(new IndexMetadata_1.IndexMetadata({
            entityMetadata: entityMetadata,
            columns: [entityMetadata.discriminatorColumn],
            args: {
                target: entityMetadata.target,
                unique: false
            }
        }));
    };
    return EntityMetadataBuilder;
}());
exports.EntityMetadataBuilder = EntityMetadataBuilder;

//# sourceMappingURL=EntityMetadataBuilder.js.map
