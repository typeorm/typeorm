"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var MustBeEntityError_1 = require("../error/MustBeEntityError");
var SubjectExecutor_1 = require("./SubjectExecutor");
var CannotDetermineEntityError_1 = require("../error/CannotDetermineEntityError");
var Subject_1 = require("./Subject");
var OneToManySubjectBuilder_1 = require("./subject-builder/OneToManySubjectBuilder");
var OneToOneInverseSideSubjectBuilder_1 = require("./subject-builder/OneToOneInverseSideSubjectBuilder");
var ManyToManySubjectBuilder_1 = require("./subject-builder/ManyToManySubjectBuilder");
var SubjectDatabaseEntityLoader_1 = require("./SubjectDatabaseEntityLoader");
var CascadesSubjectBuilder_1 = require("./subject-builder/CascadesSubjectBuilder");
var OrmUtils_1 = require("../util/OrmUtils");
var PromiseUtils_1 = require("../util/PromiseUtils");
/**
 * Persists a single entity or multiple entities - saves or removes them.
 */
var EntityPersistExecutor = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function EntityPersistExecutor(connection, queryRunner, mode, target, entity, options) {
        this.connection = connection;
        this.queryRunner = queryRunner;
        this.mode = mode;
        this.target = target;
        this.entity = entity;
        this.options = options;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Executes persistence operation ob given entity or entities.
     */
    EntityPersistExecutor.prototype.execute = function () {
        var _this = this;
        // check if entity we are going to save is valid and is an object
        if (!this.entity || !(this.entity instanceof Object))
            return Promise.reject(new MustBeEntityError_1.MustBeEntityError(this.mode, this.entity));
        // we MUST call "fake" resolve here to make sure all properties of lazily loaded relations are resolved
        return Promise.resolve().then(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var queryRunner, entities, entitiesInChunks, executors, executorsWithExecutableOperations, isTransactionStartedByUs, error_1, rollbackError_1;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryRunner = this.queryRunner || this.connection.createQueryRunner("master");
                        // save data in the query runner - this is useful functionality to share data from outside of the world
                        // with third classes - like subscribers and listener methods
                        if (this.options && this.options.data)
                            queryRunner.data = this.options.data;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, , 15, 18]);
                        entities = this.entity instanceof Array ? this.entity : [this.entity];
                        entitiesInChunks = this.options && this.options.chunk && this.options.chunk > 0 ? OrmUtils_1.OrmUtils.chunk(entities, this.options.chunk) : [entities];
                        return [4 /*yield*/, Promise.all(entitiesInChunks.map(function (entities) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                var subjects, cascadesSubjectBuilder;
                                var _this = this;
                                return tslib_1.__generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            subjects = [];
                                            // create subjects for all entities we received for the persistence
                                            entities.forEach(function (entity) {
                                                var entityTarget = _this.target ? _this.target : entity.constructor;
                                                if (entityTarget === Object)
                                                    throw new CannotDetermineEntityError_1.CannotDetermineEntityError(_this.mode);
                                                subjects.push(new Subject_1.Subject({
                                                    metadata: _this.connection.getMetadata(entityTarget),
                                                    entity: entity,
                                                    canBeInserted: _this.mode === "save",
                                                    canBeUpdated: _this.mode === "save",
                                                    mustBeRemoved: _this.mode === "remove"
                                                }));
                                            });
                                            cascadesSubjectBuilder = new CascadesSubjectBuilder_1.CascadesSubjectBuilder(subjects);
                                            subjects.forEach(function (subject) {
                                                // next step we build list of subjects we will operate with
                                                // these subjects are subjects that we need to insert or update alongside with main persisted entity
                                                cascadesSubjectBuilder.build(subject);
                                            });
                                            // console.timeEnd("building cascades...");
                                            // load database entities for all subjects we have
                                            // next step is to load database entities for all operate subjects
                                            // console.time("loading...");
                                            return [4 /*yield*/, new SubjectDatabaseEntityLoader_1.SubjectDatabaseEntityLoader(queryRunner, subjects).load(this.mode)];
                                        case 1:
                                            // console.timeEnd("building cascades...");
                                            // load database entities for all subjects we have
                                            // next step is to load database entities for all operate subjects
                                            // console.time("loading...");
                                            _a.sent();
                                            // console.timeEnd("loading...");
                                            // console.time("other subjects...");
                                            // build all related subjects and change maps
                                            if (this.mode === "save") {
                                                new OneToManySubjectBuilder_1.OneToManySubjectBuilder(subjects).build();
                                                new OneToOneInverseSideSubjectBuilder_1.OneToOneInverseSideSubjectBuilder(subjects).build();
                                                new ManyToManySubjectBuilder_1.ManyToManySubjectBuilder(subjects).build();
                                            }
                                            else {
                                                subjects.forEach(function (subject) {
                                                    if (subject.mustBeRemoved) {
                                                        new ManyToManySubjectBuilder_1.ManyToManySubjectBuilder(subjects).buildForAllRemoval(subject);
                                                    }
                                                });
                                            }
                                            // console.timeEnd("other subjects...");
                                            // console.timeEnd("building subjects...");
                                            // console.log("subjects", subjects);
                                            // create a subject executor
                                            return [2 /*return*/, new SubjectExecutor_1.SubjectExecutor(queryRunner, subjects, this.options)];
                                    }
                                });
                            }); }))];
                    case 2:
                        executors = _a.sent();
                        executorsWithExecutableOperations = executors.filter(function (executor) { return executor.hasExecutableOperations; });
                        if (executorsWithExecutableOperations.length === 0)
                            return [2 /*return*/];
                        isTransactionStartedByUs = false;
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 9, , 14]);
                        if (!!queryRunner.isTransactionActive) return [3 /*break*/, 5];
                        if (!(!this.options || this.options.transaction !== false)) return [3 /*break*/, 5];
                        isTransactionStartedByUs = true;
                        return [4 /*yield*/, queryRunner.startTransaction()];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: 
                    // execute all persistence operations for all entities we have
                    // console.time("executing subject executors...");
                    return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(executorsWithExecutableOperations, function (executor) { return executor.execute(); })];
                    case 6:
                        // execute all persistence operations for all entities we have
                        // console.time("executing subject executors...");
                        _a.sent();
                        if (!(isTransactionStartedByUs === true)) return [3 /*break*/, 8];
                        return [4 /*yield*/, queryRunner.commitTransaction()];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8: return [3 /*break*/, 14];
                    case 9:
                        error_1 = _a.sent();
                        if (!isTransactionStartedByUs) return [3 /*break*/, 13];
                        _a.label = 10;
                    case 10:
                        _a.trys.push([10, 12, , 13]);
                        return [4 /*yield*/, queryRunner.rollbackTransaction()];
                    case 11:
                        _a.sent();
                        return [3 /*break*/, 13];
                    case 12:
                        rollbackError_1 = _a.sent();
                        return [3 /*break*/, 13];
                    case 13: throw error_1;
                    case 14: return [3 /*break*/, 18];
                    case 15:
                        if (!!this.queryRunner) return [3 /*break*/, 17];
                        return [4 /*yield*/, queryRunner.release()];
                    case 16:
                        _a.sent();
                        _a.label = 17;
                    case 17: return [7 /*endfinally*/];
                    case 18: return [2 /*return*/];
                }
            });
        }); });
    };
    return EntityPersistExecutor;
}());
exports.EntityPersistExecutor = EntityPersistExecutor;
//# sourceMappingURL=EntityPersistExecutor.js.map