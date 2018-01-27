# Repository API

* [Repository API](#repository-api)
* [TreeRepository API](#treerepository-api)
* [MongoRepository API](#mongorepository-api)

## `Repository` API

* `manager` - The `EntityManager` used by this repository.

```typescript
const manager = repository.manager;
```

* `metadata` - The `EntityMetadata` of the entity managed by this repository.
Learn more about [transactions in Entity Metadata](./entity-metadata.md).

```typescript
const metadata = repository.metadata;
```

* `queryRunner` - The query runner used by `EntityManager`.
Used only in transactional instances of EntityManager.

```typescript
const queryRunner = repository.queryRunner;
```

* `target` - The target entity class managed by this repository.
Used only in transactional instances of EntityManager.

```typescript
const target = repository.target;
```

* `createQueryBuilder` - Creates a query builder use to build SQL queries.
Learn more about [QueryBuilder](select-query-builder.md).

```typescript
const users = await repository
    .createQueryBuilder("user")
    .where("user.name = :name", { name: "John" })
    .getMany();
```

* `hasId` - Checks if the given entity's primary column property is defined.

```typescript
 if (repository.hasId(user)) {
    // ... do something
 }
```

* `getId` - Gets the primary column property values of the given entity. 
If entity has composite primary keys then the returned value will be an object with names and values of primary columns.

```typescript
const userId = repository.getId(user); // userId === 1
```

* `create` - Creates a new instance of `User`. Optionally accepts an object literal with user properties
which will be written into newly created user object

```typescript
const user = repository.create(); // same as const user = new User();
const user = repository.create({
    id: 1,
    firstName: "Timber",
    lastName: "Saw"
}); // same as const user = new User(); user.firstName = "Timber"; user.lastName = "Saw";
```

* `merge` - Merges multiple entities into a single entity

```typescript
const user = new User();
repository.merge(user, { firstName: "Timber" }, { lastName: "Saw" }); // same as user.firstName = "Timber"; user.lastName = "Saw";
```

* `preload` - Creates a new entity from the given plain javascript object. If the entity already exist in the database, then
it loads it (and everything related to it), replaces all values with the new ones from the given object
and returns the new entity. The new entity is actually an entity loaded from the db with all properties
replaced from the new object.

```typescript
const partialUser = {
    id: 1,
    firstName: "Rizzrak",
    profile: {
        id: 1
    }
};
const user = await repository.preload(partialUser);
// user will contain all missing data from partialUser with partialUser property values:
// { id: 1, firstName: "Rizzrak", lastName: "Saw", profile: { id: 1, ... } }
```

* `save` - Saves a given entity or array of entities.
If the entity already exist in the database, it is updated.
If the entity does not exist in the database, it is inserted.
It saves all given entities in a single transaction (in the case of entity manager is not transactional).
Also supports partial updating since all undefined properties are skipped.

```typescript
await repository.save(user);
await repository.save([
    category1,
    category2,
    category3
]);
```

* `update` - Partially updates entity by a given update options.

```typescript
await repository.update({ firstName: "Timber" }, { firstName: "Rizzrak" });
// executes UPDATE user SET firstName = Rizzrak WHERE firstName = Timber
```

* `updateById` - Partially updates entity by a given update options.

```typescript
await repository.updateById(1, { firstName: "Rizzrak" });
// executes UPDATE user SET firstName = Rizzrak WHERE id = 1
```

* `remove` - Removes a given entity or array of entities.
It removes all given entities in a single transaction (in the case of entity manager is not transactional).

```typescript
await repository.remove(user);
await repository.remove([
    category1,
    category2,
    category3
]);
```

* `removeById` - Removes entity by entity id.

```typescript
await repository.removeById(1);
```


* `removeByIds` - Removes entity by entity ids.

```typescript
await repository.removeByIds([1, 2, 3]);
```

* `count` - Counts entities that match given options. Useful for pagination.

```typescript
const count = await repository.count({ firstName: "Timber" });
```

* `find` - Finds entities that match given options.

```typescript
const timbers = await repository.find({ firstName: "Timber" });
```

* `findAndCount` - Finds entities that match given find options.
Also counts all entities that match given conditions,
but ignores pagination settings (`from` and `take` options).

```typescript
const [timbers, timbersCount] = await repository.findAndCount({ firstName: "Timber" });
```

* `findByIds` - Finds entities by given ids.

```typescript
const users = await repository.findByIds([1, 2, 3]);
```

* `findOne` - Finds first entity that matches given find options.

```typescript
const timber = await repository.findOne({ firstName: "Timber" });
```

* `findOneById` - Finds entity with given id.

```typescript
const user = await repository.findOneById(1);
```

* `query` - Executes a raw SQL query.

```typescript
const rawData = await repository.query(`SELECT * FROM USERS`);
```

* `clear` - Clears all the data from the given table (truncates/drops it).

```typescript
await repository.clear();
```

## `TreeRepository` API

* `findTrees` - Gets complete tree for all roots in the table.

```typescript
const treeCategories = await repository.findTrees();
// returns root categories with sub categories inside
```

* `findRoots` - Roots are entities that have no ancestors. Finds them all.
Does not load children leafs.

```typescript
const rootCategories = await repository.findRoots();
// returns root categories without sub categories inside
```

* `findDescendants` - Gets all children (descendants) of the given entity. Returns them all in a flat array.

```typescript
const childrens = await repository.findDescendants(parentCategory);
// returns all direct subcategories (without its nested categories) of a parentCategory
```

* `findDescendantsTree` - Gets all children (descendants) of the given entity. Returns them in a tree - nested into each other.

```typescript
const childrensTree = await repository.findDescendantsTree(parentCategory);
// returns all direct subcategories (with its nested categories) of a parentCategory
```

* `createDescendantsQueryBuilder` - Creates a query builder used to get descendants of the entities in a tree.

```typescript
const childrens = await repository
    .createDescendantsQueryBuilder("category", "categoryClosure", parentCategory)
    .andWhere("category.type = 'secondary'")
    .getMany();
```

* `countDescendants` - Gets number of descendants of the entity.

```typescript
const childrenCount = await repository.countDescendants(parentCategory);
```

* `findAncestors` - Gets all parent (ancestors) of the given entity. Returns them all in a flat array.

```typescript
const parents = await repository.findAncestors(childCategory);
// returns all direct childCategory's parent categories (without "parent of parents")
```

* `findAncestorsTree` - Gets all parent (ancestors) of the given entity. Returns them in a tree - nested into each other.

```typescript
const parentsTree = await repository.findAncestorsTree(childCategory);
// returns all direct childCategory's parent categories (with "parent of parents")
```

* `createAncestorsQueryBuilder` - Creates a query builder used to get ancestors of the entities in a tree.

```typescript
const parents = await repository
    .createAncestorsQueryBuilder("category", "categoryClosure", childCategory)
    .andWhere("category.type = 'secondary'")
    .getMany();
```

* `countAncestors` - Gets the number of ancestors of the entity.

```typescript
const parentsCount = await repository.countAncestors(childCategory);
```

## `MongoRepository` API

For `MongoRepository` API refer to [the MongoDB documentation](./mongodb.md).
