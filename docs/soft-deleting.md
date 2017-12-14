# Soft Deleting

* [Decorator](#decorator)
* [Soft delete an entity]()
* [Finding soft deleted entities](finding-soft-deleted-entities)
  * [Via EntityManager](via-entitymanager)
  * [Via Repository](via-repository)
  * [Via SelectQueryBuilder](via-selectquerybuilder)
* [Restore a soft deleted entity](restore-a-soft-deleted-entity)

## Decorator

You can enable soft-deleting on an entity by adding the `@SoftDeleteDateColumn` to a column.
 
Example:

```typescript
import {Entity, PrimaryGeneratedColumn, Column, SoftDeleteDateColumn} from "typeorm";

@Entity()
export class User {
    
    @PrimaryGeneratedColumn()
    id: number;
    
    @SoftDeleteDateColumn()
    deletedDate: Date;
    
    @Column()
    name: string;
}
```

## Soft delete an entity

To soft delete an entity, use the `remove` function in either the `Repository` or `EntityManager`.

```typescript

const manager = getManager();
const user = await manager.findOne(User, 1);
await manager.remove(user);

const repository = getRepository(User);
const user = await manager.findOne(1);
await repository.remove(user);

```

## Finding soft deleted entities

### Via EntityManager

```typescript
const manager = getManager();
const user = await manager.findOne(User, 1, {withDeleted: true});

```

### Via Repository

```typescript
const repository = getRepository(User);
const user = await repository.findOne(1, {withDeleted: true});

```

### Via SelectQueryBuilder

```typescript
const user = await getRepository(User)
    .createQueryBuilder("user")
    .withDeleted()
    .where("id = :id", {id: 1})
    .getOne();
```


## Restore a soft deleted entity

To restore a soft deleted entity, use the `restore` function in either the `Repository` or `EntityManager`.

 ```typescript
 
 const manager = getManager();
 const user = await manager.findOne(User, 1, {withDeleted: true});
 await manager.restore(user);
 
 const repository = getRepository(User);
 const user = await manager.findOne(1, {withDeleted: true});
 await repository.remove(user);
 
 ```

## Permanently delete an entity

To permanently delete an entity, you should use the `delete` functions which bypass the soft delete mechanism.

See the API for `EntityManager` or `Repository`.
