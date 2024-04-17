// this "shim" can be used on the frontend to make class-transformer to work with typeorm models automatically
// without having to put @Type decorator on properties that already have type information inside relational decorators.
// if "reflect-metadata" is imported, you can also leave out the @Type decorator for Date or other types.
// using this shim you can share same models across backend and frontend more easily.
// to use this shim simply configure your systemjs/webpack configuration to use this file instead of typeorm module.

// for system.js this resolved this way:
// System.config({
//     ...
//     packages: {
//         "@hckrnews/typeorm": {
//             main: "typeorm-class-transformer-shim.js",
//             defaultExtension: "js"
//         }
//     }
// }

// for webpack this is resolved this way:
// resolve: { // see: http://webpack.github.io/docs/configuration.html#resolve
//     alias: {
//         typeorm: path.resolve(__dirname, "../node_modules/typeorm/typeorm-class-transformer-shim")
//     }
// }

const class_transformer_1 = require("class-transformer"); // import {Type} from "class-transformer";

/**
 * If a metadata designType exists, it returns a function
 * that resolves to the designType
 */
function getDesignTypeFunction(object, propertyName) {
  if (
    typeof Reflect !== "undefined" &&
      typeof Reflect.getMetadata === "function"
  ) {
    const type = Reflect.getMetadata("design:type", object, propertyName);
    if (typeof type === "function") {
      return function() {
        return type;
      };
    }
  }
}

/**
 * Returns a decorator that maps the property type
 * to the `@Type` decorator of class-transformer
 */
function makePropertyDecorator(typeFunction) {
  return function(object, propertyName) {
    if (typeof typeFunction !== "function") {
      typeFunction = getDesignTypeFunction(object, propertyName);
    }
    if (typeFunction) {
      class_transformer_1.Type(typeFunction)(object, propertyName);
    }
  };
}

// columns

/* export */ function Column(typeOrOptions, options) {
  return makePropertyDecorator(typeOrOptions);
}
exports.Column = Column;

/* export */ function ViewColumn(typeOrOptions, options) {
  return makePropertyDecorator(typeOrOptions);
}
exports.ViewColumn = ViewColumn;

/* export */ function DeleteDateColumn(options) {
  return function(object, propertyName) {};
}
exports.DeleteDateColumn = DeleteDateColumn;

/* export */ function CreateDateColumn(options) {
  return function(object, propertyName) {};
}
exports.CreateDateColumn = CreateDateColumn;

/* export */
function ObjectIdColumn(typeOrOptions, options) {
  return makePropertyDecorator(typeOrOptions);
}
exports.ObjectIdColumn = ObjectIdColumn;

/* export */ function PrimaryColumn(typeOrOptions, options) {
  return function(object, propertyName) {};
}
exports.PrimaryColumn = PrimaryColumn;

/* export */ function PrimaryGeneratedColumn(options) {
  return function(object, propertyName) {};
}
exports.PrimaryGeneratedColumn = PrimaryGeneratedColumn;

/* export */ function UpdateDateColumn(options) {
  return function(object, propertyName) {};
}
exports.UpdateDateColumn = UpdateDateColumn;

/* export */ function VersionColumn(options) {
  return function(object, propertyName) {};
}
exports.VersionColumn = VersionColumn;

// listeners

/* export */ function AfterInsert() {
  return function(object, propertyName) {};
}
exports.AfterInsert = AfterInsert;

/* export */ function AfterLoad() {
  return function(object, propertyName) {};
}
exports.AfterLoad = AfterLoad;

/* export */ function AfterRecover() {
  return function(object, propertyName) {};
}
exports.AfterRecover = AfterRecover;

/* export */ function AfterSoftRemove() {
  return function(object, propertyName) {};
}
exports.AfterSoftRemove = AfterSoftRemove;

/* export */ function AfterRemove() {
  return function(object, propertyName) {};
}
exports.AfterRemove = AfterRemove;

/* export */ function AfterUpdate() {
  return function(object, propertyName) {};
}
exports.AfterUpdate = AfterUpdate;

/* export */ function BeforeInsert() {
  return function(object, propertyName) {};
}
exports.BeforeInsert = BeforeInsert;

/* export */ function BeforeRecover() {
  return function(object, propertyName) {};
}
exports.BeforeRecover = BeforeRecover;

/* export */ function BeforeSoftRemove() {
  return function(object, propertyName) {};
}
exports.BeforeSoftRemove = BeforeSoftRemove;

/* export */ function BeforeRemove() {
  return function(object, propertyName) {};
}
exports.BeforeRemove = BeforeRemove;

/* export */ function BeforeUpdate() {
  return function(object, propertyName) {};
}
exports.BeforeUpdate = BeforeUpdate;

/* export */ function EventSubscriber() {
  return function(object, propertyName) {};
}
exports.EventSubscriber = EventSubscriber;

// relations

/* export */ function JoinColumn(options) {
  return function(object, propertyName) {};
}
exports.JoinColumn = JoinColumn;

/* export */ function JoinTable(options) {
  return function(object, propertyName) {};
}
exports.JoinTable = JoinTable;

/* export */ function ManyToMany(typeFunction, inverseSideOrOptions, options) {
  return makePropertyDecorator(typeFunction);
}
exports.ManyToMany = ManyToMany;

/* export */ function ManyToOne(typeFunction, inverseSideOrOptions, options) {
  return makePropertyDecorator(typeFunction);
}
exports.ManyToOne = ManyToOne;

/* export */ function OneToMany(typeFunction, inverseSideOrOptions, options) {
  return makePropertyDecorator(typeFunction);
}
exports.OneToMany = OneToMany;

/* export */ function OneToOne(typeFunction, inverseSideOrOptions, options) {
  return makePropertyDecorator(typeFunction);
}
exports.OneToOne = OneToOne;

/* export */ function RelationCount(relation) {
  return function(object, propertyName) {};
}
exports.RelationCount = RelationCount;

/* export */ function RelationId(relation) {
  return function(object, propertyName) {};
}
exports.RelationId = RelationId;

// entities

/* export */ function ChildEntity(tableName, options) {
  return function(object) {};
}
exports.ChildEntity = ChildEntity;

/* export */ function Entity(name, options) {
  return function(object) {};
}
exports.Entity = Entity;

/* export */ function ViewEntity(options) {
  return function(object) {};
}
exports.ViewEntity = ViewEntity;

/* export */ function TableInheritance(type) {
  return function(object) {};
}
exports.TableInheritance = TableInheritance;

// tree

/* export */ function Tree(name, options) {
  return function(object) {};
}
exports.Tree = Tree;

/* export */ function TreeChildren(options) {
  return makePropertyDecorator();
}
exports.TreeChildren = TreeChildren;

/* export */ function TreeChildrenCount(options) {
  return makePropertyDecorator();
}
exports.TreeChildrenCount = TreeChildrenCount;

/* export */ function TreeLevelColumn() {
  return function(object, propertyName) {};
}
exports.TreeLevelColumn = TreeLevelColumn;

/* export */ function TreeParent(typeFunction) {
  return makePropertyDecorator();
}
exports.TreeParent = TreeParent;

// other

/* export */ function Generated(options) {
  return function(object, propertyName) {};
}
exports.Generated = Generated;

/* export */ function Index() {
  return function(object, propertyName) {};
}
exports.Index = Index;
