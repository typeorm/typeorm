import {TargetMetadataArgsCollection} from "./collection/TargetMetadataArgsCollection";
import {PropertyMetadataArgsCollection} from "./collection/PropertyMetadataArgsCollection";
import {RelationMetadataArgs} from "./RelationMetadataArgs";
import {ColumnMetadataArgs} from "./ColumnMetadataArgs";
import {RelationCountMetadataArgs} from "./RelationCountMetadataArgs";
import {IndexMetadataArgs} from "./IndexMetadataArgs";
import {EntityListenerMetadataArgs} from "./EntityListenerMetadataArgs";
import {TableMetadataArgs} from "./TableMetadataArgs";
import {NamingStrategyMetadataArgs} from "./NamingStrategyMetadataArgs";
import {JoinTableMetadataArgs} from "./JoinTableMetadataArgs";
import {JoinColumnMetadataArgs} from "./JoinColumnMetadataArgs";
import {EmbeddedMetadataArgs} from "./EmbeddedMetadataArgs";
import {EntitySubscriberMetadataArgs} from "./EntitySubscriberMetadataArgs";
import {RelationIdMetadataArgs} from "./RelationIdMetadataArgs";
import {InheritanceMetadataArgs} from "./InheritanceMetadataArgs";
import {DiscriminatorValueMetadataArgs} from "./DiscriminatorValueMetadataArgs";
import {EntityRepositoryMetadataArgs} from "./EntityRepositoryMetadataArgs";
import {TransactionEntityMetadataArgs} from "./TransactionEntityMetadataArgs";

/**
 * Storage all metadatas of all available types: tables, fields, subscribers, relations, etc.
 * Each metadata represents some specifications of what it represents.
 */
export class MetadataArgsStorage {

    // todo: type in function validation, inverse side function validation
    // todo: check on build for duplicate names, since naming checking was removed from MetadataStorage
    // todo: duplicate name checking for: table, relation, column, index, naming strategy, join tables/columns?
    // todo: check for duplicate targets too since this check has been removed too

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    readonly tables = new TargetMetadataArgsCollection<TableMetadataArgs>();
    readonly entityRepositories = new TargetMetadataArgsCollection<EntityRepositoryMetadataArgs>();
    readonly transactionEntityManagers = new TargetMetadataArgsCollection<TransactionEntityMetadataArgs>();
    readonly namingStrategies = new TargetMetadataArgsCollection<NamingStrategyMetadataArgs>();
    readonly entitySubscribers = new TargetMetadataArgsCollection<EntitySubscriberMetadataArgs>();
    readonly indices = new PropertyMetadataArgsCollection<IndexMetadataArgs>();
    readonly columns = new PropertyMetadataArgsCollection<ColumnMetadataArgs>();
    readonly relations = new PropertyMetadataArgsCollection<RelationMetadataArgs>();
    readonly joinColumns = new PropertyMetadataArgsCollection<JoinColumnMetadataArgs>();
    readonly joinTables = new PropertyMetadataArgsCollection<JoinTableMetadataArgs>();
    readonly entityListeners = new PropertyMetadataArgsCollection<EntityListenerMetadataArgs>();
    readonly relationCounts = new PropertyMetadataArgsCollection<RelationCountMetadataArgs>();
    readonly relationIds = new PropertyMetadataArgsCollection<RelationIdMetadataArgs>();
    readonly embeddeds = new PropertyMetadataArgsCollection<EmbeddedMetadataArgs>();
    readonly inheritances = new TargetMetadataArgsCollection<InheritanceMetadataArgs>();
    readonly discriminatorValues = new TargetMetadataArgsCollection<DiscriminatorValueMetadataArgs>();

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Gets merged (with all abstract classes) table metadatas for the given classes.
     */
    getMergedTableMetadatas(classes?: Function[]) {
        const allTableMetadataArgs = classes ? this.tables.filterByTargets(classes) : this.tables;
        const tableMetadatas = allTableMetadataArgs.filter(table => table.type === "regular" || table.type === "closure" || table.type === "class-table-child");

        return tableMetadatas.toArray().map(tableMetadata => {
            return this.mergeWithAbstract(allTableMetadataArgs, tableMetadata);
        });
    }

    /**
     * Gets merged (with all abstract classes) embeddable table metadatas for the given classes.
     */
    getMergedEmbeddableTableMetadatas(classes?: Function[]) {
        const tables = classes ? this.tables.filterByTargets(classes) : this.tables;
        const embeddableTableMetadatas = tables.filter(table => table.type === "embeddable");

        return embeddableTableMetadatas.toArray().map(embeddableTableMetadata => {
            return this.mergeWithEmbeddable(embeddableTableMetadatas, embeddableTableMetadata);
        });
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    /**
     */
    protected mergeWithAbstract(allTableMetadatas: TargetMetadataArgsCollection<TableMetadataArgs>,
                                table: TableMetadataArgs) {

        const indices = this.indices.filterByTarget(table.target);
        const columns = this.columns.filterByTarget(table.target);
        const relations = this.relations.filterByTarget(table.target);
        const joinColumns = this.joinColumns.filterByTarget(table.target);
        const joinTables = this.joinTables.filterByTarget(table.target);
        const entityListeners = this.entityListeners.filterByTarget(table.target);
        const relationCounts = this.relationCounts.filterByTarget(table.target);
        const relationIds = this.relationIds.filterByTarget(table.target);
        const embeddeds = this.embeddeds.filterByTarget(table.target);
        const inheritances = this.inheritances.filterByTarget(table.target);
        const inheritance = (inheritances.length > 0) ? inheritances.toArray()[0] : undefined;
        const discriminatorValues: DiscriminatorValueMetadataArgs[] = [];

        // find parent if this table is class-table-child
        let parent: TableMetadataArgs|undefined = undefined;

        // merge metadata from abstract tables
        allTableMetadatas.toArray().forEach(inheritedTable => {
            if (table.type === "single-table-child") return;
            if (!table.target || !inheritedTable.target) return;
            if (!(table.target instanceof Function) || !(inheritedTable.target instanceof Function)) return;
            if (!this.isInherited(table.target, inheritedTable.target)) return;

            // check if inheritedTable is a class with class table inheritance - then we don't need to merge its columns, relations, etc. things
            if (!!this.inheritances.filterByTarget(inheritedTable.target).toArray().find(inheritance => inheritance.type === "class-table")) {
                parent = inheritedTable;
                return;
            }

            const metadatasFromAbstract = this.mergeWithAbstract(allTableMetadatas, inheritedTable);

            metadatasFromAbstract.indices
                .toArray()
                .filter(index => { // make sure we don't have index with such name already
                    return !index.name || !indices.toArray().find(existIndex => existIndex.name === index.name);
                })
                .forEach(index => indices.add(index));

            metadatasFromAbstract.columns
                .filterRepeatedMetadatas(columns.toArray())
                .toArray()
                .forEach(metadata => columns.add(metadata));

            metadatasFromAbstract.relations
                .filterRepeatedMetadatas(relations.toArray())
                .toArray()
                .forEach(metadata => relations.add(metadata));

            metadatasFromAbstract.joinColumns
                .filterRepeatedMetadatas(joinColumns.toArray())
                .toArray()
                .forEach(metadata => joinColumns.add(metadata));

            metadatasFromAbstract.joinTables
                .filterRepeatedMetadatas(joinTables.toArray())
                .toArray()
                .forEach(metadata => joinTables.add(metadata));

            metadatasFromAbstract.entityListeners
                .filterRepeatedMetadatas(entityListeners.toArray())
                .toArray()
                .forEach(metadata => entityListeners.add(metadata));

            metadatasFromAbstract.relationCounts
                .filterRepeatedMetadatas(relationCounts.toArray())
                .toArray()
                .forEach(metadata => relationCounts.add(metadata));

            metadatasFromAbstract.relationIds
                .filterRepeatedMetadatas(relationIds.toArray())
                .toArray()
                .forEach(metadata => relationIds.add(metadata));

            metadatasFromAbstract.embeddeds
                .filterRepeatedMetadatas(embeddeds.toArray())
                .toArray()
                .forEach(metadata => embeddeds.add(metadata));

        });

        // merge metadata from child tables for single-table inheritance
        const children: TableMetadataArgs[] = [];

        if (inheritance && inheritance.type === "single-table") {
            allTableMetadatas.toArray().forEach(childTable => {
                if (childTable.type !== "single-table-child") return;
                if (!childTable.target || !table.target) return;
                if (!(childTable.target instanceof Function) || !(table.target instanceof Function)) return;
                if (!this.isInherited(childTable.target, table.target)) return;

                children.push(childTable);
                this.discriminatorValues
                    .filterByTarget(childTable.target)
                    .toArray()
                    .forEach(metadata => discriminatorValues.push(metadata));

                // for single table inheritance we also merge all columns, relation, etc. into same table
                if (inheritance.type === "single-table") { // todo: remove?
                    const metadatasFromAbstract = this.mergeWithAbstract(allTableMetadatas, childTable);

                    metadatasFromAbstract.indices
                        .toArray()
                        .filter(index => { // make sure we don't have index with such name already
                            return !indices.toArray().find(existIndex => existIndex.name === index.name);
                        })
                        .forEach(index => indices.add(index));

                    metadatasFromAbstract.columns
                        .filterRepeatedMetadatas(columns.toArray())
                        .toArray()
                        .forEach(metadata => columns.add(metadata));

                    metadatasFromAbstract.relations
                        .filterRepeatedMetadatas(relations.toArray())
                        .toArray()
                        .forEach(metadata => relations.add(metadata));

                    metadatasFromAbstract.joinColumns
                        .filterRepeatedMetadatas(joinColumns.toArray())
                        .toArray()
                        .forEach(metadata => joinColumns.add(metadata));

                    metadatasFromAbstract.joinTables
                        .filterRepeatedMetadatas(joinTables.toArray())
                        .toArray()
                        .forEach(metadata => joinTables.add(metadata));

                    metadatasFromAbstract.entityListeners
                        .filterRepeatedMetadatas(entityListeners.toArray())
                        .toArray()
                        .forEach(metadata => entityListeners.add(metadata));

                    metadatasFromAbstract.relationCounts
                        .filterRepeatedMetadatas(relationCounts.toArray())
                        .toArray()
                        .forEach(metadata => relationCounts.add(metadata));

                    metadatasFromAbstract.relationIds
                        .filterRepeatedMetadatas(relationIds.toArray())
                        .toArray()
                        .forEach(metadata => relationIds.add(metadata));

                    metadatasFromAbstract.embeddeds
                        .filterRepeatedMetadatas(embeddeds.toArray())
                        .toArray()
                        .forEach(metadata => embeddeds.add(metadata));

                    metadatasFromAbstract.children
                        .forEach(metadata => children.push(metadata));
                }
            });
        }

        return {
            table: table,
            parent: parent,
            inheritance: inheritance,
            children: children,
            indices: indices,
            columns: columns,
            relations: relations,
            joinColumns: joinColumns,
            joinTables: joinTables,
            entityListeners: entityListeners,
            relationCounts: relationCounts,
            relationIds: relationIds,
            embeddeds: embeddeds,
            discriminatorValues: discriminatorValues
        };
    }

    /**
     */
    protected mergeWithEmbeddable(allTableMetadatas: TargetMetadataArgsCollection<TableMetadataArgs>,
                                  tableMetadata: TableMetadataArgs) {
        const columns = this.columns.filterByTarget(tableMetadata.target);
        const embeddeds = this.embeddeds.filterByTarget(tableMetadata.target);

        allTableMetadatas
            .filter(metadata => {
                if (!tableMetadata.target || !metadata.target) return false;
                if (!(tableMetadata.target instanceof Function) || !(metadata.target instanceof Function)) return false;
                return this.isInherited(tableMetadata.target, metadata.target); // todo: fix it for entity schema
            })
            .toArray()
            .forEach(parentMetadata => {
                const metadatasFromParents = this.mergeWithEmbeddable(allTableMetadatas, parentMetadata);

                metadatasFromParents.columns
                    .filterRepeatedMetadatas(columns.toArray())
                    .toArray()
                    .forEach(metadata => columns.add(metadata));

                metadatasFromParents.embeddeds
                    .filterRepeatedMetadatas(embeddeds.toArray())
                    .toArray()
                    .forEach(metadata => embeddeds.add(metadata));
            });

        return {
            table: tableMetadata,
            columns: columns,
            embeddeds: embeddeds
        };
    }

    /**
     * Checks if this table is inherited from another table.
     */
    protected isInherited(target1: Function, target2: Function) {
        // we cannot use instanceOf in this method, because we need order of inherited tables, to ensure that
        // properties get inherited in a right order. To achieve it we can only check a first parent of the class
        // return this.target.prototype instanceof anotherTable.target;
        return Object.getPrototypeOf(target1.prototype).constructor === target2;
    }

}