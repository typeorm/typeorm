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

function noop() {}

/* export */
class BaseEntity {}

exports.BaseEntity = BaseEntity

/* export */ function Column() {
    return noop
}
exports.Column = Column;

/* export */ function CreateDateColumn() {
    return noop
}
exports.CreateDateColumn = CreateDateColumn;

/* export */ function DeleteDateColumn() {
    return noop
}
exports.DeleteDateColumn = DeleteDateColumn;

/* export */ function PrimaryGeneratedColumn() {
    return noop
}
exports.PrimaryGeneratedColumn = PrimaryGeneratedColumn;

/* export */ function PrimaryColumn() {
    return noop
}
exports.PrimaryColumn = PrimaryColumn;

/* export */ function UpdateDateColumn() {
    return noop
}
exports.UpdateDateColumn = UpdateDateColumn;

/* export */ function VersionColumn() {
    return noop
}
exports.VersionColumn = VersionColumn;

/* export */ function ViewColumn() {
    return noop
}
exports.ViewColumn = ViewColumn;

/* export */ function ObjectIdColumn() {
    return noop
}
exports.ObjectIdColumn = ObjectIdColumn;

/* export */ function AfterInsert() {
    return noop
}
exports.AfterInsert = AfterInsert;

/* export */ function AfterLoad() {
    return noop
}
exports.AfterLoad = AfterLoad;

/* export */ function AfterSoftRemove() {
    return noop
}
exports.AfterSoftRemove = AfterSoftRemove;

/* export */ function AfterRecover() {
    return noop
}
exports.AfterRecover = AfterRecover;

/* export */ function AfterRemove() {
    return noop
}
exports.AfterRemove = AfterRemove;

/* export */ function AfterUpdate() {
    return noop
}
exports.AfterUpdate = AfterUpdate;

/* export */ function BeforeInsert() {
    return noop
}
exports.BeforeInsert = BeforeInsert;

/* export */ function BeforeSoftRemove() {
    return noop
}
exports.BeforeSoftRemove = BeforeSoftRemove;

/* export */ function BeforeRecover() {
    return noop
}
exports.BeforeRecover = BeforeRecover;

/* export */ function BeforeRemove() {
    return noop
}
exports.BeforeRemove = BeforeRemove;

/* export */ function BeforeUpdate() {
    return noop
}
exports.BeforeUpdate = BeforeUpdate;

/* export */ function EventSubscriber() {
    return noop
}
exports.EventSubscriber = EventSubscriber;

/* export */ function ColumnOptions() {
    return noop
}
exports.ColumnOptions = ColumnOptions;

/* export */ function IndexOptions() {
    return noop
}
exports.IndexOptions = IndexOptions;

/* export */ function JoinColumnOptions() {
    return noop
}
exports.JoinColumnOptions = JoinColumnOptions;

/* export */ function JoinTableOptions() {
    return noop
}
exports.JoinTableOptions = JoinTableOptions;

/* export */ function RelationOptions() {
    return noop
}
exports.RelationOptions = RelationOptions;

/* export */ function EntityOptions() {
    return noop
}
exports.EntityOptions = EntityOptions;

/* export */ function ValueTransformer() {
    return noop
}
exports.ValueTransformer = ValueTransformer;

/* export */ function JoinColumn() {
    return noop
}
exports.JoinColumn = JoinColumn;

/* export */ function JoinTable() {
    return noop
}
exports.JoinTable = JoinTable;

/* export */ function ManyToMany() {
    return noop
}
exports.ManyToMany = ManyToMany;

/* export */ function ManyToOne() {
    return noop
}
exports.ManyToOne = ManyToOne;

/* export */ function OneToMany() {
    return noop
}
exports.OneToMany = OneToMany;

/* export */ function OneToOne() {
    return noop
}
exports.OneToOne = OneToOne;

/* export */ function RelationCount() {
    return noop
}
exports.RelationCount = RelationCount;

/* export */ function RelationId() {
    return noop
}
exports.RelationId = RelationId;

/* export */ function Entity() {
    return noop
}
exports.Entity = Entity;

/* export */ function ChildEntity() {
    return noop
}
exports.ChildEntity = ChildEntity;

/* export */ function TableInheritance() {
    return noop
}
exports.TableInheritance = TableInheritance;

/* export */ function ViewEntity() {
    return noop
}
exports.ViewEntity = ViewEntity;

/* export */ function Transaction() {
    return noop
}
exports.Transaction = Transaction;

/* export */ function TransactionManager() {
    return noop
}
exports.TransactionManager = TransactionManager;

/* export */ function TransactionRepository() {
    return noop
}
exports.TransactionRepository = TransactionRepository;

/* export */ function TreeLevelColumn() {
    return noop
}
exports.TreeLevelColumn = TreeLevelColumn;

/* export */ function TreeParent() {
    return noop
}
exports.TreeParent = TreeParent;

/* export */ function TreeChildren() {
    return noop
}
exports.TreeChildren = TreeChildren;

/* export */ function Tree() {
    return noop
}
exports.Tree = Tree;

/* export */ function Index() {
    return noop
}
exports.Index = Index;

/* export */ function ForeignKey() {
    return noop
}
exports.ForeignKey = ForeignKey;

/* export */ function Unique() {
    return noop
}
exports.Unique = Unique;

/* export */ function Check() {
    return noop
}
exports.Check = Check;

/* export */ function Exclusion() {
    return noop
}
exports.Exclusion = Exclusion;

/* export */ function Generated() {
    return noop
}
exports.Generated = Generated;

/* export */ function EntityRepository() {
    return noop
}
exports.EntityRepository = EntityRepository;

/* export */ function VirtualColumn() {
    return noop
}
exports.VirtualColumn = VirtualColumn;
