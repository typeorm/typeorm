import { RelationMetadataArgs } from "./RelationMetadataArgs"
import { ColumnMetadataArgs } from "./ColumnMetadataArgs"
import { RelationCountMetadataArgs } from "./RelationCountMetadataArgs"
import { IndexMetadataArgs } from "./IndexMetadataArgs"
import { EntityListenerMetadataArgs } from "./EntityListenerMetadataArgs"
import { TableMetadataArgs } from "./TableMetadataArgs"
import { NamingStrategyMetadataArgs } from "./NamingStrategyMetadataArgs"
import { JoinTableMetadataArgs } from "./JoinTableMetadataArgs"
import { JoinColumnMetadataArgs } from "./JoinColumnMetadataArgs"
import { EmbeddedMetadataArgs } from "./EmbeddedMetadataArgs"
import { EntitySubscriberMetadataArgs } from "./EntitySubscriberMetadataArgs"
import { RelationIdMetadataArgs } from "./RelationIdMetadataArgs"
import { InheritanceMetadataArgs } from "./InheritanceMetadataArgs"
import { DiscriminatorValueMetadataArgs } from "./DiscriminatorValueMetadataArgs"
import { EntityRepositoryMetadataArgs } from "./EntityRepositoryMetadataArgs"
import { TransactionEntityMetadataArgs } from "./TransactionEntityMetadataArgs"
import { TransactionRepositoryMetadataArgs } from "./TransactionRepositoryMetadataArgs"
import { MetadataUtils } from "../metadata-builder/MetadataUtils"
import { GeneratedMetadataArgs } from "./GeneratedMetadataArgs"
import { TreeMetadataArgs } from "./TreeMetadataArgs"
import { UniqueMetadataArgs } from "./UniqueMetadataArgs"
import { CheckMetadataArgs } from "./CheckMetadataArgs"
import { ExclusionMetadataArgs } from "./ExclusionMetadataArgs"
import { ForeignKeyMetadataArgs } from "./ForeignKeyMetadataArgs"

/**
 * Storage all metadatas args of all available types: tables, columns, subscribers, relations, etc.
 * Each metadata args represents some specifications of what it represents.
 * MetadataArgs used to create a real Metadata objects.
 */
export class MetadataArgsStorage {
    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    readonly tables: TableMetadataArgs[] = []
    readonly trees: TreeMetadataArgs[] = []
    readonly entityRepositories: EntityRepositoryMetadataArgs[] = []
    readonly transactionEntityManagers: TransactionEntityMetadataArgs[] = []
    readonly transactionRepositories: TransactionRepositoryMetadataArgs[] = []
    readonly namingStrategies: NamingStrategyMetadataArgs[] = []
    readonly entitySubscribers: EntitySubscriberMetadataArgs[] = []
    readonly indices: IndexMetadataArgs[] = []
    readonly foreignKeys: ForeignKeyMetadataArgs[] = []
    readonly uniques: UniqueMetadataArgs[] = []
    readonly checks: CheckMetadataArgs[] = []
    readonly exclusions: ExclusionMetadataArgs[] = []
    readonly columns: ColumnMetadataArgs[] = []
    readonly generations: GeneratedMetadataArgs[] = []
    readonly relations: RelationMetadataArgs[] = []
    readonly joinColumns: JoinColumnMetadataArgs[] = []
    readonly joinTables: JoinTableMetadataArgs[] = []
    readonly entityListeners: EntityListenerMetadataArgs[] = []
    readonly relationCounts: RelationCountMetadataArgs[] = []
    readonly relationIds: RelationIdMetadataArgs[] = []
    readonly embeddeds: EmbeddedMetadataArgs[] = []
    readonly inheritances: InheritanceMetadataArgs[] = []
    readonly discriminatorValues: DiscriminatorValueMetadataArgs[] = []

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    filterTables(target: Function | string): TableMetadataArgs[]
    filterTables(target: (Function | string)[]): TableMetadataArgs[]
    filterTables(
        target: (Function | string) | (Function | string)[],
    ): TableMetadataArgs[] {
        return this.filterByTarget(this.tables, target)
    }

    filterColumns(target: Function | string): ColumnMetadataArgs[]
    filterColumns(target: (Function | string)[]): ColumnMetadataArgs[]
    filterColumns(
        target: (Function | string) | (Function | string)[],
    ): ColumnMetadataArgs[] {
        return this.filterByTargetAndWithoutDuplicateProperties(
            this.columns,
            target,
        )
    }

    findGenerated(
        target: Function | string,
        propertyName: string,
    ): GeneratedMetadataArgs | undefined
    findGenerated(
        target: (Function | string)[],
        propertyName: string,
    ): GeneratedMetadataArgs | undefined
    findGenerated(
        target: (Function | string) | (Function | string)[],
        propertyName: string,
    ): GeneratedMetadataArgs | undefined {
        return this.generations.find((generated) => {
            return (
                (Array.isArray(target)
                    ? target.indexOf(generated.target) !== -1
                    : generated.target === target) &&
                generated.propertyName === propertyName
            )
        })
    }

    findTree(
        target: (Function | string) | (Function | string)[],
    ): TreeMetadataArgs | undefined {
        return this.trees.find((tree) => {
            return Array.isArray(target)
                ? target.indexOf(tree.target) !== -1
                : tree.target === target
        })
    }

    filterRelations(target: Function | string): RelationMetadataArgs[]
    filterRelations(target: (Function | string)[]): RelationMetadataArgs[]
    filterRelations(
        target: (Function | string) | (Function | string)[],
    ): RelationMetadataArgs[] {
        return this.filterByTargetAndWithoutDuplicateRelationProperties(
            this.relations,
            target,
        )
    }

    filterRelationIds(target: Function | string): RelationIdMetadataArgs[]
    filterRelationIds(target: (Function | string)[]): RelationIdMetadataArgs[]
    filterRelationIds(
        target: (Function | string) | (Function | string)[],
    ): RelationIdMetadataArgs[] {
        return this.filterByTargetAndWithoutDuplicateProperties(
            this.relationIds,
            target,
        )
    }

    filterRelationCounts(target: Function | string): RelationCountMetadataArgs[]
    filterRelationCounts(
        target: (Function | string)[],
    ): RelationCountMetadataArgs[]
    filterRelationCounts(
        target: (Function | string) | (Function | string)[],
    ): RelationCountMetadataArgs[] {
        return this.filterByTargetAndWithoutDuplicateProperties(
            this.relationCounts,
            target,
        )
    }

    filterIndices(target: Function | string): IndexMetadataArgs[]
    filterIndices(target: (Function | string)[]): IndexMetadataArgs[]
    filterIndices(
        target: (Function | string) | (Function | string)[],
    ): IndexMetadataArgs[] {
        return this.filterByTargetAndWithoutDuplicateIndices(
            this.indices,
            target,
        )
    }

    filterForeignKeys(target: Function | string): ForeignKeyMetadataArgs[]
    filterForeignKeys(target: (Function | string)[]): ForeignKeyMetadataArgs[]
    filterForeignKeys(
        target: (Function | string) | (Function | string)[],
    ): ForeignKeyMetadataArgs[] {
        return this.foreignKeys.filter((foreignKey) => {
            return Array.isArray(target)
                ? target.indexOf(foreignKey.target) !== -1
                : foreignKey.target === target
        })
    }

    filterUniques(target: Function | string): UniqueMetadataArgs[]
    filterUniques(target: (Function | string)[]): UniqueMetadataArgs[]
    filterUniques(
        target: (Function | string) | (Function | string)[],
    ): UniqueMetadataArgs[] {
        return this.uniques.filter((unique) => {
            return Array.isArray(target)
                ? target.indexOf(unique.target) !== -1
                : unique.target === target
        })
    }

    filterChecks(target: Function | string): CheckMetadataArgs[]
    filterChecks(target: (Function | string)[]): CheckMetadataArgs[]
    filterChecks(
        target: (Function | string) | (Function | string)[],
    ): CheckMetadataArgs[] {
        return this.checks.filter((check) => {
            return Array.isArray(target)
                ? target.indexOf(check.target) !== -1
                : check.target === target
        })
    }

    filterExclusions(target: Function | string): ExclusionMetadataArgs[]
    filterExclusions(target: (Function | string)[]): ExclusionMetadataArgs[]
    filterExclusions(
        target: (Function | string) | (Function | string)[],
    ): ExclusionMetadataArgs[] {
        return this.exclusions.filter((exclusion) => {
            return Array.isArray(target)
                ? target.indexOf(exclusion.target) !== -1
                : exclusion.target === target
        })
    }

    filterListeners(target: Function | string): EntityListenerMetadataArgs[]
    filterListeners(target: (Function | string)[]): EntityListenerMetadataArgs[]
    filterListeners(
        target: (Function | string) | (Function | string)[],
    ): EntityListenerMetadataArgs[] {
        return this.filterByTarget(this.entityListeners, target)
    }

    filterEmbeddeds(target: Function | string): EmbeddedMetadataArgs[]
    filterEmbeddeds(target: (Function | string)[]): EmbeddedMetadataArgs[]
    filterEmbeddeds(
        target: (Function | string) | (Function | string)[],
    ): EmbeddedMetadataArgs[] {
        return this.filterByTargetAndWithoutDuplicateEmbeddedProperties(
            this.embeddeds,
            target,
        )
    }

    findJoinTable(
        target: Function | string,
        propertyName: string,
    ): JoinTableMetadataArgs | undefined {
        return this.joinTables.find((joinTable) => {
            return (
                joinTable.target === target &&
                joinTable.propertyName === propertyName
            )
        })
    }

    filterJoinColumns(
        target: Function | string,
        propertyName: string,
    ): JoinColumnMetadataArgs[] {
        // todo: implement parent-entity overrides?
        return this.joinColumns.filter((joinColumn) => {
            return (
                joinColumn.target === target &&
                joinColumn.propertyName === propertyName
            )
        })
    }

    filterSubscribers(target: Function | string): EntitySubscriberMetadataArgs[]
    filterSubscribers(
        target: (Function | string)[],
    ): EntitySubscriberMetadataArgs[]
    filterSubscribers(
        target: (Function | string) | (Function | string)[],
    ): EntitySubscriberMetadataArgs[] {
        return this.filterByTarget(this.entitySubscribers, target)
    }

    filterNamingStrategies(
        target: Function | string,
    ): NamingStrategyMetadataArgs[]
    filterNamingStrategies(
        target: (Function | string)[],
    ): NamingStrategyMetadataArgs[]
    filterNamingStrategies(
        target: (Function | string) | (Function | string)[],
    ): NamingStrategyMetadataArgs[] {
        return this.filterByTarget(this.namingStrategies, target)
    }

    filterTransactionEntityManagers(
        target: Function | string,
        propertyName: string,
    ): TransactionEntityMetadataArgs[] {
        return this.transactionEntityManagers.filter((transactionEm) => {
            return (
                (Array.isArray(target)
                    ? target.indexOf(transactionEm.target) !== -1
                    : transactionEm.target === target) &&
                transactionEm.methodName === propertyName
            )
        })
    }

    filterTransactionRepository(
        target: Function | string,
        propertyName: string,
    ): TransactionRepositoryMetadataArgs[] {
        return this.transactionRepositories.filter((transactionEm) => {
            return (
                (Array.isArray(target)
                    ? target.indexOf(transactionEm.target) !== -1
                    : transactionEm.target === target) &&
                transactionEm.methodName === propertyName
            )
        })
    }

    filterSingleTableChildren(target: Function | string): TableMetadataArgs[] {
        return this.tables.filter((table) => {
            return (
                typeof table.target === "function" &&
                typeof target === "function" &&
                MetadataUtils.isInherited(table.target, target) &&
                table.type === "entity-child"
            )
        })
    }

    findInheritanceType(
        target: Function | string,
    ): InheritanceMetadataArgs | undefined {
        return this.inheritances.find(
            (inheritance) => inheritance.target === target,
        )
    }

    findDiscriminatorValue(
        target: Function | string,
    ): DiscriminatorValueMetadataArgs | undefined {
        return this.discriminatorValues.find(
            (discriminatorValue) => discriminatorValue.target === target,
        )
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Filters given array by a given target or targets.
     */
    protected filterByTarget<T extends { target: Function | string }>(
        array: T[],
        target: (Function | string) | (Function | string)[],
    ): T[] {
        return array.filter((table) => {
            return Array.isArray(target)
                ? target.indexOf(table.target) !== -1
                : table.target === target
        })
    }

    /**
     * Filters given array by a given target or targets and prevents duplicate property names.
     */
    protected filterByTargetAndWithoutDuplicateProperties<
        T extends { target: Function | string; propertyName: string },
    >(array: T[], target: (Function | string) | (Function | string)[]): T[] {
        const newArray: T[] = []
        array.forEach((item) => {
            const sameTarget = Array.isArray(target)
                ? target.indexOf(item.target) !== -1
                : item.target === target
            if (sameTarget) {
                if (
                    !newArray.find(
                        (newItem) => newItem.propertyName === item.propertyName,
                    )
                )
                    newArray.push(item)
            }
        })
        return newArray
    }

    /**
     * Filters given array by a given target or targets and prevents duplicate relation property names.
     */
    protected filterByTargetAndWithoutDuplicateRelationProperties<
        T extends RelationMetadataArgs,
    >(array: T[], target: (Function | string) | (Function | string)[]): T[] {
        const newArray: T[] = []
        array.forEach((item) => {
            const sameTarget = Array.isArray(target)
                ? target.indexOf(item.target) !== -1
                : item.target === target
            if (sameTarget) {
                const existingIndex = newArray.findIndex(
                    (newItem) => newItem.propertyName === item.propertyName,
                )
                if (
                    Array.isArray(target) &&
                    existingIndex !== -1 &&
                    target.indexOf(item.target) <
                        target.indexOf(newArray[existingIndex].target)
                ) {
                    const clone = Object.create(newArray[existingIndex])
                    clone.type = item.type
                    newArray[existingIndex] = clone
                } else if (existingIndex === -1) {
                    newArray.push(item)
                }
            }
        })
        return newArray
    }

    /**
     * Filters given array by a given target or targets and prevents duplicate embedded property names.
     */
    protected filterByTargetAndWithoutDuplicateEmbeddedProperties<
        T extends EmbeddedMetadataArgs,
    >(array: T[], target: (Function | string) | (Function | string)[]): T[] {
        const newArray: T[] = []
        array.forEach((item) => {
            const sameTarget = Array.isArray(target)
                ? target.indexOf(item.target) !== -1
                : item.target === target
            if (sameTarget) {
                const isDuplicateEmbeddedProperty = newArray.find(
                    (newItem: EmbeddedMetadataArgs): boolean =>
                        newItem.prefix === item.prefix &&
                        newItem.propertyName === item.propertyName,
                )
                if (!isDuplicateEmbeddedProperty) newArray.push(item)
            }
        })
        return newArray
    }

    /**
     * Filters given array by a given target or targets and prevents duplicate indices.
     */
    protected filterByTargetAndWithoutDuplicateIndices(
        array: IndexMetadataArgs[],
        target: (Function | string) | (Function | string)[],
    ): IndexMetadataArgs[] {
        const newArray: IndexMetadataArgs[] = []
        array.forEach((item) => {
            const sameTarget = Array.isArray(target)
                ? target.indexOf(item.target) !== -1
                : item.target === target
            if (sameTarget) {
                const isDuplicateIndex = newArray.find(
                    (newItem: IndexMetadataArgs): boolean => {
                        // If names are defined, compare only by name
                        if (item.name && newItem.name) {
                            return item.name === newItem.name
                        }

                        // If only one has a name, they're not duplicates
                        if (item.name || newItem.name) {
                            return false
                        }

                        // If no name is defined, compare by columns and other properties
                        const columnsMatch = this.areIndexColumnsEqual(
                            item.columns,
                            newItem.columns,
                        )
                        const propertiesMatch =
                            item.unique === newItem.unique &&
                            item.spatial === newItem.spatial &&
                            item.fulltext === newItem.fulltext &&
                            item.nullFiltered === newItem.nullFiltered &&
                            item.parser === newItem.parser &&
                            item.where === newItem.where &&
                            item.sparse === newItem.sparse &&
                            item.synchronize === newItem.synchronize &&
                            item.expireAfterSeconds ===
                                newItem.expireAfterSeconds &&
                            item.type === newItem.type

                        return columnsMatch && propertiesMatch
                    },
                )
                if (!isDuplicateIndex) newArray.push(item)
            }
        })
        return newArray
    }

    /**
     * Checks if two index column definitions are equal.
     */
    private areIndexColumnsEqual(
        columns1:
            | ((object?: any) => any[] | { [key: string]: number })
            | string[]
            | undefined,
        columns2:
            | ((object?: any) => any[] | { [key: string]: number })
            | string[]
            | undefined,
    ): boolean {
        // If both are undefined, they're equal
        if (columns1 === undefined && columns2 === undefined) {
            return true
        }

        // If one is undefined and the other isn't, they're not equal
        if (columns1 === undefined || columns2 === undefined) {
            return false
        }

        // If both are functions, compare by reference (same function)
        if (typeof columns1 === "function" && typeof columns2 === "function") {
            return columns1 === columns2
        }

        // If one is a function and the other isn't, they're not equal
        if (typeof columns1 === "function" || typeof columns2 === "function") {
            return false
        }

        // Both are string arrays - compare them
        if (Array.isArray(columns1) && Array.isArray(columns2)) {
            if (columns1.length !== columns2.length) {
                return false
            }
            return columns1.every((col, index) => col === columns2[index])
        }

        // Both are objects - compare them
        if (typeof columns1 === "object" && typeof columns2 === "object") {
            const keys1 = Object.keys(columns1)
            const keys2 = Object.keys(columns2)
            if (keys1.length !== keys2.length) {
                return false
            }
            return keys1.every(
                (key) =>
                    keys2.includes(key) &&
                    (columns1 as any)[key] === (columns2 as any)[key],
            )
        }

        return false
    }
}
