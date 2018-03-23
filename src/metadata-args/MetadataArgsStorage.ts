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
import {TransactionRepositoryMetadataArgs} from "./TransactionRepositoryMetadataArgs";
import {MetadataUtils} from "../metadata-builder/MetadataUtils";
import {GeneratedMetadataArgs} from "./GeneratedMetadataArgs";

/**
 * Storage all metadatas args of all available types: tables, columns, subscribers, relations, etc.
 * Each metadata args represents some specifications of what it represents.
 * MetadataArgs used to create a real Metadata objects.
 */
export class MetadataArgsStorage {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    readonly tables: TableMetadataArgs[] = [];
    readonly entityRepositories: EntityRepositoryMetadataArgs[] = [];
    readonly transactionEntityManagers: TransactionEntityMetadataArgs[] = [];
    readonly transactionRepositories: TransactionRepositoryMetadataArgs[] = [];
    readonly namingStrategies: NamingStrategyMetadataArgs[] = [];
    readonly entitySubscribers: EntitySubscriberMetadataArgs[] = [];
    readonly indices: IndexMetadataArgs[] = [];
    readonly columns: ColumnMetadataArgs[] = [];
    readonly generations: GeneratedMetadataArgs[] = [];
    readonly relations: RelationMetadataArgs[] = [];
    readonly joinColumns: JoinColumnMetadataArgs[] = [];
    readonly joinTables: JoinTableMetadataArgs[] = [];
    readonly entityListeners: EntityListenerMetadataArgs[] = [];
    readonly relationCounts: RelationCountMetadataArgs[] = [];
    readonly relationIds: RelationIdMetadataArgs[] = [];
    readonly embeddeds: EmbeddedMetadataArgs[] = [];
    readonly inheritances: InheritanceMetadataArgs[] = [];
    readonly discriminatorValues: DiscriminatorValueMetadataArgs[] = [];

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    filterTables(target: Function|string): TableMetadataArgs[];
    filterTables(target: (Function|string)[]): TableMetadataArgs[];
    filterTables(target: (Function|string)|(Function|string)[]): TableMetadataArgs[] {
        return this.filterByTarget(this.tables, target);
    }

    filterColumns(target: Function|string): ColumnMetadataArgs[];
    filterColumns(target: (Function|string)[]): ColumnMetadataArgs[];
    filterColumns(target: (Function|string)|(Function|string)[]): ColumnMetadataArgs[] {
        return this.filterByTargetAndWithoutDuplicateProperties(this.columns, target);
    }

    findGenerated(target: Function|string, propertyName: string): GeneratedMetadataArgs|undefined;
    findGenerated(target: (Function|string)[], propertyName: string): GeneratedMetadataArgs|undefined;
    findGenerated(target: (Function|string)|(Function|string)[], propertyName: string): GeneratedMetadataArgs|undefined {
        return this.generations.find(generated => {
            return (target instanceof Array ? target.indexOf(generated.target) !== -1 : generated.target === target) && generated.propertyName === propertyName;
        });
    }

    filterRelations(target: Function|string): RelationMetadataArgs[];
    filterRelations(target: (Function|string)[]): RelationMetadataArgs[];
    filterRelations(target: (Function|string)|(Function|string)[]): RelationMetadataArgs[] {
        return this.filterByTargetAndWithoutDuplicateProperties(this.relations, target);
    }

    filterRelationIds(target: Function|string): RelationIdMetadataArgs[];
    filterRelationIds(target: (Function|string)[]): RelationIdMetadataArgs[];
    filterRelationIds(target: (Function|string)|(Function|string)[]): RelationIdMetadataArgs[] {
        return this.filterByTargetAndWithoutDuplicateProperties(this.relationIds, target);
    }

    filterRelationCounts(target: Function|string): RelationCountMetadataArgs[];
    filterRelationCounts(target: (Function|string)[]): RelationCountMetadataArgs[];
    filterRelationCounts(target: (Function|string)|(Function|string)[]): RelationCountMetadataArgs[] {
        return this.filterByTargetAndWithoutDuplicateProperties(this.relationCounts, target);
    }

    filterIndices(target: Function|string): IndexMetadataArgs[];
    filterIndices(target: (Function|string)[]): IndexMetadataArgs[];
    filterIndices(target: (Function|string)|(Function|string)[]): IndexMetadataArgs[] {
        // todo: implement parent-entity overrides?
        return this.indices.filter(index => {
            return target instanceof Array ? target.indexOf(index.target) !== -1 : index.target === target;
        });
    }

    filterListeners(target: Function|string): EntityListenerMetadataArgs[];
    filterListeners(target: (Function|string)[]): EntityListenerMetadataArgs[];
    filterListeners(target: (Function|string)|(Function|string)[]): EntityListenerMetadataArgs[] {
        return this.filterByTarget(this.entityListeners, target);
    }

    filterEmbeddeds(target: Function|string): EmbeddedMetadataArgs[];
    filterEmbeddeds(target: (Function|string)[]): EmbeddedMetadataArgs[];
    filterEmbeddeds(target: (Function|string)|(Function|string)[]): EmbeddedMetadataArgs[] {
        return this.filterByTargetAndWithoutDuplicateProperties(this.embeddeds, target);
    }

    findJoinTable(target: Function|string, propertyName: string): JoinTableMetadataArgs|undefined {
        return this.joinTables.find(joinTable => {
            return joinTable.target === target && joinTable.propertyName === propertyName;
        });
    }

    filterJoinColumns(target: Function|string, propertyName: string): JoinColumnMetadataArgs[] {
        // todo: implement parent-entity overrides?
        return this.joinColumns.filter(joinColumn => {
            return joinColumn.target === target && joinColumn.propertyName === propertyName;
        });
    }

    filterSubscribers(target: Function|string): EntitySubscriberMetadataArgs[];
    filterSubscribers(target: (Function|string)[]): EntitySubscriberMetadataArgs[];
    filterSubscribers(target: (Function|string)|(Function|string)[]): EntitySubscriberMetadataArgs[] {
        return this.filterByTarget(this.entitySubscribers, target);
    }

    filterNamingStrategies(target: Function|string): NamingStrategyMetadataArgs[];
    filterNamingStrategies(target: (Function|string)[]): NamingStrategyMetadataArgs[];
    filterNamingStrategies(target: (Function|string)|(Function|string)[]): NamingStrategyMetadataArgs[] {
        return this.filterByTarget(this.namingStrategies, target);
    }

    filterTransactionEntityManagers(target: Function|string): TransactionEntityMetadataArgs[];
    filterTransactionEntityManagers(target: (Function|string)[]): TransactionEntityMetadataArgs[];
    filterTransactionEntityManagers(target: (Function|string)|(Function|string)[]): TransactionEntityMetadataArgs[] {
        return this.filterByTarget(this.transactionEntityManagers, target);
    }
    
    filterTransactionRepository(target: Function|string): TransactionRepositoryMetadataArgs[];
    filterTransactionRepository(target: (Function|string)[]): TransactionRepositoryMetadataArgs[];
    filterTransactionRepository(target: (Function|string)|(Function|string)[]): TransactionRepositoryMetadataArgs[] {
        return this.filterByTarget(this.transactionRepositories, target);
    }

    filterSingleTableChildren(target: Function|string): TableMetadataArgs[] {
        return this.tables.filter(table => {
            return table.target instanceof Function
                && target instanceof Function
                && MetadataUtils.isInherited(table.target, target)
                && table.type === "single-table-child";
        });
    }

    findInheritanceType(target: Function|string): InheritanceMetadataArgs|undefined {
        return this.inheritances.find(inheritance => inheritance.target === target);
    }

    findDiscriminatorValue(target: Function|string): DiscriminatorValueMetadataArgs|undefined {
        return this.discriminatorValues.find(discriminatorValue => discriminatorValue.target === target);
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Filters given array by a given target or targets.
     */
    protected filterByTarget<T extends { target: Function|string }>(array: T[], target: (Function|string)|(Function|string)[]): T[] {
        return array.filter(table => {
            return target instanceof Array ? target.indexOf(table.target) !== -1 : table.target === target;
        });
    }

    /**
     * Filters given array by a given target or targets and prevents duplicate property names.
     */
    protected filterByTargetAndWithoutDuplicateProperties<T extends { target: Function|string, propertyName: string }>(array: T[], target: (Function|string)|(Function|string)[]): T[] {
        const newArray: T[] = [];
        array.forEach(item => {
            const sameTarget = target instanceof Array ? target.indexOf(item.target) !== -1 : item.target === target;
            if (sameTarget) {
                if (!newArray.find(newItem => newItem.propertyName === item.propertyName))
                    newArray.push(item);
            }
        });
        return newArray;
    }

}