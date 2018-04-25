# Decorators reference

* [Entity decorators](#entity-decorators)
    * [`@Entity`](#entity)
* [Column decorators](#column-decorators)
    * [`@Column`](#column)
    * [`@PrimaryColumn`](#primarycolumn)
    * [`@PrimaryGeneratedColumn`](#primarygeneratedcolumn)
    * [`@ObjectIdColumn`](#objectidcolumn)
    * [`@CreateDateColumn`](#createdatecolumn)
    * [`@UpdateDateColumn`](#updatedatecolumn)
    * [`@VersionColumn`](#versioncolumn)
    * [`@Generated`](#generated)
* [Relation decorators](#relation-decorators)
    * [`@OneToOne`](#onetoone)
    * [`@ManyToOne`](#manytoone)
    * [`@OneToMany`](#onetomany)
    * [`@ManyToMany`](#manytomany)
    * [`@JoinColumn`](#joincolumn)
    * [`@JoinTable`](#jointable)
    * [`@RelationId`](#relationid)
* [Subscriber and listener decorators](#subscriber-and-listener-decorators)
    * [`@AfterLoad`](#afterload)
    * [`@BeforeInsert`](#beforeinsert)
    * [`@AfterInsert`](#afterinsert)
    * [`@BeforeUpdate`](#beforeupdate)
    * [`@AfterUpdate`](#afterupdate)
    * [`@BeforeRemove`](#beforeremove)
    * [`@AfterRemove`](#afterremove)
    * [`@EventSubscriber`](#eventsubscriber)
* [Other decorators](#other-decorators)
    * [`@Index`](#index)
    * [`@Unique`](#unique)
    * [`@Check`](#check)
    * [`@Transaction`, `@TransactionManager` and `@TransactionRepository`](#transaction-transactionmanager-and-transactionrepository)
    * [`@EntityRepository`](#entityrepository)

## Entity decorators

#### `@Entity`

Marks your model as an entity. Entity is a class which is transformed into a database table.
You can specify the table name in the entity:

```typescript
@Entity("users")
export class User {
```

This code will create a database table named "users".

You can also specify some additional entity options:

* `name` - table name. If not specified, then table name is generated from entity class name.
* `database` - database name in selected DB server.
* `schema` - schema name.
* `engine` - database engine to be set during table creation (works only in some databases).
* `skipSync` - entities marked with this decorator are skipped from schema updates.
* `orderBy` - specifies default ordering for entities when using `find` operations and `QueryBuilder`.

Example:

```typescript
@Entity({
    name: "users",
    engine: "MyISAM",
    database: 'example_dev',
    schema: 'schema_with_best_tables',
    skipSync: true,
    orderBy: {
        name: "ASC",
        id: "DESC"
    }
})
export class User {
```

Learn more about [Entities](entities.md).

## Column decorators

#### `@Column`

Marks a property in your entity as a table column.
Example:

```typescript
@Entity("users")
export class User {
    
    @Column({ primary: true })
    id: number;
    
    @Column({ type: "varchar", length: 200, unique: true })
    firstName: string;
    
    @Column({ nullable: true })
    lastName: string;
    
    @Column({ default: false })
    isActive: string;
    
}
```

`@Column` accept several options you can use:

* `type: ColumnType` - Column type. One of the [supported column types](entities.md#column-types).
* `name: string` - Column name in the database table. 
By default the column name is generated from the name of the property.
You can change it by specifying your own name.
* `length: string|number` - Column type's length. For example, if you want to create `varchar(150)` type 
you specify column type and length options.
* `width: number` - column type's display width. Used only for [MySQL integer types](https://dev.mysql.com/doc/refman/5.7/en/integer-types.html)
* `onUpdate: string` - `ON UPDATE` trigger. Used only in [MySQL](https://dev.mysql.com/doc/refman/5.7/en/timestamp-initialization.html).
* `nullable: boolean` - Makes column `NULL` or `NOT NULL` in the database. 
By default column is `nullable: false`.
* `readonly: boolean` - Indicates if column value is not updated by "save" operation. It means you'll be able to write this value only when you first time insert the object.
Default value is `false`.
* `select: boolean` - Defines whether or not to hide this column by default when making queries. When set to `false`, the column data will not show with a standard query. By default column is `select: true`
* `default: string` - Adds database-level column's `DEFAULT` value. 
* `primary: boolean` - Marks column as primary. Same as using  `@PrimaryColumn`.
* `unique: boolean` - Marks column as unique column (creates unique constraint).
* `comment: string` - Database's column comment. Not supported by all database types.
* `precision: number` - The precision for a decimal (exact numeric) column (applies only for decimal column), which is the maximum
 number of digits that are stored for the values. Used in some column types.
* `scale: number` - The scale for a decimal (exact numeric) column (applies only for decimal column), 
which represents the number of digits to the right of the decimal point and must not be greater than precision. 
Used in some column types.
* `zerofill: boolean` - Puts `ZEROFILL` attribute on to a numeric column. Used only in MySQL. 
If `true`, MySQL automatically adds the `UNSIGNED` attribute to this column.
* `unsigned: boolean` - Puts `UNSIGNED` attribute on to a numeric column. Used only in MySQL.
* `charset: string` - Defines a column character set. Not supported by all database types.
* `collation: string` - Defines a column collation.
* `enum: string[]|AnyEnum` - Used in `enum` column type to specify list of allowed enum values.
You can specify array of values or specify a enum class.
* `asExpression: string` - Generated column expression. Used only in [MySQL](https://dev.mysql.com/doc/refman/5.7/en/create-table-generated-columns.html).
* `generatedType: "VIRTUAL"|"STORED"` - Generated column type. Used only in [MySQL](https://dev.mysql.com/doc/refman/5.7/en/create-table-generated-columns.html).
* `hstoreType: "object"|"string"` - Return type of `HSTORE` column. Returns value as string or as object. Used only in [Postgres](https://www.postgresql.org/docs/9.6/static/hstore.html).
* `array: boolean` - Used for postgres column types which can be array (for example int[]).
* `transformer: ValueTransformer` - Specifies a value transformer that is to be used to (un)marshal this column when reading or writing to the database.

Learn more about [entity columns](entities.md#entity-columns).

#### `@PrimaryColumn`

Marks a property in your entity as a table primary column.
Same as `@Column` decorator but sets its `primary` option to true.
Example:

```typescript
@Entity()
export class User {
    
    @PrimaryColumn()
    id: number;
    
}
```

Learn more about [entity columns](entities.md#entity-columns).

#### `@PrimaryGeneratedColumn`

Marks a property in your entity as a table-generated primary column.
Column it creates is primary and its value is auto-generated.
Example:

```typescript
@Entity()
export class User {
    
    @PrimaryGeneratedColumn()
    id: number;
    
}
```

There are two generation strategies:

* `increment` - uses AUTO_INCREMENT / SERIAL / SEQUENCE (depend on database type) to generate incremental number.
* `uuid` - generates unique `uuid` string.

Default generation strategy is `increment`, to change it to `uuid`, simply pass it as the first argument to decorator:

```typescript
@Entity()
export class User {
    
    @PrimaryGeneratedColumn("uuid")
    id: number;
    
}
```

Learn more about [entity columns](entities.md#entity-columns).

#### `@ObjectIdColumn`

Marks a property in your entity as ObjectID.
This decorator is only used in MongoDB.
Every entity in MongoDB must have a ObjectID column.
Example:

```typescript
@Entity()
export class User {
    
    @ObjectIdColumn()
    id: ObjectID;
    
}
```

Learn more about [MongoDB](mongodb.md).

#### `@CreateDateColumn`

Special column that is automatically set to the entity's insertion time.
You don't need to write a value into this column - it will be automatically set.
Example:

```typescript
@Entity()
export class User {
    
    @CreateDateColumn()
    createdDate: Date;
    
}
```

#### `@UpdateDateColumn`

Special column that is automatically set to the entity's update time 
each time you call `save` from entity manager or repository.
You don't need to write a value into this column - it will be automatically set.

```typescript
@Entity()
export class User {
    
    @UpdateDateColumn()
    updatedDate: Date;
    
}
```

#### `@VersionColumn`

Special column that is automatically set to the entity's version (incremental number)  
each time you call `save` from entity manager or repository.
You don't need to write a value into this column - it will be automatically set.

```typescript
@Entity()
export class User {
    
    @VersionColumn()
    version: number;
    
}
```

#### `@Generated`

Marks column to be a generated value. For example:

```typescript
@Entity()
export class User {
    
    @Column()
    @Generated("uuid")
    uuid: string;
    
}
```

Value will be generated only once, before inserting the entity into the database.

## Relation decorators

#### `@OneToOne`

One-to-one is a relation where A contains only once instance of B, and B contains only one instance of A.
Let's take for example `User` and `Profile` entities.
User can have only a single profile, and a single profile is owned by only a single user.
Example:

```typescript
import {Entity, OneToOne, JoinColumn} from "typeorm";
import {Profile} from "./Profile";

@Entity()
export class User {
    
    @OneToOne(type => Profile, profile => profile.user)
    @JoinColumn()
    profile: Profile;
    
}
```

Learn more about [one-to-one relations](one-to-one-relations.md).

#### `@ManyToOne`

Many-to-one / one-to-many is a relation where A contains multiple instances of B, but B contains only one instance of A.
Let's take for example `User` and `Photo` entities.
User can have multiple photos, but each photo is owned by only one single user.
Example:

```typescript
import {Entity, PrimaryGeneratedColumn, Column, ManyToOne} from "typeorm";
import {User} from "./User";

@Entity()
export class Photo {
    
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    url: string;
    
    @ManyToOne(type => User, user => user.photos)
    user: User;
    
}
```

Learn more about [many-to-one / one-to-many relations](many-to-one-one-to-many-relations.md).

#### `@OneToMany`

Many-to-one / one-to-many is a relation where A contains multiple instances of B, but B contains only one instance of A.
Let's take for example `User` and `Photo` entities.
User can have multiple photos, but each photo is owned by only a single user.
Example:

```typescript
import {Entity, PrimaryGeneratedColumn, Column, OneToMany} from "typeorm";
import {Photo} from "./Photo";

@Entity()
export class User {
    
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    name: string;
    
    @OneToMany(type => Photo, photo => photo.user)
    photos: Photo[];
    
}
```

Learn more about [many-to-one / one-to-many relations](many-to-one-one-to-many-relations.md).

#### `@ManyToMany`

Many-to-many is a relation where A contains multiple instances of B, and B contain multiple instances of A.
Let's take for example `Question` and `Category` entities.
Question can have multiple categories, and each category can have multiple questions.
Example:

```typescript
import {Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable} from "typeorm";
import {Category} from "./Category";

@Entity()
export class Question {
    
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    title: string;
    
    @Column()
    text: string;
    
    @ManyToMany(type => Category)
    @JoinTable()
    categories: Category[];
    
}
```

Learn more about [many-to-many relations](many-to-many-relations.md).

#### `@JoinColumn`

Defines which side of the relation contains the join column with a foreign key and 
allows you to customize the join column name and referenced column name. 
Example:

```typescript
@Entity()
export class Post {
    
    @ManyToOne(type => Category)
    @JoinColumn({ 
        name: "cat_id",
        referencedColumnName: "name"
    })
    category: Category;
    
}
```

#### `@JoinTable`

Used for `many-to-many` relations and describes join columns of the "junction" table.
Junction table is a special, separate table created automatically by TypeORM with columns referenced to the related entities.
You can change the column names inside the junction table and their referenced columns with the `@JoinColumn` decorator. You can also change the name of the generated "junction" table.
Example:

```typescript
@Entity()
export class Post {
    
    @ManyToMany(type => Category)
    @JoinTable({
        name: "question_categories",
        joinColumn: {
            name: "question",
            referencedColumnName: "id"
        },
        inverseJoinColumn: {
            name: "category",
            referencedColumnName: "id"
        }
    })
    categories: Category[];
    
}
```

If the destination table has composite primary keys, 
then an array of properties must be sent to the `@JoinTable` decorator.

#### `@RelationId`

Loads id (or ids) of specific relations into properties.
For example, if you have a many-to-one `category` in your `Post` entity,
you can have a new category id by marking a new property with `@RelationId`.
Example:

```typescript
@Entity()
export class Post {
    
    @ManyToOne(type => Category)
    category: Category;
    
    @RelationId((post: Post) => post.category) // you need to specify target relation
    categoryId: number;
    
}
```

This functionality works for all kind of relations, including `many-to-many`:

```typescript
@Entity()
export class Post {
        
    @ManyToMany(type => Category)
    categories: Category[];
    
    @RelationId((post: Post) => post.categories)
    categoryIds: number[];
    
}
```

Relation id is used only for representation.
The underlying relation is not added/removed/changed when chaining the value.

## Subscriber and listener decorators

#### `@AfterLoad`

You can define a method with any name in entity and mark it with `@AfterLoad`
and TypeORM will call it each time the entity 
is loaded using `QueryBuilder` or repository/manager find methods.
Example:

```typescript
@Entity()
export class Post {
    
    @AfterLoad()
    updateCounters() {
        if (this.likesCount === undefined)
            this.likesCount = 0;
    }
}
```

Learn more about [listeners](listeners-and-subscribers.md).

#### `@BeforeInsert`

You can define a method with any name in entity and mark it with `@BeforeInsert`
and TypeORM will call it before the entity is inserted using repository/manager `save`.
Example:

```typescript
@Entity()
export class Post {
    
    @BeforeInsert()
    updateDates() {
        this.createdDate = new Date();
    }
}
```
Learn more about [listeners](listeners-and-subscribers.md).

#### `@AfterInsert`

You can define a method with any name in entity and mark it with `@AfterInsert`
and TypeORM will call it after the entity is inserted using repository/manager `save`.
Example:

```typescript
@Entity()
export class Post {
    
    @AfterInsert()
    resetCounters() {
        this.counters = 0;
    }
}
```

Learn more about [listeners](listeners-and-subscribers.md).

#### `@BeforeUpdate`

You can define a method with any name in the entity and mark it with `@BeforeUpdate`
and TypeORM will call it before an existing entity is updated using repository/manager `save`.
Example:

```typescript
@Entity()
export class Post {
    
    @BeforeUpdate()
    updateDates() {
        this.updatedDate = new Date();
    }
}
```

Learn more about [listeners](listeners-and-subscribers.md).

#### `@AfterUpdate`

You can define a method with any name in the entity and mark it with `@AfterUpdate`
and TypeORM will call it after an existing entity is updated using repository/manager `save`.
Example:

```typescript
@Entity()
export class Post {
    
    @AfterUpdate()
    updateCounters() {
        this.counter = 0;
    }
}
```

Learn more about [listeners](listeners-and-subscribers.md).

#### `@BeforeRemove`

You can define a method with any name in the entity and mark it with `@BeforeRemove`
and TypeORM will call it before a entity is removed using repository/manager `remove`.
Example:

```typescript
@Entity()
export class Post {
    
    @BeforeRemove()
    updateStatus() {
        this.status = "removed";
    }
}
```

Learn more about [listeners](listeners-and-subscribers.md).

#### `@AfterRemove`

You can define a method with any name in the entity and mark it with `@AfterRemove`
and TypeORM will call it after the entity is removed using repository/manager `remove`.
Example:

```typescript
@Entity()
export class Post {
    
    @AfterRemove()
    updateStatus() {
        this.status = "removed";
    }
}
```

Learn more about [listeners](listeners-and-subscribers.md).

#### `@EventSubscriber`

Marks a class as an event subscriber which can listen to specific entity events or any entity's events.
Events are fired using `QueryBuilder` and repository/manager methods.
Example:

```typescript
@EventSubscriber()
export class PostSubscriber implements EntitySubscriberInterface<Post> {

    
    /**
     * Indicates that this subscriber only listen to Post events.
     */
    listenTo() {
        return Post;
    }
    
    /**
     * Called before post insertion.
     */
    beforeInsert(event: InsertEvent<Post>) {
        console.log(`BEFORE POST INSERTED: `, event.entity);
    }

}
```

You can implement any method from `EntitySubscriberInterface`.
To listen to any entity, you just omit the `listenTo` method and use `any`:

```typescript
@EventSubscriber()
export class PostSubscriber implements EntitySubscriberInterface {
    
    /**
     * Called before entity insertion.
     */
    beforeInsert(event: InsertEvent<any>) {
        console.log(`BEFORE ENTITY INSERTED: `, event.entity);
    }

}
```

Learn more about [subscribers](listeners-and-subscribers.md).

## Other decorators

#### `@Index`

This decorator allows you to create a database index for a specific column or columns.
It also allows you to mark column or columns to be unique.
This decorator can be applied to columns or an entity itself.
Use it on a column when an index on a single column is needed
and use it on the entity when a single index on multiple columns is required.
Examples:

```typescript
@Entity()
export class User {
    
    @Index()
    @Column()
    firstName: string;
    
    @Index({ unique: true })
    @Column()
    lastName: string;
}
```
```typescript
@Entity()
@Index(["firstName", "lastName"])
@Index(["lastName", "middleName"])
@Index(["firstName", "lastName", "middleName"], { unique: true })
export class User {
    
    @Column()
    firstName: string;
    
    @Column()
    lastName: string;
    
    @Column()
    middleName: string;
}
```

Learn more about [indices](indices.md).

#### `@Unique`

This decorator allows you to create a database unique constraint for a specific column or columns.
This decorator can be applied only to an entity itself.

Examples:

```typescript
@Entity()
@Unique(["firstName"])
@Unique(["lastName", "middleName"])
@Unique("UQ_NAMES", ["firstName", "lastName", "middleName"])
export class User {
    
    @Column()
    firstName: string;
    
    @Column()
    lastName: string;
    
    @Column()
    middleName: string;
}
```

> Note: MySQL stores unique constraints as unique indices

#### `@Check`

This decorator allows you to create a database check constraint for a specific column or columns.
This decorator can be applied only to an entity itself. 

Examples:

```typescript
@Entity()
@Check(`"firstName" <> 'John' AND "lastName" <> 'Doe'`)
@Check(`"age" > 18`)
export class User {
    
    @Column()
    firstName: string;
    
    @Column()
    lastName: string;
    
    @Column()
    age: number;
}
```

> Note: MySQL does not support check constraints.

#### `@Transaction`, `@TransactionManager` and `@TransactionRepository`

`@Transaction` is used on a method and wraps all its execution into a single database transaction.
All database queries must be performed using the `@TransactionManager` provided manager 
or with the transaction repositories injected with `@TransactionRepository`.
Examples:

```typescript

@Transaction()
save(@TransactionManager() manager: EntityManager, user: User) {
    return manager.save(user);
}
```

```typescript
@Transaction()
save(user: User, @TransactionRepository(User) userRepository: Repository<User>) {
    return userRepository.save(user);
}
```

```typescript
@Transaction()
save(@QueryParam("name") name: string, @TransactionRepository() userRepository: UserRepository) {
    return userRepository.findByName(name);
}
``` 

> Note: all operations inside a transaction MUST ONLY use the provided instance of `EntityManager` or injected repositories.
Using any other source of queries (global manager, global repositories, etc.) will lead to bugs and errors.

Learn more about [transactions](transactions.md).

#### `@EntityRepository`

Marks a custom class as an entity repository.
Example:

```typescript
@EntityRepository()
export class UserRepository {
    
    /// ... custom repository methods ...
    
}
```

You can obtain any custom created repository using `connection.getCustomRepository`
or `entityManager.getCustomRepository` methods.

Learn more about [custom entity repositories](working-with-entity-manager.md).

----

> Note: some decorators (like `@Tree`, `@ChildEntity`, etc.) aren't 
documented in this reference because they are treated as experimental at the moment. 
Expect to see their documentation in the future.
