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
import {MetadataUtils} from "../metadata-builder/MetadataUtils";

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
    readonly namingStrategies: NamingStrategyMetadataArgs[] = [];
    readonly entitySubscribers: EntitySubscriberMetadataArgs[] = [];
    readonly indices: IndexMetadataArgs[] = [];
    readonly columns: ColumnMetadataArgs[] = [];
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

    filterTables(target?: Function|string): TableMetadataArgs[];
    filterTables(target?: (Function|string)[]): TableMetadataArgs[];
    filterTables(target?: (Function|string)|(Function|string)[]): TableMetadataArgs[] {
        return this.tables.filter(table => {
            return target instanceof Array ? target.indexOf(table.target) !== -1 : table.target === target;
        });
    }

    filterColumns(target: Function|string): ColumnMetadataArgs[];
    filterColumns(target: (Function|string)[]): ColumnMetadataArgs[];
    filterColumns(target: (Function|string)|(Function|string)[]): ColumnMetadataArgs[] {
        return this.columns.filter(column => {
            return target instanceof Array ? target.indexOf(column.target) !== -1 : column.target === target;
        });
    }

    filterRelations(target: Function|string): RelationMetadataArgs[];
    filterRelations(target: (Function|string)[]): RelationMetadataArgs[];
    filterRelations(target: (Function|string)|(Function|string)[]): RelationMetadataArgs[] {
        return this.relations.filter(relation => {
            return target instanceof Array ? target.indexOf(relation.target) !== -1 : relation.target === target;
        });
    }

    filterRelationIds(target: Function|string): RelationIdMetadataArgs[];
    filterRelationIds(target: (Function|string)[]): RelationIdMetadataArgs[];
    filterRelationIds(target: (Function|string)|(Function|string)[]): RelationIdMetadataArgs[] {
        return this.relationIds.filter(relationId => {
            return target instanceof Array ? target.indexOf(relationId.target) !== -1 : relationId.target === target;
        });
    }

    filterRelationCounts(target: Function|string): RelationCountMetadataArgs[];
    filterRelationCounts(target: (Function|string)[]): RelationCountMetadataArgs[];
    filterRelationCounts(target: (Function|string)|(Function|string)[]): RelationCountMetadataArgs[] {
        return this.relationCounts.filter(relationCount => {
            return target instanceof Array ? target.indexOf(relationCount.target) !== -1 : relationCount.target === target;
        });
    }

    filterIndices(target: Function|string): IndexMetadataArgs[];
    filterIndices(target: (Function|string)[]): IndexMetadataArgs[];
    filterIndices(target: (Function|string)|(Function|string)[]): IndexMetadataArgs[] {
        return this.indices.filter(index => {
            return target instanceof Array ? target.indexOf(index.target) !== -1 : index.target === target;
        });
    }

    filterListeners(target: Function|string): EntityListenerMetadataArgs[];
    filterListeners(target: (Function|string)[]): EntityListenerMetadataArgs[];
    filterListeners(target: (Function|string)|(Function|string)[]): EntityListenerMetadataArgs[] {
        return this.entityListeners.filter(index => {
            return target instanceof Array ? target.indexOf(index.target) !== -1 : index.target === target;
        });
    }

    filterEmbeddeds(target: Function|string): EmbeddedMetadataArgs[];
    filterEmbeddeds(target: (Function|string)[]): EmbeddedMetadataArgs[];
    filterEmbeddeds(target: (Function|string)|(Function|string)[]): EmbeddedMetadataArgs[] {
        return this.embeddeds.filter(embedded => {
            return target instanceof Array ? target.indexOf(embedded.target) !== -1 : embedded.target === target;
        });
    }

    findJoinTable(target: Function|string, propertyName: string): JoinTableMetadataArgs|undefined {
        return this.joinTables.find(joinTable => {
            return joinTable.target === target && joinTable.propertyName === propertyName;
        });
    }

    filterJoinColumns(target: Function|string, propertyName: string): JoinColumnMetadataArgs[] {
        return this.joinColumns.filter(joinColumn => {
            return joinColumn.target === target && joinColumn.propertyName === propertyName;
        });
    }

    filterSubscribers(target: Function|string): EntitySubscriberMetadataArgs[];
    filterSubscribers(target: (Function|string)[]): EntitySubscriberMetadataArgs[];
    filterSubscribers(target: (Function|string)|(Function|string)[]): EntitySubscriberMetadataArgs[] {
        return this.entitySubscribers.filter(subscriber => {
            return target instanceof Array ? target.indexOf(subscriber.target) !== -1 : subscriber.target === target;
        });
    }

    filterNamingStrategies(target: Function|string): NamingStrategyMetadataArgs[];
    filterNamingStrategies(target: (Function|string)[]): NamingStrategyMetadataArgs[];
    filterNamingStrategies(target: (Function|string)|(Function|string)[]): NamingStrategyMetadataArgs[] {
        return this.namingStrategies.filter(subscriber => {
            return target instanceof Array ? target.indexOf(subscriber.target) !== -1 : subscriber.target === target;
        });
    }

    filterTransactionEntityManagers(target: Function|string): TransactionEntityMetadataArgs[];
    filterTransactionEntityManagers(target: (Function|string)[]): TransactionEntityMetadataArgs[];
    filterTransactionEntityManagers(target: (Function|string)|(Function|string)[]): TransactionEntityMetadataArgs[] {
        return this.transactionEntityManagers.filter(subscriber => {
            return target instanceof Array ? target.indexOf(subscriber.target) !== -1 : subscriber.target === target;
        });
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

}