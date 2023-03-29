"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityPersistExecutor = void 0;
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
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var queryRunner, entities, entitiesInChunks, executors, executorsWithExecutableOperations, isTransactionStartedByUs, executorsWithExecutableOperations_1, executorsWithExecutableOperations_1_1, executor, e_1_1, error_1, rollbackError_1;
            var e_1, _a;
            var _this = this;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // check if entity we are going to save is valid and is an object
                        if (!this.entity || typeof this.entity !== "object")
                            return [2 /*return*/, Promise.reject(new MustBeEntityError_1.MustBeEntityError(this.mode, this.entity))];
                        // we MUST call "fake" resolve here to make sure all properties of lazily loaded relations are resolved
                        return [4 /*yield*/, Promise.resolve()];
                    case 1:
                        // we MUST call "fake" resolve here to make sure all properties of lazily loaded relations are resolved
                        _b.sent();
                        queryRunner = this.queryRunner || this.connection.createQueryRunner();
                        // save data in the query runner - this is useful functionality to share data from outside of the world
                        // with third classes - like subscribers and listener methods
                        if (this.options && this.options.data)
                            queryRunner.data = this.options.data;
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, , 22, 25]);
                        entities = Array.isArray(this.entity) ? this.entity : [this.entity];
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
                                                    mustBeRemoved: _this.mode === "remove",
                                                    canBeSoftRemoved: _this.mode === "soft-remove",
                                                    canBeRecovered: _this.mode === "recover"
                                                }));
                                            });
                                            cascadesSubjectBuilder = new CascadesSubjectBuilder_1.CascadesSubjectBuilder(subjects);
                                            subjects.forEach(function (subject) {
                                                // next step we build list of subjects we will operate with
                                                // these subjects are subjects that we need to insert or update alongside with main persisted entity
                                                cascadesSubjectBuilder.build(subject, _this.mode);
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
                                            if (this.mode === "save" || this.mode === "soft-remove" || this.mode === "recover") {
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
                    case 3:
                        executors = _b.sent();
                        executorsWithExecutableOperations = executors.filter(function (executor) { return executor.hasExecutableOperations; });
                        if (executorsWithExecutableOperations.length === 0)
                            return [2 /*return*/];
                        isTransactionStartedByUs = false;
                        _b.label = 4;
                    case 4:
                        _b.trys.push([4, 16, , 21]);
                        if (!!queryRunner.isTransactionActive) return [3 /*break*/, 6];
                        if (!(!this.options || this.options.transaction !== false)) return [3 /*break*/, 6];
                        isTransactionStartedByUs = true;
                        return [4 /*yield*/, queryRunner.startTransaction()];
                    case 5:
                        _b.sent();
                        _b.label = 6;
                    case 6:
                        _b.trys.push([6, 11, 12, 13]);
                        executorsWithExecutableOperations_1 = tslib_1.__values(executorsWithExecutableOperations), executorsWithExecutableOperations_1_1 = executorsWithExecutableOperations_1.next();
                        _b.label = 7;
                    case 7:
                        if (!!executorsWithExecutableOperations_1_1.done) return [3 /*break*/, 10];
                        executor = executorsWithExecutableOperations_1_1.value;
                        return [4 /*yield*/, executor.execute()];
                    case 8:
                        _b.sent();
                        _b.label = 9;
                    case 9:
                        executorsWithExecutableOperations_1_1 = executorsWithExecutableOperations_1.next();
                        return [3 /*break*/, 7];
                    case 10: return [3 /*break*/, 13];
                    case 11:
                        e_1_1 = _b.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 13];
                    case 12:
                        try {
                            if (executorsWithExecutableOperations_1_1 && !executorsWithExecutableOperations_1_1.done && (_a = executorsWithExecutableOperations_1.return)) _a.call(executorsWithExecutableOperations_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 13:
                        if (!(isTransactionStartedByUs === true)) return [3 /*break*/, 15];
                        return [4 /*yield*/, queryRunner.commitTransaction()];
                    case 14:
                        _b.sent();
                        _b.label = 15;
                    case 15: return [3 /*break*/, 21];
                    case 16:
                        error_1 = _b.sent();
                        if (!isTransactionStartedByUs) return [3 /*break*/, 20];
                        _b.label = 17;
                    case 17:
                        _b.trys.push([17, 19, , 20]);
                        return [4 /*yield*/, queryRunner.rollbackTransaction()];
                    case 18:
                        _b.sent();
                        return [3 /*break*/, 20];
                    case 19:
                        rollbackError_1 = _b.sent();
                        return [3 /*break*/, 20];
                    case 20: throw error_1;
                    case 21: return [3 /*break*/, 25];
                    case 22:
                        if (!!this.queryRunner) return [3 /*break*/, 24];
                        return [4 /*yield*/, queryRunner.release()];
                    case 23:
                        _b.sent();
                        _b.label = 24;
                    case 24: return [7 /*endfinally*/];
                    case 25: return [2 /*return*/];
                }
            });
        });
    };
    return EntityPersistExecutor;
}());
exports.EntityPersistExecutor = EntityPersistExecutor;

//# sourceMappingURL=EntityPersistExecutor.js.map
