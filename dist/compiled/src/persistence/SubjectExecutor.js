"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var PromiseUtils_1 = require("../util/PromiseUtils");
var SubjectTopoligicalSorter_1 = require("./SubjectTopoligicalSorter");
var SubjectChangedColumnsComputer_1 = require("./SubjectChangedColumnsComputer");
var SubjectWithoutIdentifierError_1 = require("../error/SubjectWithoutIdentifierError");
var SubjectRemovedAndUpdatedError_1 = require("../error/SubjectRemovedAndUpdatedError");
var MongoQueryRunner_1 = require("../driver/mongodb/MongoQueryRunner");
var MongoDriver_1 = require("../driver/mongodb/MongoDriver");
var BroadcasterResult_1 = require("../subscriber/BroadcasterResult");
var OracleDriver_1 = require("../driver/oracle/OracleDriver");
var NestedSetSubjectExecutor_1 = require("./tree/NestedSetSubjectExecutor");
var ClosureSubjectExecutor_1 = require("./tree/ClosureSubjectExecutor");
var MaterializedPathSubjectExecutor_1 = require("./tree/MaterializedPathSubjectExecutor");
var OrmUtils_1 = require("../util/OrmUtils");
/**
 * Executes all database operations (inserts, updated, deletes) that must be executed
 * with given persistence subjects.
 */
var SubjectExecutor = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function SubjectExecutor(queryRunner, subjects, options) {
        // -------------------------------------------------------------------------
        // Public Properties
        // -------------------------------------------------------------------------
        /**
         * Indicates if executor has any operations to execute (e.g. has insert / update / delete operations to be executed).
         */
        this.hasExecutableOperations = false;
        /**
         * Subjects that must be inserted.
         */
        this.insertSubjects = [];
        /**
         * Subjects that must be updated.
         */
        this.updateSubjects = [];
        /**
         * Subjects that must be removed.
         */
        this.removeSubjects = [];
        this.queryRunner = queryRunner;
        this.allSubjects = subjects;
        this.options = options;
        this.validate();
        this.recompute();
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Executes all operations over given array of subjects.
     * Executes queries using given query runner.
     */
    SubjectExecutor.prototype.execute = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var broadcasterResult;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        broadcasterResult = undefined;
                        if (!(!this.options || this.options.listeners !== false)) return [3 /*break*/, 2];
                        // console.time(".broadcastBeforeEventsForAll");
                        broadcasterResult = this.broadcastBeforeEventsForAll();
                        if (!(broadcasterResult.promises.length > 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, Promise.all(broadcasterResult.promises)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        // since event listeners and subscribers can call save methods and/or trigger entity changes we need to recompute operational subjects
                        // recompute only in the case if any listener or subscriber was really executed
                        if (broadcasterResult && broadcasterResult.count > 0) {
                            // console.time(".recompute");
                            this.insertSubjects.forEach(function (subject) { return subject.recompute(); });
                            this.updateSubjects.forEach(function (subject) { return subject.recompute(); });
                            this.removeSubjects.forEach(function (subject) { return subject.recompute(); });
                            this.recompute();
                            // console.timeEnd(".recompute");
                        }
                        // make sure our insert subjects are sorted (using topological sorting) to make cascade inserts work properly
                        // console.timeEnd("prepare");
                        // execute all insert operations
                        // console.time(".insertion");
                        this.insertSubjects = new SubjectTopoligicalSorter_1.SubjectTopoligicalSorter(this.insertSubjects).sort("insert");
                        return [4 /*yield*/, this.executeInsertOperations()];
                    case 3:
                        _a.sent();
                        // console.timeEnd(".insertion");
                        // recompute update operations since insertion can create updation operations for the
                        // properties it wasn't able to handle on its own (referenced columns)
                        this.updateSubjects = this.allSubjects.filter(function (subject) { return subject.mustBeUpdated; });
                        // execute update operations
                        // console.time(".updation");
                        return [4 /*yield*/, this.executeUpdateOperations()];
                    case 4:
                        // execute update operations
                        // console.time(".updation");
                        _a.sent();
                        // console.timeEnd(".updation");
                        // make sure our remove subjects are sorted (using topological sorting) when multiple entities are passed for the removal
                        // console.time(".removal");
                        this.removeSubjects = new SubjectTopoligicalSorter_1.SubjectTopoligicalSorter(this.removeSubjects).sort("delete");
                        return [4 /*yield*/, this.executeRemoveOperations()];
                    case 5:
                        _a.sent();
                        // console.timeEnd(".removal");
                        // update all special columns in persisted entities, like inserted id or remove ids from the removed entities
                        // console.time(".updateSpecialColumnsInPersistedEntities");
                        return [4 /*yield*/, this.updateSpecialColumnsInPersistedEntities()];
                    case 6:
                        // console.timeEnd(".removal");
                        // update all special columns in persisted entities, like inserted id or remove ids from the removed entities
                        // console.time(".updateSpecialColumnsInPersistedEntities");
                        _a.sent();
                        if (!(!this.options || this.options.listeners !== false)) return [3 /*break*/, 8];
                        // console.time(".broadcastAfterEventsForAll");
                        broadcasterResult = this.broadcastAfterEventsForAll();
                        if (!(broadcasterResult.promises.length > 0)) return [3 /*break*/, 8];
                        return [4 /*yield*/, Promise.all(broadcasterResult.promises)];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Validates all given subjects.
     */
    SubjectExecutor.prototype.validate = function () {
        this.allSubjects.forEach(function (subject) {
            if (subject.mustBeUpdated && subject.mustBeRemoved)
                throw new SubjectRemovedAndUpdatedError_1.SubjectRemovedAndUpdatedError(subject);
        });
    };
    /**
     * Performs entity re-computations - finds changed columns, re-builds insert/update/remove subjects.
     */
    SubjectExecutor.prototype.recompute = function () {
        new SubjectChangedColumnsComputer_1.SubjectChangedColumnsComputer().compute(this.allSubjects);
        this.insertSubjects = this.allSubjects.filter(function (subject) { return subject.mustBeInserted; });
        this.updateSubjects = this.allSubjects.filter(function (subject) { return subject.mustBeUpdated; });
        this.removeSubjects = this.allSubjects.filter(function (subject) { return subject.mustBeRemoved; });
        this.hasExecutableOperations = this.insertSubjects.length > 0 || this.updateSubjects.length > 0 || this.removeSubjects.length > 0;
    };
    /**
     * Broadcasts "BEFORE_INSERT", "BEFORE_UPDATE", "BEFORE_REMOVE" events for all given subjects.
     */
    SubjectExecutor.prototype.broadcastBeforeEventsForAll = function () {
        var _this = this;
        var result = new BroadcasterResult_1.BroadcasterResult();
        if (this.insertSubjects.length)
            this.insertSubjects.forEach(function (subject) { return _this.queryRunner.broadcaster.broadcastBeforeInsertEvent(result, subject.metadata, subject.entity); });
        if (this.updateSubjects.length)
            this.updateSubjects.forEach(function (subject) { return _this.queryRunner.broadcaster.broadcastBeforeUpdateEvent(result, subject.metadata, subject.entity, subject.databaseEntity, subject.diffColumns, subject.diffRelations); });
        if (this.removeSubjects.length)
            this.removeSubjects.forEach(function (subject) { return _this.queryRunner.broadcaster.broadcastBeforeRemoveEvent(result, subject.metadata, subject.entity, subject.databaseEntity); });
        return result;
    };
    /**
     * Broadcasts "AFTER_INSERT", "AFTER_UPDATE", "AFTER_REMOVE" events for all given subjects.
     * Returns void if there wasn't any listener or subscriber executed.
     * Note: this method has a performance-optimized code organization.
     */
    SubjectExecutor.prototype.broadcastAfterEventsForAll = function () {
        var _this = this;
        var result = new BroadcasterResult_1.BroadcasterResult();
        if (this.insertSubjects.length)
            this.insertSubjects.forEach(function (subject) { return _this.queryRunner.broadcaster.broadcastAfterInsertEvent(result, subject.metadata, subject.entity); });
        if (this.updateSubjects.length)
            this.updateSubjects.forEach(function (subject) { return _this.queryRunner.broadcaster.broadcastAfterUpdateEvent(result, subject.metadata, subject.entity, subject.databaseEntity, subject.diffColumns, subject.diffRelations); });
        if (this.removeSubjects.length)
            this.removeSubjects.forEach(function (subject) { return _this.queryRunner.broadcaster.broadcastAfterRemoveEvent(result, subject.metadata, subject.entity, subject.databaseEntity); });
        return result;
    };
    /**
     * Executes insert operations.
     */
    SubjectExecutor.prototype.executeInsertOperations = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, groupedInsertSubjects, groupedInsertSubjectKeys;
            var _this = this;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = tslib_1.__read(this.groupBulkSubjects(this.insertSubjects, "insert"), 2), groupedInsertSubjects = _a[0], groupedInsertSubjectKeys = _a[1];
                        // then we run insertion in the sequential order which is important since we have an ordered subjects
                        return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(groupedInsertSubjectKeys, function (groupName) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                var subjects, bulkInsertMaps, bulkInsertSubjects, singleInsertSubjects, manager, insertResult_1, insertResult_2;
                                var _this = this;
                                return tslib_1.__generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            subjects = groupedInsertSubjects[groupName];
                                            bulkInsertMaps = [];
                                            bulkInsertSubjects = [];
                                            singleInsertSubjects = [];
                                            if (this.queryRunner.connection.driver instanceof MongoDriver_1.MongoDriver) {
                                                subjects.forEach(function (subject) {
                                                    if (subject.metadata.createDateColumn && subject.entity) {
                                                        subject.entity[subject.metadata.createDateColumn.databaseName] = new Date();
                                                    }
                                                    if (subject.metadata.updateDateColumn && subject.entity) {
                                                        subject.entity[subject.metadata.updateDateColumn.databaseName] = new Date();
                                                    }
                                                    subject.createValueSetAndPopChangeMap();
                                                    bulkInsertSubjects.push(subject);
                                                    bulkInsertMaps.push(subject.entity);
                                                });
                                            }
                                            else if (this.queryRunner.connection.driver instanceof OracleDriver_1.OracleDriver) {
                                                subjects.forEach(function (subject) {
                                                    singleInsertSubjects.push(subject);
                                                });
                                            }
                                            else {
                                                subjects.forEach(function (subject) {
                                                    // we do not insert in bulk in following cases:
                                                    // - when there is no values in insert (only defaults are inserted), since we cannot use DEFAULT VALUES expression for multiple inserted rows
                                                    // - when entity is a tree table, since tree tables require extra operation per each inserted row
                                                    // - when oracle is used, since oracle's bulk insertion is very bad
                                                    if (subject.changeMaps.length === 0 ||
                                                        subject.metadata.treeType ||
                                                        _this.queryRunner.connection.driver instanceof OracleDriver_1.OracleDriver) {
                                                        singleInsertSubjects.push(subject);
                                                    }
                                                    else {
                                                        bulkInsertSubjects.push(subject);
                                                        bulkInsertMaps.push(subject.createValueSetAndPopChangeMap());
                                                    }
                                                });
                                            }
                                            if (!(this.queryRunner instanceof MongoQueryRunner_1.MongoQueryRunner)) return [3 /*break*/, 2];
                                            manager = this.queryRunner.manager;
                                            return [4 /*yield*/, manager.insert(subjects[0].metadata.target, bulkInsertMaps)];
                                        case 1:
                                            insertResult_1 = _a.sent();
                                            subjects.forEach(function (subject, index) {
                                                subject.identifier = insertResult_1.identifiers[index];
                                                subject.generatedMap = insertResult_1.generatedMaps[index];
                                                subject.insertedValueSet = bulkInsertMaps[index];
                                            });
                                            return [3 /*break*/, 6];
                                        case 2:
                                            if (!(bulkInsertMaps.length > 0)) return [3 /*break*/, 4];
                                            return [4 /*yield*/, this.queryRunner
                                                    .manager
                                                    .createQueryBuilder()
                                                    .insert()
                                                    .into(subjects[0].metadata.target)
                                                    .values(bulkInsertMaps)
                                                    .updateEntity(this.options && this.options.reload === false ? false : true)
                                                    .callListeners(false)
                                                    .execute()];
                                        case 3:
                                            insertResult_2 = _a.sent();
                                            bulkInsertSubjects.forEach(function (subject, index) {
                                                subject.identifier = insertResult_2.identifiers[index];
                                                subject.generatedMap = insertResult_2.generatedMaps[index];
                                                subject.insertedValueSet = bulkInsertMaps[index];
                                            });
                                            _a.label = 4;
                                        case 4:
                                            if (!(singleInsertSubjects.length > 0)) return [3 /*break*/, 6];
                                            return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(singleInsertSubjects, function (subject) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                                    return tslib_1.__generator(this, function (_a) {
                                                        switch (_a.label) {
                                                            case 0:
                                                                subject.insertedValueSet = subject.createValueSetAndPopChangeMap(); // important to have because query builder sets inserted values into it
                                                                if (!(subject.metadata.treeType === "nested-set")) return [3 /*break*/, 2];
                                                                return [4 /*yield*/, new NestedSetSubjectExecutor_1.NestedSetSubjectExecutor(this.queryRunner).insert(subject)];
                                                            case 1:
                                                                _a.sent();
                                                                _a.label = 2;
                                                            case 2: return [4 /*yield*/, this.queryRunner
                                                                    .manager
                                                                    .createQueryBuilder()
                                                                    .insert()
                                                                    .into(subject.metadata.target)
                                                                    .values(subject.insertedValueSet)
                                                                    .updateEntity(this.options && this.options.reload === false ? false : true)
                                                                    .callListeners(false)
                                                                    .execute()
                                                                    .then(function (insertResult) {
                                                                    subject.identifier = insertResult.identifiers[0];
                                                                    subject.generatedMap = insertResult.generatedMaps[0];
                                                                })];
                                                            case 3:
                                                                _a.sent();
                                                                if (!(subject.metadata.treeType === "closure-table")) return [3 /*break*/, 5];
                                                                return [4 /*yield*/, new ClosureSubjectExecutor_1.ClosureSubjectExecutor(this.queryRunner).insert(subject)];
                                                            case 4:
                                                                _a.sent();
                                                                return [3 /*break*/, 7];
                                                            case 5:
                                                                if (!(subject.metadata.treeType === "materialized-path")) return [3 /*break*/, 7];
                                                                return [4 /*yield*/, new MaterializedPathSubjectExecutor_1.MaterializedPathSubjectExecutor(this.queryRunner).insert(subject)];
                                                            case 6:
                                                                _a.sent();
                                                                _a.label = 7;
                                                            case 7: return [2 /*return*/];
                                                        }
                                                    });
                                                }); })];
                                        case 5:
                                            _a.sent();
                                            _a.label = 6;
                                        case 6:
                                            subjects.forEach(function (subject) {
                                                if (subject.generatedMap) {
                                                    subject.metadata.columns.forEach(function (column) {
                                                        var value = column.getEntityValue(subject.generatedMap);
                                                        if (value !== undefined && value !== null) {
                                                            var preparedValue = _this.queryRunner.connection.driver.prepareHydratedValue(value, column);
                                                            column.setEntityValue(subject.generatedMap, preparedValue);
                                                        }
                                                    });
                                                }
                                            });
                                            return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 1:
                        // then we run insertion in the sequential order which is important since we have an ordered subjects
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Updates all given subjects in the database.
     */
    SubjectExecutor.prototype.executeUpdateOperations = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all(this.updateSubjects.map(function (subject) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            var partialEntity, manager, updateMap, updateQueryBuilder, updateResult;
                            var _this = this;
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!subject.identifier)
                                            throw new SubjectWithoutIdentifierError_1.SubjectWithoutIdentifierError(subject);
                                        if (!(this.queryRunner instanceof MongoQueryRunner_1.MongoQueryRunner)) return [3 /*break*/, 2];
                                        partialEntity = OrmUtils_1.OrmUtils.mergeDeep({}, subject.entity);
                                        if (subject.metadata.objectIdColumn && subject.metadata.objectIdColumn.propertyName) {
                                            delete partialEntity[subject.metadata.objectIdColumn.propertyName];
                                        }
                                        if (subject.metadata.createDateColumn && subject.metadata.createDateColumn.propertyName) {
                                            delete partialEntity[subject.metadata.createDateColumn.propertyName];
                                        }
                                        if (subject.metadata.updateDateColumn && subject.metadata.updateDateColumn.propertyName) {
                                            partialEntity[subject.metadata.updateDateColumn.propertyName] = new Date();
                                        }
                                        manager = this.queryRunner.manager;
                                        return [4 /*yield*/, manager.update(subject.metadata.target, subject.identifier, partialEntity)];
                                    case 1:
                                        _a.sent();
                                        return [3 /*break*/, 4];
                                    case 2:
                                        updateMap = subject.createValueSetAndPopChangeMap();
                                        updateQueryBuilder = this.queryRunner
                                            .manager
                                            .createQueryBuilder()
                                            .update(subject.metadata.target)
                                            .set(updateMap)
                                            .updateEntity(this.options && this.options.reload === false ? false : true)
                                            .callListeners(false);
                                        if (subject.entity) {
                                            updateQueryBuilder.whereEntity(subject.identifier);
                                        }
                                        else { // in this case identifier is just conditions object to update by
                                            updateQueryBuilder.where(subject.identifier);
                                        }
                                        return [4 /*yield*/, updateQueryBuilder.execute()];
                                    case 3:
                                        updateResult = _a.sent();
                                        subject.generatedMap = updateResult.generatedMaps[0];
                                        if (subject.generatedMap) {
                                            subject.metadata.columns.forEach(function (column) {
                                                var value = column.getEntityValue(subject.generatedMap);
                                                if (value !== undefined && value !== null) {
                                                    var preparedValue = _this.queryRunner.connection.driver.prepareHydratedValue(value, column);
                                                    column.setEntityValue(subject.generatedMap, preparedValue);
                                                }
                                            });
                                        }
                                        _a.label = 4;
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); }))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Removes all given subjects from the database.
     *
     * todo: we need to apply topological sort here as well
     */
    SubjectExecutor.prototype.executeRemoveOperations = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, groupedRemoveSubjects, groupedRemoveSubjectKeys;
            var _this = this;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = tslib_1.__read(this.groupBulkSubjects(this.removeSubjects, "delete"), 2), groupedRemoveSubjects = _a[0], groupedRemoveSubjectKeys = _a[1];
                        return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(groupedRemoveSubjectKeys, function (groupName) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                var subjects, deleteMaps, manager;
                                return tslib_1.__generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            subjects = groupedRemoveSubjects[groupName];
                                            deleteMaps = subjects.map(function (subject) {
                                                if (!subject.identifier)
                                                    throw new SubjectWithoutIdentifierError_1.SubjectWithoutIdentifierError(subject);
                                                return subject.identifier;
                                            });
                                            if (!(this.queryRunner instanceof MongoQueryRunner_1.MongoQueryRunner)) return [3 /*break*/, 2];
                                            manager = this.queryRunner.manager;
                                            return [4 /*yield*/, manager.delete(subjects[0].metadata.target, deleteMaps)];
                                        case 1:
                                            _a.sent();
                                            return [3 /*break*/, 4];
                                        case 2: 
                                        // here we execute our deletion query
                                        // we don't need to specify entities and set update entity to true since the only thing query builder
                                        // will do for use is a primary keys deletion which is handled by us later once persistence is finished
                                        // also, we disable listeners because we call them on our own in persistence layer
                                        return [4 /*yield*/, this.queryRunner
                                                .manager
                                                .createQueryBuilder()
                                                .delete()
                                                .from(subjects[0].metadata.target)
                                                .where(deleteMaps)
                                                .callListeners(false)
                                                .execute()];
                                        case 3:
                                            // here we execute our deletion query
                                            // we don't need to specify entities and set update entity to true since the only thing query builder
                                            // will do for use is a primary keys deletion which is handled by us later once persistence is finished
                                            // also, we disable listeners because we call them on our own in persistence layer
                                            _a.sent();
                                            _a.label = 4;
                                        case 4: return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Updates all special columns of the saving entities (create date, update date, version, etc.).
     * Also updates nullable columns and columns with default values.
     */
    SubjectExecutor.prototype.updateSpecialColumnsInPersistedEntities = function () {
        var _this = this;
        // update inserted entity properties
        if (this.insertSubjects.length)
            this.updateSpecialColumnsInInsertedAndUpdatedEntities(this.insertSubjects);
        // update updated entity properties
        if (this.updateSubjects.length)
            this.updateSpecialColumnsInInsertedAndUpdatedEntities(this.updateSubjects);
        // remove ids from the entities that were removed
        if (this.removeSubjects.length) {
            this.removeSubjects.forEach(function (subject) {
                if (!subject.entity)
                    return;
                subject.metadata.primaryColumns.forEach(function (primaryColumn) {
                    primaryColumn.setEntityValue(subject.entity, undefined);
                });
            });
        }
        // other post-persist updations
        this.allSubjects.forEach(function (subject) {
            if (!subject.entity)
                return;
            subject.metadata.relationIds.forEach(function (relationId) {
                relationId.setValue(subject.entity);
            });
            // mongo _id remove
            if (_this.queryRunner instanceof MongoQueryRunner_1.MongoQueryRunner) {
                if (subject.metadata.objectIdColumn
                    && subject.metadata.objectIdColumn.databaseName
                    && subject.metadata.objectIdColumn.databaseName !== subject.metadata.objectIdColumn.propertyName) {
                    delete subject.entity[subject.metadata.objectIdColumn.databaseName];
                }
            }
        });
    };
    /**
     * Updates all special columns of the saving entities (create date, update date, version, etc.).
     * Also updates nullable columns and columns with default values.
     */
    SubjectExecutor.prototype.updateSpecialColumnsInInsertedAndUpdatedEntities = function (subjects) {
        var _this = this;
        subjects.forEach(function (subject) {
            if (!subject.entity)
                return;
            // set values to "null" for nullable columns that did not have values
            subject.metadata.columns.forEach(function (column) {
                // if table inheritance is used make sure this column is not child's column
                if (subject.metadata.childEntityMetadatas.length > 0 && subject.metadata.childEntityMetadatas.map(function (metadata) { return metadata.target; }).indexOf(column.target) !== -1)
                    return;
                // entities does not have virtual columns
                if (column.isVirtual)
                    return;
                // update nullable columns
                if (column.isNullable) {
                    var columnValue = column.getEntityValue(subject.entity);
                    if (columnValue === undefined)
                        column.setEntityValue(subject.entity, null);
                }
                // update relational columns
                if (subject.updatedRelationMaps.length > 0) {
                    subject.updatedRelationMaps.forEach(function (updatedRelationMap) {
                        updatedRelationMap.relation.joinColumns.forEach(function (column) {
                            if (column.isVirtual === true)
                                return;
                            column.setEntityValue(subject.entity, updatedRelationMap.value instanceof Object ? column.referencedColumn.getEntityValue(updatedRelationMap.value) : updatedRelationMap.value);
                        });
                    });
                }
            });
            // merge into entity all generated values returned by a database
            if (subject.generatedMap)
                _this.queryRunner.manager.merge(subject.metadata.target, subject.entity, subject.generatedMap);
        });
    };
    /**
     * Groups subjects by metadata names (by tables) to make bulk insertions and deletions possible.
     * However there are some limitations with bulk insertions of data into tables with generated (increment) columns
     * in some drivers. Some drivers like mysql and sqlite does not support returning multiple generated columns
     * after insertion and can only return a single generated column value, that's why its not possible to do bulk insertion,
     * because it breaks insertion result's generatedMap and leads to problems when this subject is used in other subjects saves.
     * That's why we only support bulking in junction tables for those drivers.
     *
     * Other drivers like postgres and sql server support RETURNING / OUTPUT statement which allows to return generated
     * id for each inserted row, that's why bulk insertion is not limited to junction tables in there.
     */
    SubjectExecutor.prototype.groupBulkSubjects = function (subjects, type) {
        var group = {};
        var keys = [];
        var groupingAllowed = type === "delete" || this.queryRunner.connection.driver.isReturningSqlSupported();
        subjects.forEach(function (subject, index) {
            var key = groupingAllowed || subject.metadata.isJunction ? subject.metadata.name : subject.metadata.name + "_" + index;
            if (!group[key]) {
                group[key] = [subject];
                keys.push(key);
            }
            else {
                group[key].push(subject);
            }
        });
        return [group, keys];
    };
    return SubjectExecutor;
}());
exports.SubjectExecutor = SubjectExecutor;
//# sourceMappingURL=SubjectExecutor.js.map