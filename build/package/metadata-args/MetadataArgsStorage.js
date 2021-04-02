"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataArgsStorage = void 0;
var MetadataUtils_1 = require("../metadata-builder/MetadataUtils");
/**
 * Storage all metadatas args of all available types: tables, columns, subscribers, relations, etc.
 * Each metadata args represents some specifications of what it represents.
 * MetadataArgs used to create a real Metadata objects.
 */
var MetadataArgsStorage = /** @class */ (function () {
    function MetadataArgsStorage() {
        // -------------------------------------------------------------------------
        // Properties
        // -------------------------------------------------------------------------
        this.tables = [];
        this.trees = [];
        this.entityRepositories = [];
        this.transactionEntityManagers = [];
        this.transactionRepositories = [];
        this.namingStrategies = [];
        this.entitySubscribers = [];
        this.indices = [];
        this.uniques = [];
        this.checks = [];
        this.exclusions = [];
        this.columns = [];
        this.generations = [];
        this.relations = [];
        this.joinColumns = [];
        this.joinTables = [];
        this.entityListeners = [];
        this.relationCounts = [];
        this.relationIds = [];
        this.embeddeds = [];
        this.inheritances = [];
        this.discriminatorValues = [];
    }
    MetadataArgsStorage.prototype.filterTables = function (target) {
        return this.filterByTarget(this.tables, target);
    };
    MetadataArgsStorage.prototype.filterColumns = function (target) {
        return this.filterByTargetAndWithoutDuplicateProperties(this.columns, target);
    };
    MetadataArgsStorage.prototype.findGenerated = function (target, propertyName) {
        return this.generations.find(function (generated) {
            return (Array.isArray(target) ? target.indexOf(generated.target) !== -1 : generated.target === target) && generated.propertyName === propertyName;
        });
    };
    MetadataArgsStorage.prototype.findTree = function (target) {
        return this.trees.find(function (tree) {
            return (Array.isArray(target) ? target.indexOf(tree.target) !== -1 : tree.target === target);
        });
    };
    MetadataArgsStorage.prototype.filterRelations = function (target) {
        return this.filterByTargetAndWithoutDuplicateProperties(this.relations, target);
    };
    MetadataArgsStorage.prototype.filterRelationIds = function (target) {
        return this.filterByTargetAndWithoutDuplicateProperties(this.relationIds, target);
    };
    MetadataArgsStorage.prototype.filterRelationCounts = function (target) {
        return this.filterByTargetAndWithoutDuplicateProperties(this.relationCounts, target);
    };
    MetadataArgsStorage.prototype.filterIndices = function (target) {
        // todo: implement parent-entity overrides?
        return this.indices.filter(function (index) {
            return Array.isArray(target) ? target.indexOf(index.target) !== -1 : index.target === target;
        });
    };
    MetadataArgsStorage.prototype.filterUniques = function (target) {
        return this.uniques.filter(function (unique) {
            return Array.isArray(target) ? target.indexOf(unique.target) !== -1 : unique.target === target;
        });
    };
    MetadataArgsStorage.prototype.filterChecks = function (target) {
        return this.checks.filter(function (check) {
            return Array.isArray(target) ? target.indexOf(check.target) !== -1 : check.target === target;
        });
    };
    MetadataArgsStorage.prototype.filterExclusions = function (target) {
        return this.exclusions.filter(function (exclusion) {
            return Array.isArray(target) ? target.indexOf(exclusion.target) !== -1 : exclusion.target === target;
        });
    };
    MetadataArgsStorage.prototype.filterListeners = function (target) {
        return this.filterByTarget(this.entityListeners, target);
    };
    MetadataArgsStorage.prototype.filterEmbeddeds = function (target) {
        return this.filterByTargetAndWithoutDuplicateEmbeddedProperties(this.embeddeds, target);
    };
    MetadataArgsStorage.prototype.findJoinTable = function (target, propertyName) {
        return this.joinTables.find(function (joinTable) {
            return joinTable.target === target && joinTable.propertyName === propertyName;
        });
    };
    MetadataArgsStorage.prototype.filterJoinColumns = function (target, propertyName) {
        // todo: implement parent-entity overrides?
        return this.joinColumns.filter(function (joinColumn) {
            return joinColumn.target === target && joinColumn.propertyName === propertyName;
        });
    };
    MetadataArgsStorage.prototype.filterSubscribers = function (target) {
        return this.filterByTarget(this.entitySubscribers, target);
    };
    MetadataArgsStorage.prototype.filterNamingStrategies = function (target) {
        return this.filterByTarget(this.namingStrategies, target);
    };
    MetadataArgsStorage.prototype.filterTransactionEntityManagers = function (target, propertyName) {
        return this.transactionEntityManagers.filter(function (transactionEm) {
            return (Array.isArray(target) ? target.indexOf(transactionEm.target) !== -1 : transactionEm.target === target) && transactionEm.methodName === propertyName;
        });
    };
    MetadataArgsStorage.prototype.filterTransactionRepository = function (target, propertyName) {
        return this.transactionRepositories.filter(function (transactionEm) {
            return (Array.isArray(target) ? target.indexOf(transactionEm.target) !== -1 : transactionEm.target === target) && transactionEm.methodName === propertyName;
        });
    };
    MetadataArgsStorage.prototype.filterSingleTableChildren = function (target) {
        return this.tables.filter(function (table) {
            return table.target instanceof Function
                && target instanceof Function
                && MetadataUtils_1.MetadataUtils.isInherited(table.target, target)
                && table.type === "entity-child";
        });
    };
    MetadataArgsStorage.prototype.findInheritanceType = function (target) {
        return this.inheritances.find(function (inheritance) { return inheritance.target === target; });
    };
    MetadataArgsStorage.prototype.findDiscriminatorValue = function (target) {
        return this.discriminatorValues.find(function (discriminatorValue) { return discriminatorValue.target === target; });
    };
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Filters given array by a given target or targets.
     */
    MetadataArgsStorage.prototype.filterByTarget = function (array, target) {
        return array.filter(function (table) {
            return Array.isArray(target) ? target.indexOf(table.target) !== -1 : table.target === target;
        });
    };
    /**
     * Filters given array by a given target or targets and prevents duplicate property names.
     */
    MetadataArgsStorage.prototype.filterByTargetAndWithoutDuplicateProperties = function (array, target) {
        var newArray = [];
        array.forEach(function (item) {
            var sameTarget = Array.isArray(target) ? target.indexOf(item.target) !== -1 : item.target === target;
            if (sameTarget) {
                if (!newArray.find(function (newItem) { return newItem.propertyName === item.propertyName; }))
                    newArray.push(item);
            }
        });
        return newArray;
    };
    /**
     * Filters given array by a given target or targets and prevents duplicate embedded property names.
     */
    MetadataArgsStorage.prototype.filterByTargetAndWithoutDuplicateEmbeddedProperties = function (array, target) {
        var newArray = [];
        array.forEach(function (item) {
            var sameTarget = Array.isArray(target) ? target.indexOf(item.target) !== -1 : item.target === target;
            if (sameTarget) {
                var isDuplicateEmbeddedProperty = newArray.find(function (newItem) {
                    return newItem.prefix === item.prefix && newItem.propertyName === item.propertyName;
                });
                if (!isDuplicateEmbeddedProperty)
                    newArray.push(item);
            }
        });
        return newArray;
    };
    return MetadataArgsStorage;
}());
exports.MetadataArgsStorage = MetadataArgsStorage;

//# sourceMappingURL=MetadataArgsStorage.js.map
