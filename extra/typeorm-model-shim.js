// this "shim" can be used on the frontend to prevent from errors on undefined
// decorators in the models, when you are sharing same models across backend and frontend.
// to use this shim simply configure your systemjs/webpack configuration to use this file instead of typeorm module.

// for system.js this resolved this way:
// System.config({
//     ...
//     packages: {
//         "typeorm": {
//             main: "typeorm-model-shim.js",
//             defaultExtension: "js"
//         }
//     }
// }

// for webpack this is resolved this way:
// resolve: { // see: https://webpack.js.org/configuration/resolve/
//     alias: {
//         typeorm: path.resolve(__dirname, "../node_modules/typeorm/typeorm-model-shim")
//     }
// }

/* export */ function Column() {
    return function () { };
}
exports.Column = Column;

/* export */ function CreateDateColumn() {
    return function () { };
}
exports.CreateDateColumn = CreateDateColumn;

/* export */ function DeleteDateColumn() {
    return function () { };
}
exports.DeleteDateColumn = DeleteDateColumn;

/* export */ function PrimaryGeneratedColumn() {
    return function () { };
}
exports.PrimaryGeneratedColumn = PrimaryGeneratedColumn;

/* export */ function PrimaryColumn() {
    return function () { };
}
exports.PrimaryColumn = PrimaryColumn;

/* export */ function UpdateDateColumn() {
    return function () { };
}
exports.UpdateDateColumn = UpdateDateColumn;

/* export */ function VersionColumn() {
    return function () { };
}
exports.VersionColumn = VersionColumn;

/* export */ function ViewColumn() {
    return function () { };
}
exports.ViewColumn = ViewColumn;

/* export */ function ObjectIdColumn() {
    return function () { };
}
exports.ObjectIdColumn = ObjectIdColumn;

/* export */ function AfterInsert() {
    return function () { };
}
exports.AfterInsert = AfterInsert;

/* export */ function AfterLoad() {
    return function () { };
}
exports.AfterLoad = AfterLoad;

/* export */ function AfterRemove() {
    return function () { };
}
exports.AfterRemove = AfterRemove;

/* export */ function AfterUpdate() {
    return function () { };
}
exports.AfterUpdate = AfterUpdate;

/* export */ function BeforeInsert() {
    return function () { };
}
exports.BeforeInsert = BeforeInsert;

/* export */ function BeforeRemove() {
    return function () { };
}
exports.BeforeRemove = BeforeRemove;

/* export */ function BeforeUpdate() {
    return function () { };
}
exports.BeforeUpdate = BeforeUpdate;

/* export */ function EventSubscriber() {
    return function () { };
}
exports.EventSubscriber = EventSubscriber;

/* export */ function ColumnOptions() {
    return function () { };
}
exports.ColumnOptions = ColumnOptions;

/* export */ function IndexOptions() {
    return function () { };
}
exports.IndexOptions = IndexOptions;

/* export */ function JoinColumnOptions() {
    return function () { };
}
exports.JoinColumnOptions = JoinColumnOptions;

/* export */ function JoinTableOptions() {
    return function () { };
}
exports.JoinTableOptions = JoinTableOptions;

/* export */ function RelationOptions() {
    return function () { };
}
exports.RelationOptions = RelationOptions;

/* export */ function EntityOptions() {
    return function () { };
}
exports.EntityOptions = EntityOptions;

/* export */ function ValueTransformer() {
    return function () { };
}
exports.ValueTransformer = ValueTransformer;

/* export */ function JoinColumn() {
    return function () { };
}
exports.JoinColumn = JoinColumn;

/* export */ function JoinTable() {
    return function () { };
}
exports.JoinTable = JoinTable;

/* export */ function ManyToMany() {
    return function () { };
}
exports.ManyToMany = ManyToMany;

/* export */ function ManyToOne() {
    return function () { };
}
exports.ManyToOne = ManyToOne;

/* export */ function OneToMany() {
    return function () { };
}
exports.OneToMany = OneToMany;

/* export */ function OneToOne() {
    return function () { };
}
exports.OneToOne = OneToOne;

/* export */ function RelationCount() {
    return function () { };
}
exports.RelationCount = RelationCount;

/* export */ function RelationId() {
    return function () { };
}
exports.RelationId = RelationId;

/* export */ function Entity() {
    return function () { };
}
exports.Entity = Entity;

/* export */ function ChildEntity() {
    return function () { };
}
exports.ChildEntity = ChildEntity;

/* export */ function TableInheritance() {
    return function () { };
}
exports.TableInheritance = TableInheritance;

/* export */ function ViewEntity() {
    return function () { };
}
exports.ViewEntity = ViewEntity;

/* export */ function Transaction() {
    return function () { };
}
exports.Transaction = Transaction;

/* export */ function TransactionManager() {
    return function () { };
}
exports.TransactionManager = TransactionManager;

/* export */ function TransactionRepository() {
    return function () { };
}
exports.TransactionRepository = TransactionRepository;

/* export */ function TreeLevelColumn() {
    return function () { };
}
exports.TreeLevelColumn = TreeLevelColumn;

/* export */ function TreeParent() {
    return function () { };
}
exports.TreeParent = TreeParent;

/* export */ function TreeChildren() {
    return function () { };
}
exports.TreeChildren = TreeChildren;

/* export */ function Tree() {
    return function () { };
}
exports.Tree = Tree;

/* export */ function Index() {
    return function () { };
}
exports.Index = Index;

/* export */ function Unique() {
    return function () { };
}
exports.Unique = Unique;

/* export */ function Check() {
    return function () { };
}
exports.Check = Check;

/* export */ function Exclusion() {
    return function () { };
}
exports.Exclusion = Exclusion;

/* export */ function Generated() {
    return function () { };
}
exports.Generated = Generated;

/* export */ function EntityRepository() {
    return function () { };
}
exports.EntityRepository = EntityRepository;


/* export */ function BaseEntity() { }

BaseEntity.prototype.hasId = function () {
    return false;
};
BaseEntity.prototype.save = function (options) {
    return new Promise((resolve, reject) => { });
};
BaseEntity.prototype.remove = function (options) {
    return new Promise((resolve, reject) => { });
};
BaseEntity.prototype.softRemove = function (options) {
    return new Promise((resolve, reject) => { });
};
BaseEntity.prototype.recover = function (options) {
    return new Promise((resolve, reject) => { });
};
BaseEntity.prototype.reload = function () {
    return new Promise((resolve, reject) => { });
};


BaseEntity.useConnection = function (connection) { };
BaseEntity.getRepository = function (objectType) {
    return function () { };
};
BaseEntity.target = function () { };

BaseEntity.hasId = function (entity) {
    return false;
};
BaseEntity.getId = function (objectType, entity) {
    return undefined;
};
BaseEntity.createQueryBuilder = function (objectType, alias) {
    return function () { };
};
BaseEntity.create = function (objectType, entityLike = null) {
    if (entityLike && Array.isArray(entityLike)) {
        return [new objectType()];
    } else {
        return new objectType();
    }
};
BaseEntity.merge = function (objectType, mergeIntoEntity, ...entityLikes) {
    return mergeIntoEntity;
};
BaseEntity.preload = function (objectType, entityLike) {
    return new Promise((resolve, reject) => { });
};
BaseEntity.save = function (objectType, entities, options) {
    return new Promise((resolve, reject) => { });
};
BaseEntity.save = function (objectType, entity, options) {
    return new Promise((resolve, reject) => { });
};
BaseEntity.remove = function (objectType, entities, options) {
    return new Promise((resolve, reject) => { });
};
BaseEntity.remove = function (objectType, entity, options) {
    return new Promise((resolve, reject) => { });
};
BaseEntity.softRemove = function (objectType, entities, options) {
    return new Promise((resolve, reject) => { });
};
BaseEntity.softRemove = function (objectType, entity, options) {
    return new Promise((resolve, reject) => { });
};
BaseEntity.insert = function (objectType, entity, options) {
    return new Promise((resolve, reject) => { });
};
BaseEntity.update = function (objectType, criteria, partialEntity, options) {
    return new Promise((resolve, reject) => { });
};
BaseEntity.delete = function (objectType, criteria, options) {
    return new Promise((resolve, reject) => { });
};
BaseEntity.count = function (objectType, options) {
    return new Promise((resolve, reject) => { });
};
BaseEntity.count = function (objectType, conditions) {
    return new Promise((resolve, reject) => { });
};
BaseEntity.find = function (objectType, options) {
    return new Promise((resolve, reject) => { });
};
BaseEntity.find = function (objectType, conditions) {
    return new Promise((resolve, reject) => { });
};
BaseEntity.findAndCount = function (objectType, options) {
    return new Promise((resolve, reject) => { });
};
BaseEntity.findAndCount = function (objectType, conditions) {
    return new Promise((resolve, reject) => { });
};
BaseEntity.findByIds = function (objectType, ids, options) {
    return new Promise((resolve, reject) => { });
};
BaseEntity.findByIds = function (objectType, ids, conditions) {
    return new Promise((resolve, reject) => { });
};
BaseEntity.findOne = function (objectType, id, options) {
    return new Promise((resolve, reject) => { });
};
BaseEntity.findOne = function (objectType, options) {
    return new Promise((resolve, reject) => { });
};
BaseEntity.findOne = function (objectType, conditions, options) {
    return new Promise((resolve, reject) => { });
};
BaseEntity.findOneOrFail = function (objectType, id, options) {
    return new Promise((resolve, reject) => { });
};
BaseEntity.findOneOrFail = function (objectType, options) {
    return new Promise((resolve, reject) => { });
};
BaseEntity.findOneOrFail = function (objectType, conditions, options) {
    return new Promise((resolve, reject) => { });
};
BaseEntity.query = function (objectType, query, parameters) {
    return new Promise((resolve, reject) => { });
};
BaseEntity.clear = function (objectType) {
    return new Promise((resolve, reject) => { });
};
exports.BaseEntity = BaseEntity;