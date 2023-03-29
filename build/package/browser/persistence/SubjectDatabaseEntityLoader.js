import { __awaiter, __generator, __read, __spreadArray, __values } from "tslib";
/**
 * Loads database entities for all operate subjects which do not have database entity set.
 * All entities that we load database entities for are marked as updated or inserted.
 * To understand which of them really needs to be inserted or updated we need to load
 * their original representations from the database.
 */
var SubjectDatabaseEntityLoader = /** @class */ (function () {
    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------
    function SubjectDatabaseEntityLoader(queryRunner, subjects) {
        this.queryRunner = queryRunner;
        this.subjects = subjects;
    }
    // ---------------------------------------------------------------------
    // Public Methods
    // ---------------------------------------------------------------------
    /**
     * Loads database entities for all subjects.
     *
     * loadAllRelations flag is used to load all relation ids of the object, no matter if they present in subject entity or not.
     * This option is used for deletion.
     */
    SubjectDatabaseEntityLoader.prototype.load = function (operationType) {
        return __awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        promises = this.groupByEntityTargets().map(function (subjectGroup) { return __awaiter(_this, void 0, void 0, function () {
                            var allIds, allSubjects, loadRelationPropertyPaths, findOptions, entities, allSubjects_1, allSubjects_1_1, subject;
                            var e_1, _a;
                            var _this = this;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        allIds = [];
                                        allSubjects = [];
                                        subjectGroup.subjects.forEach(function (subject) {
                                            // we don't load if subject already has a database entity loaded
                                            if (subject.databaseEntity || !subject.identifier)
                                                return;
                                            allIds.push(subject.identifier);
                                            allSubjects.push(subject);
                                        });
                                        // if there no ids found (means all entities are new and have generated ids) - then nothing to load there
                                        if (!allIds.length)
                                            return [2 /*return*/];
                                        loadRelationPropertyPaths = [];
                                        // for the save, soft-remove and recover operation
                                        // extract all property paths of the relations we need to load relation ids for
                                        // this is for optimization purpose - this way we don't load relation ids for entities
                                        // whose relations are undefined, and since they are undefined its really pointless to
                                        // load something for them, since undefined properties are skipped by the orm
                                        if (operationType === "save" || operationType === "soft-remove" || operationType === "recover") {
                                            subjectGroup.subjects.forEach(function (subject) {
                                                // gets all relation property paths that exist in the persisted entity.
                                                subject.metadata.relations.forEach(function (relation) {
                                                    var value = relation.getEntityValue(subject.entityWithFulfilledIds);
                                                    if (value === undefined)
                                                        return;
                                                    if (loadRelationPropertyPaths.indexOf(relation.propertyPath) === -1)
                                                        loadRelationPropertyPaths.push(relation.propertyPath);
                                                });
                                            });
                                        }
                                        else { // remove
                                            // for remove operation
                                            // we only need to load junction relation ids since only they are removed by cascades
                                            loadRelationPropertyPaths.push.apply(// remove
                                            loadRelationPropertyPaths, __spreadArray([], __read(subjectGroup.subjects[0].metadata.manyToManyRelations.map(function (relation) { return relation.propertyPath; }))));
                                        }
                                        findOptions = {
                                            loadEagerRelations: false,
                                            loadRelationIds: {
                                                relations: loadRelationPropertyPaths,
                                                disableMixedMap: true
                                            },
                                            // the soft-deleted entities should be included in the loaded entities for recover operation
                                            withDeleted: true
                                        };
                                        return [4 /*yield*/, this.queryRunner.manager
                                                .getRepository(subjectGroup.target)
                                                .findByIds(allIds, findOptions)];
                                    case 1:
                                        entities = _b.sent();
                                        // now when we have entities we need to find subject of each entity
                                        // and insert that entity into database entity of the found subjects
                                        entities.forEach(function (entity) {
                                            var subjects = _this.findByPersistEntityLike(subjectGroup.target, entity);
                                            subjects.forEach(function (subject) {
                                                subject.databaseEntity = entity;
                                                if (!subject.identifier)
                                                    subject.identifier = subject.metadata.hasAllPrimaryKeys(entity) ? subject.metadata.getEntityIdMap(entity) : undefined;
                                            });
                                        });
                                        try {
                                            // this way we tell what subjects we tried to load database entities of
                                            for (allSubjects_1 = __values(allSubjects), allSubjects_1_1 = allSubjects_1.next(); !allSubjects_1_1.done; allSubjects_1_1 = allSubjects_1.next()) {
                                                subject = allSubjects_1_1.value;
                                                subject.databaseEntityLoaded = true;
                                            }
                                        }
                                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                                        finally {
                                            try {
                                                if (allSubjects_1_1 && !allSubjects_1_1.done && (_a = allSubjects_1.return)) _a.call(allSubjects_1);
                                            }
                                            finally { if (e_1) throw e_1.error; }
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // ---------------------------------------------------------------------
    // Protected Methods
    // ---------------------------------------------------------------------
    /**
     * Finds subjects where entity like given subject's entity.
     * Comparision made by entity id.
     * Multiple subjects may be returned if duplicates are present in the subject array.
     * This will likely result in the same row being updated multiple times during a transaction.
     */
    SubjectDatabaseEntityLoader.prototype.findByPersistEntityLike = function (entityTarget, entity) {
        return this.subjects.filter(function (subject) {
            if (!subject.entity)
                return false;
            if (subject.entity === entity)
                return true;
            return subject.metadata.target === entityTarget && subject.metadata.compareEntities(subject.entityWithFulfilledIds, entity);
        });
    };
    /**
     * Groups given Subject objects into groups separated by entity targets.
     */
    SubjectDatabaseEntityLoader.prototype.groupByEntityTargets = function () {
        return this.subjects.reduce(function (groups, operatedEntity) {
            var group = groups.find(function (group) { return group.target === operatedEntity.metadata.target; });
            if (!group) {
                group = { target: operatedEntity.metadata.target, subjects: [] };
                groups.push(group);
            }
            group.subjects.push(operatedEntity);
            return groups;
        }, []);
    };
    return SubjectDatabaseEntityLoader;
}());
export { SubjectDatabaseEntityLoader };

//# sourceMappingURL=SubjectDatabaseEntityLoader.js.map
