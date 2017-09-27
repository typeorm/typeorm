# Query Builder

* [What is `QueryBuilder`](#what-is-querybuilder)
* [How to create and use a `QueryBuilder`](#how-to-create-and-use-a-querybuilder)
* [Building `SELECT` queries](#building-select-queries)
    * [Getting values using `QueryBuilder`](#getting-values-using-querybuilder)
    * [What are aliases stand for?](#what-are-aliases-stand-for?)
    * [Using parameters to escape data](#using-parameters-to-escape-data)
    * [Adding `WHERE` expression](#adding-where-expression)
    * [Adding `HAVING` expression](#adding-having-expression)
    * [Adding `ORDER BY` expression](#adding-order-by-expression)
    * [Adding `GROUP BY` expression](#adding-group-by-expression)
    * [Adding `LIMIT` expression](#adding-limit-expression)
    * [Adding `OFFSET` expression](#adding-offset-expression)
    * [Joining relations](#joining-relations)
    * [Inner and left joins](#inner-and-left-joins)
    * [Join without selection](#join-without-selection)
    * [Joining any entity or table](#joining-any-entity-or-table)
    * [Joining and mapping functionality](#joining-and-mapping-functionality)
    * [Getting result query](#getting-result-query)
    * [Getting raw results](#getting-raw-results)
    * [Streaming result data](#streaming-result-data)
    * [Using pagination](#using-pagination)
    * [Set locking](#set-locking)
    * [Partial selection](#partial-selection)
    * [Using subqueries](#using-subqueries)
    * [Caching queries](#caching-queries)
* [Building `INSERT` query](#building-insert-query)
* [Building `UPDATE` query](#building-update-query)
* [Building `DELETE` query](#building-delete-query)
* [Using `RelationQueryBuilder`](#using-relationquerybuilder)

## What is `QueryBuilder`

`QueryBuilder` one of the most power TypeORM feature - 
it allows you to build SQL query using elegant and convenient syntax,
execute it and get automatically transformed entities.

Simple example of `QueryBuilder`:

```typescript
const firstUser = await connection
    .getRepository(User)
    .createQueryBuilder("user")
    .where("user.id = :id", { id: 1 })
    .getOne();
```

It builds following SQL query:

```sql
SELECT 
    user.id as userId, 
    user.firstName as userFirstName, 
    user.lastName as userLastName
FROM users user
WHERE user.id = 1
```

and returns you an instance of `User`:

```
User {
    id: 1,
    firstName: "Timber",
    lastName: "Saw"
}
``` 

## How to create and use a `QueryBuilder`

There are several ways how you can create query builder:

* Using connection:
    
    ```typescript
    import {getConnection} from "typeorm";
    
    const user = await getConnection()
        .createQueryBuilder()
        .select()
        .from(User, "user")
        .where("user.id = :id", { id: 1 })
        .getOne();
    ```

* Using entity manager:
    
    ```typescript
    import {getManager} from "typeorm";
    
    const user = await getManager()
        .createQueryBuilder(User, "user")
        .where("user.id = :id", { id: 1 })
        .getOne();
    ```

* Using repository:
    
    ```typescript
    import {getRepository} from "typeorm";
    
    const user = await getRepository(User)
        .createQueryBuilder("user")
        .where("user.id = :id", { id: 1 })
        .getOne();
    ```

There are 5 types of `QueryBuilder` available:

* `SelectQueryBuilder` used to build and execute `SELECT` queries. Example:

    ```typescript
    import {getConnection} from "typeorm";
    
    const user = await getConnection()
        .createQueryBuilder()
        .select()
        .from(User, "user")
        .where("user.id = :id", { id: 1 })
        .getOne();
    ```

* `InsertQueryBuilder` used to build and execute `INSERT` queries. Example:

    ```typescript
    import {getConnection} from "typeorm";
    
    await getConnection()
        .createQueryBuilder()
        .insert()
        .into(User)
        .values([
            { firstName: "Timber", lastName: "Saw" }, 
            { firstName: "Phantom", lastName: "Lancer" }
         ])
        .execute();
    ```

* `UpdateQueryBuilder` used to build and execute `UPDATE` queries. Example:
                          
    ```typescript
    import {getConnection} from "typeorm";
    
    await getConnection()
        .createQueryBuilder()
        .update(User)
        .set({ firstName: "Timber", lastName: "Saw" })
        .where("id = :id", { id: 1 })
        .execute();
    ```
* `DeleteQueryBuilder` used to build and execute `DELETE` queries. Example:
                                                    
    ```typescript
    import {getConnection} from "typeorm";
    
    await getConnection()
        .createQueryBuilder()
        .delete()
        .from(User)
        .where("id = :id", { id: 1 })
        .execute();
    ```

* `RelationQueryBuilder` used to build and execute relation-specific operations [TBD]. 

You can switch between different types of query builder within any of them,
once you do it - you will get a new instance of query builder (unlike all other methods).

## Building `SELECT` queries

### Getting values using `QueryBuilder`

To get a single result from the database, 
for example to get user by id or name you must use `getOne` method:

```typescript
const timber = await getRepository(User)
    .createQueryBuilder("user")
    .where("user.id = :id OR user.name = :name", { id: 1, name: "Timber" })
    .getOne();
``` 

To get a multiple results from the database, 
for example to get all users from the database use `getMany` method:

```typescript
const users = await getRepository(User)
    .createQueryBuilder("user")
    .getMany();
```

There are two types of results you can get using select query builder: **entities** or **raw results**.
Most of times you need to select real entities from your database, for example users. 
For this purpose you use `getOne` and `getMany` methods.
But sometimes you need to select some specific data, let's say *sum of all user photos*. 
Such data is not entity, its called raw data.
To get raw data you use `getRawOne` and `getRawMany` methods.
Examples:

```typescript
const { sum } = await getRepository(User)
    .createQueryBuilder("user")
    .select("SUM(user.photosCount)", "sum")
    .where("user.id = :id", { id: 1 })
    .getRawOne();
```

```typescript
const photosSums = await getRepository(User)
    .createQueryBuilder("user")
    .select("user.id")
    .addSelect("SUM(user.photosCount)", "sum")
    .where("user.id = :id", { id: 1 })
    .getRawMany();

// result will be like this: [{ id: 1, sum: 25 }, { id: 2, sum: 13 }, ...]
```

### What are aliases stand for?

We used `createQueryBuilder("user")` everywhere. But what is "user" there?
Answer is: its just a regular SQL alias. 
We use that alias everywhere in expressions where we work with selected data.

`createQueryBuilder("user")` is equivalent for:

```typescript
createQueryBuilder()
    .select()
    .from(User, "user")
```

Which will result into following sql query:

```sql
SELECT ... FROM users user
```

In this SQL query `users` is a table name and `user` is an alias we assign to this table.
Later we use this alias to access to this table:

```typescript
createQueryBuilder()
    .select()
    .from(User, "user")
    .where("user.name = :name", { name: "Timber" })
```

Which produce following SQL query:

```sql
SELECT ... FROM users user WHERE user.name = 'Timber'
```

See, we access users table using `user` alias we assigned when we created a query builder.

One query builder is not limited to one alias.
There are multiple aliases.
Each your select can have its own alias,
you can select from multiple tables each with own alias, 
you can join multiple tables each with its own alias.
You use those aliases to access tables are you selecting (or data you are selecting). 

### Using parameters to escape data

We used `where("user.name = :name", { name: "Timber" })` syntax everywhere.
What `{ name: "Timber" }` stands for? Answer: its a parameter we used to prevent SQL injection.
We could do simply: `where("user.name = '" + name + "')`, 
however this is not safe way and SQL injection can be easily executed there.
Safe way is to use special syntax: `where("user.name = :name", { name: "Timber" })`,
where `:name` is a parameter name. Parameter's value is specified in object: `{ name: "Timber" }`.

```typescript
.where("user.name = :name", { name: "Timber" })
```

is a shortcut for:

```typescript
.where("user.name = :name")
.setParameter("name", "Timber")
```

### Adding `WHERE` expression

Adding SQL `WHERE` expression is easy as:

```typescript
createQueryBuilder("user")
    .where("user.name = :name", { name: "Timber" })
```

Will produce following SQL query:

```sql
SELECT ... FROM users user WHERE user.name = 'Timber'
```

You can add `AND` into exist `WHERE` expression this way:

```typescript
createQueryBuilder("user")
    .where("user.firstName = :firstName", { firstName: "Timber" })
    .andWhere("user.lastName = :lastName", { lastName: "Saw" });
```

Will produce following SQL query:

```sql
SELECT ... FROM users user WHERE user.firstName = 'Timber' AND user.lastName = 'Saw'
```

You can add `OR` into exist `WHERE` expression this way:

```typescript
createQueryBuilder("user")
    .where("user.firstName = :firstName", { firstName: "Timber" })
    .orWhere("user.lastName = :lastName", { lastName: "Saw" });
```

Will produce following SQL query:

```sql
SELECT ... FROM users user WHERE user.firstName = 'Timber' OR user.lastName = 'Saw'
```

You can combine as many `AND` and `OR` expressions as you need.
If you use `.where` method you'll override all previous set `WHERE` expressions.

Note: be careful with `orWhere` method - if you use complex expressions with both `AND` and `OR` expressions
keep in mind that they are stacked without any pretences. 
Sometimes you'll need to create a where string instead and avoid using `orWhere` method. 

### Adding `HAVING` expression

Adding SQL `HAVING` expression is easy as:

```typescript
createQueryBuilder("user")
    .having("user.name = :name", { name: "Timber" })
```

Will produce following SQL query:

```sql
SELECT ... FROM users user HAVING user.name = 'Timber'
```

You can add `AND` into exist `HAVING` expression this way:

```typescript
createQueryBuilder("user")
    .having("user.firstName = :firstName", { firstName: "Timber" })
    .andHaving("user.lastName = :lastName", { lastName: "Saw" });
```

Will produce following SQL query:

```sql
SELECT ... FROM users user HAVING user.firstName = 'Timber' AND user.lastName = 'Saw'
```

You can add `OR` into exist `HAVING` expression this way:

```typescript
createQueryBuilder("user")
    .having("user.firstName = :firstName", { firstName: "Timber" })
    .orHaving("user.lastName = :lastName", { lastName: "Saw" });
```

Will produce following SQL query:

```sql
SELECT ... FROM users user HAVING user.firstName = 'Timber' OR user.lastName = 'Saw'
```

You can combine as many `AND` and `OR` expressions as you need.
If you use `.having` method you'll override all previous set `HAVING` expressions.

### Adding `ORDER BY` expression

Adding SQL `ORDER BY` expression is easy as:

```typescript
createQueryBuilder("user")
    .orderBy("user.id")
```

Will produce following SQL query:

```sql
SELECT ... FROM users user ORDER BY user.id
```

To change order direction from ascendant to descendant (or versa) use following syntax:

```typescript
createQueryBuilder("user")
    .orderBy("user.id", "DESC")
    
createQueryBuilder("user")
    .orderBy("user.id", "ASC")
```

You can add multiple order-by criteria:

```typescript
createQueryBuilder("user")
    .orderBy("user.name")
    .addOrderBy("user.id");
```

Also you can set a map of order-by fields:

```typescript
createQueryBuilder("user")
    .orderBy({
        "user.name": "ASC",
        "user.id": "DESC"
    });
```

If you use `.orderBy` method you'll override all previous set `ORDER BY` expressions.

### Adding `LIMIT` expression

Adding SQL `GROUP BY` expression is easy as:

```typescript
createQueryBuilder("user")
    .groupBy("user.id")
```

Will produce following SQL query:

```sql
SELECT ... FROM users user GROUP BY user.id
```
To add more group-by criteria use `addGroupBy` method:

```typescript
createQueryBuilder("user")
    .groupBy("user.name")
    .addGroupBy("user.id");
```

Also you can set a map of order-by fields:

```typescript
createQueryBuilder("user")
    .orderBy({
        "user.name": "ASC",
        "user.id": "DESC"
    });
```

If you use `.orderBy` method you'll override all previous set `ORDER BY` expressions.

### Adding `LIMIT` expression

Adding SQL `LIMIT` expression is easy as:

```typescript
createQueryBuilder("user")
    .limit(10)
```

Will produce following SQL query:

```sql
SELECT ... FROM users user LIMIT 10
```

Result SQL query depend of database type.
Note LIMIT may not work as you may expect if you are using complex queries with joins or subqueries.
If you are using pagination its recommended to use `take` method instead.

### Adding `OFFSET` expression

Adding SQL `OFFSET` expression is easy as:

```typescript
createQueryBuilder("user")
    .offset(10)
```

Will produce following SQL query:

```sql
SELECT ... FROM users user OFFSET 10
```

Result SQL query depend of database type.
Note OFFSET may not work as you may expect if you are using complex queries with joins or subqueries.
If you are using pagination its recommended to use `skip` method instead.

### Joining relations

Let's say you have following entities:

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

Now let's say you want to load user "Timber" with all his photos.
To do it you need to use following syntax:

```typescript
const user = await createQueryBuilder("user")
    .leftJoinAndSelect("user.photos", "photo")
    .where("user.name = :name", { name: "Timber" })
    .getOne();
```

You'll get following result:

```typescript
{
    id: 1,
    name: "Timber",
    photos: [{
        id: 1,
        url: "me-with-chakram.jpg"
    }, {
        id: 2,
        url: "me-with-trees.jpg"
    }]
}
```

As you can see `leftJoinAndSelect` automatically loaded all timber's photos.
First method argument is relation you want to load. 
Second method argument is an alias you assign to this relation's data.
You can use this alias anywhere in query builder.
For example, lets take all timber's photos which aren't removed.

```typescript
const user = await createQueryBuilder("user")
    .leftJoinAndSelect("user.photos", "photo")
    .where("user.name = :name", { name: "Timber" })
    .andWhere("photo.isRemoved = :isRemoved", { isRemoved: false })
    .getOne();
```

This will generate following sql query:

```sql
SELECT user.*, photo.* FROM users user 
    LEFT JOIN photos photo ON photo.user = user.id
    WHERE user.name = 'Timber' AND photo.isRemoved = TRUE
```

You can also add condition to join expression instead of using "where":

```typescript
const user = await createQueryBuilder("user")
    .leftJoinAndSelect("user.photos", "photo", "photo.isRemoved = :isRemoved", { isRemoved: false })
    .where("user.name = :name", { name: "Timber" })
    .getOne();
```

This will generate following sql query:

```sql
SELECT user.*, photo.* FROM users user 
    LEFT JOIN photos photo ON photo.user = user.id AND photo.isRemoved = TRUE
    WHERE user.name = 'Timber'
```

### Inner and left joins

If you want to use `INNER JOIN` instead of `JEFT JOIN` just use `innerJoinAndSelect` method instead:

```typescript
const user = await createQueryBuilder("user")
    .innerJoinAndSelect("user.photos", "photo", "photo.isRemoved = :isRemoved", { isRemoved: false })
    .where("user.name = :name", { name: "Timber" })
    .getOne();
```

This will generate following sql query:

```sql
SELECT user.*, photo.* FROM users user 
    INNER JOIN photos photo ON photo.user = user.id AND photo.isRemoved = TRUE
    WHERE user.name = 'Timber'
```

Difference between `LEFT JOIN` and `INNER JOIN` is that `INNER JOIN` won't return you timber if he does not have any photos.
`LEFT JOIN` will return you timber even if he don't have photos.
To learn more about different join types refer to SQL documentation.

### Join without selection

You can join data without its selection.
To do that use `leftJoin` or `innerJoin` methods. Example:

```typescript
const user = await createQueryBuilder("user")
    .innerJoin("user.photos", "photo")
    .where("user.name = :name", { name: "Timber" })
    .getOne();
```

This will generate following sql query:

```sql
SELECT user.* FROM users user 
    INNER JOIN photos photo ON photo.user = user.id
    WHERE user.name = 'Timber'
```

This will select timber only he has photos, but won't return his photos in result. 

### Joining any entity or table

You can join not only relations, but also other not related entities or tables.
Examples:

```typescript
const user = await createQueryBuilder("user")
    .leftJoinAndSelect(Photo, "photo", "photo.userId = user.id")
    .getMany();
```

```typescript
const user = await createQueryBuilder("user")
    .leftJoinAndSelect("photos", "photo", "photo.userId = user.id")
    .getMany();
```

### Joining and mapping functionality

Add `profilePhoto` property to `User` entity and you can map any data into that property using `QueryBuilder`:

```typescript
export class User {    
    /// ...
    profilePhoto: Photo;
    
}
```

```typescript
const user = await createQueryBuilder("user")
    .leftJoinAndMapOne("user.profilePhoto", "user.photos", "photo", "photo.isForProfile = TRUE")
    .where("user.name = :name", { name: "Timber" })
    .getOne();
```

This will load timber's profile photo and set it to `user.profilePhoto` property.
If you want to load and map a single entity use `leftJoinAndMapOne` method.
If you want to load and map a multiple entities use `leftJoinAndMapMany` method.

### Getting result query

Sometimes you may want to get a SQL query `QueryBuilder` generates for you.
To do it use `getSql` method:

```typescript
const sql = createQueryBuilder("user")
    .where("user.firstName = :firstName", { firstName: "Timber" })
    .orWhere("user.lastName = :lastName", { lastName: "Saw" })
    .getSql();
```

For debugging purposes you can use `printSql` method:

```typescript
const users = await createQueryBuilder("user")
    .where("user.firstName = :firstName", { firstName: "Timber" })
    .orWhere("user.lastName = :lastName", { lastName: "Saw" })
    .printSql()
    .getMany();
```

This query will return you users and print in the console sql it used to get those users.

### Getting raw results

There are two types of results you can get using select query builder: **entities** and **raw results**.
Most of times you need to select real entities from your database, for example users. 
For this purpose you use `getOne` and `getMany` methods.
But sometimes you need to select some specific data, let's say *sum of all user photos*. 
Such data is not entity, its called raw data.
To get raw data you use `getRawOne` and `getRawMany` methods.
Examples:

```typescript
const { sum } = await getRepository(User)
    .createQueryBuilder("user")
    .select("SUM(user.photosCount)", "sum")
    .where("user.id = :id", { id: 1 })
    .getRawOne();
```

```typescript
const photosSums = await getRepository(User)
    .createQueryBuilder("user")
    .select("user.id")
    .addSelect("SUM(user.photosCount)", "sum")
    .where("user.id = :id", { id: 1 })
    .getRawMany();

// result will be like this: [{ id: 1, sum: 25 }, { id: 2, sum: 13 }, ...]
```

### Streaming result data

You can use `stream` method which returns you stream.
Streaming returns you raw data, you must handle entities transformation manually:

```typescript
const stream = await getRepository(User)
    .createQueryBuilder("user")
    .where("user.id = :id", { id: 1 })
    .stream();
```

### Using pagination

Most of times developing applications you need a pagination functionality.
This is used if you have pagination, page slider, infinite scroll components in your application.

```typescript
const users = await getRepository(User)
    .createQueryBuilder("user")
    .leftJoinAndSelect("user.photos", "photo")
    .take(10)
    .getMany();
```

This will give you first 10 users with their photos.

```typescript
const users = await getRepository(User)
    .createQueryBuilder("user")
    .leftJoinAndSelect("user.photos", "photo")
    .skip(10)
    .getMany();
```

This will give you all users with their photos except first 10.
You can combine those methods:

```typescript
const users = await getRepository(User)
    .createQueryBuilder("user")
    .leftJoinAndSelect("user.photos", "photo")
    .skip(5)
    .take(10)
    .getMany();
```

This will skip first 5 users and take 10 users after them.


`take` and `skip` may look like we are using `limit` and `offset`, but its actually not.
`limit` and `offset` may not work as you expect once you'll have more complicated queries with joins or subqueries.
Using `take` and `skip` methods will prevent those issues.

### Set locking

QueryBuilder supports both optimistic and pessimistic locking.
To use pessimistic read locking use following method:

```typescript
const users = await getRepository(User)
    .createQueryBuilder("user")
    .setLock("pessimistic_read")
    .getMany();
```

To use pessimistic write locking use following method:

```typescript
const users = await getRepository(User)
    .createQueryBuilder("user")
    .setLock("pessimistic_write")
    .getMany();
```

To use optimistic locking use following method:

```typescript
const users = await getRepository(User)
    .createQueryBuilder("user")
    .setLock("optimistic", existUser.version)
    .getMany();
```

Optimistic locking works in conjunction with `@Version` and `@UpdatedDate` decorators.

### Partial selection

If you want to select only some entity properties you can use following syntax:

````typescript
const users = await getRepository(User)
    .createQueryBuilder("user")
    .select([
        "user.id",
        "user.name"
    ])
    .getMany();
````

This will select only `id` and `name` properties of `User` entity.

### Using subqueries

You can easily create subqueries. Subqueries are supported in `FROM`, `WHERE` and `JOIN` expressions.

Example how to use subquery in where expression:

```typescript
const qb = await getRepository(Post).createQueryBuilder("post");
const posts = qb
    .where("post.title IN " + qb.subQuery().select("user.name").from(User, "user").where("user.registered = :registered").getQuery())
    .setParameter("registered", true)
    .getMany();
```

More elegant way to do same is:

```typescript
const posts = await connection.getRepository(Post)
    .createQueryBuilder("post")
    .where(qb => {
        const subQuery = qb.subQuery()
            .select("user.name")
            .from(User, "user")
            .where("user.registered = :registered")
            .getQuery();
        return "post.title IN " + subQuery;
    })
    .setParameter("registered", true)
    .getMany();
```

Alternative, you can create a separate query builder and use its generated SQL:

```typescript
const userQb = await connection.getRepository(User)
    .createQueryBuilder("user")
    .select("user.name")
    .where("user.registered = :registered", { registered: true });

const posts = await connection.getRepository(Post)
    .createQueryBuilder("post")
    .where("post.title IN (" + userQb.getQuery() + ")")
    .setParameters(userQb.getParameters())
    .getMany();
```

You can do subquery in `FROM` expression this way:

```typescript
const userQb = await connection.getRepository(User)
    .createQueryBuilder("user")
    .select("user.name", "name")
    .where("user.registered = :registered", { registered: true });

const posts = await connection
    .createQueryBuilder()
    .select("user.name", "name")
    .from("(" + userQb.getQuery() + ")", "user")
    .setParameters(userQb.getParameters())
    .getRawMany();
```

or using more elegant syntax:

```typescript
const posts = await connection
    .createQueryBuilder()
    .select("user.name", "name")
    .from(subQuery => {
        return subQuery
            .select("user.name", "name")
            .from(User, "user")
            .where("user.registered = :registered", { registered: true });
    }, "user")
    .getRawMany();
```

If you want to add subselect as "second from" use `addFrom` method.

You can use subselects in `SELECT` statements as well:

```typescript
const posts = await connection
    .createQueryBuilder()
    .select("post.id", "id")
    .addSelect(subQuery => {
        return subQuery
            .select("user.name", "name")
            .from(User, "user")
            .limit(1);
    }, "name")
    .from(Post, "post")
    .getRawMany();
```

### Caching queries

You can cache results of `getMany`, `getOne`, `getRawMany`, `getRawOne`  and `getCount` methods.
To enable caching you need to explicitly enable it in connection options:

```typescript
{
    type: "mysql",
    host: "localhost",
    username: "test",
    ...
    cache: true
}
```

When you enable cache for the first time,
you must synchronize your database schema (using cli, migrations or simply option in connection).

Then in `QueryBuilder` you can enable query cache for any query:

```typescript
const users = await connection
    .createQueryBuilder(User, "user")
    .where("user.isAdmin = :isAdmin", { isAdmin: true })
    .cache(true)
    .getMany();
```

This will execute query to fetch all admin users and cache its result.
Next time when you execute same code it will get admin users from cache.
Default cache time is equal to `1000 ms`, e.g. 1 second.
It means cache will be invalid in 1 second after you first time call query builder code.
In practice it means if users open user page 150 times within 3 seconds only three queries will be executed during this period.
All other inserted users during 1 second of caching won't be returned to user.

You can change cache time manually:

```typescript
const users = await connection
    .createQueryBuilder(User, "user")
    .where("user.isAdmin = :isAdmin", { isAdmin: true })
    .cache(60000) // 1 minute
    .getMany();
```

Or globally in connection options:

```typescript
{
    type: "mysql",
    host: "localhost",
    username: "test",
    ...
    cache: {
        duration: 30000 // 30 seconds
    }
}
```

Also you can set a "cache id":

```typescript
const users = await connection
    .createQueryBuilder(User, "user")
    .where("user.isAdmin = :isAdmin", { isAdmin: true })
    .cache("users_admins", 25000)
    .getMany();
```

It will allow you to granular control your cache,
for example clear cached results when you insert a new user:

```typescript
await connection.queryResultCache.remove(["users_admins"]);
```


By default, TypeORM uses separate table called `query-result-cache` and stores all queries and results there.
If storing cache in a single database table is not effective for you, 
you can change cache type to "redis" and TypeORM will store all cache records in redis instead.
Example:

```typescript
{
    type: "mysql",
    host: "localhost",
    username: "test",
    ...
    cache: {
        type: "redis",
        options: {
            host: "localhost",
            port: 6379
        }
    }
}
```

"options" are [redis specific options](https://github.com/NodeRedis/node_redis#options-object-properties). 

You can use `typeorm cache:clear` command to clear everything stored in cache.

## Building `INSERT` query

You can create `INSERT` queries using `QueryBuilder`.
Examples:

```typescript
import {getConnection} from "typeorm";

await getConnection()
    .createQueryBuilder()
    .insert()
    .into(User)
    .values([
        { firstName: "Timber", lastName: "Saw" }, 
        { firstName: "Phantom", lastName: "Lancer" }
     ])
    .execute();
```

This is the most efficient in terms of performance way to insert things into your database.
You can also perform bulky insertions this way.
     
## Building `UPDATE` query

You can create `UPDATE` queries using `QueryBuilder`.
Examples:
             
```typescript
import {getConnection} from "typeorm";

await getConnection()
    .createQueryBuilder()
    .update(User)
    .set({ firstName: "Timber", lastName: "Saw" })
    .where("id = :id", { id: 1 })
    .execute();
```

This is the most efficient in terms of performance way to update things in your database.

## Building `DELETE` query

You can create `DELETE` queries using `QueryBuilder`.
Examples:
                                               
```typescript
import {getConnection} from "typeorm";

await getConnection()
    .createQueryBuilder()
    .delete()
    .from(User)
    .where("id = :id", { id: 1 })
    .execute();
```

This is the most efficient in terms of performance way to delete things from your database. 

## Using `RelationQueryBuilder`

`RelationQueryBuilder` is special type of `QueryBuilder` which allows you to work with your relations.
Using it you can bind entities to each other in the database without need to load any entity.
Or you can load related entities easily.
Examples:

For example we have a `Post` entity and it has many-to-many relation to `Category` entity called `categories`.
Let's add a new category to this many-to-many relation:
                       
```typescript
import {getConnection} from "typeorm";

await getConnection()
    .createQueryBuilder()
    .relation(Post, "categories")
    .of(post)
    .add(category);
```

This code is equivalent of doing this:
       
```typescript
import {getManager} from "typeorm";

const postRepository = getRepository(Post);
const post = postRepository.findOneById(1, { relations: ["categories"] });
post.categories.push(category);
await postRepository.save(post);
```

But more efficient because it does minimal number of operations and binds entities in the database,
unlike calling bulky `save` method call.

Also, benefit of such approach is that you don't need to load everything in entity relation before pushing into it.
For example if you would had ten thousands categories inside a single post adding a new post into this list may become problematic for you, 
because standard way of doing is to load post with all ten thousands categories, push a new category
and save it. Result is very heavy performance and basically inapplicable in production results.
However, using `RelationQueryBuilder` completely solves this problem.

Also, there is no real need to use entities when you "bind" things, you can use entity ids instead.
For example, lets add category with id = 3 into post with id = 1:

```typescript
import {getConnection} from "typeorm";

await getConnection()
    .createQueryBuilder()
    .relation(Post, "categories")
    .of(1)
    .add(3);
```

If you are using composite primary keys you have to pass them as id map, for example:

```typescript
import {getConnection} from "typeorm";

await getConnection()
    .createQueryBuilder()
    .relation(Post, "categories")
    .of({ firstPostId: 1, secondPostId: 3 })
    .add({ firstCategoryId: 2, secondCategoryId: 4 });
```

Same way you add new entities, you can remove them:    
         
```typescript
import {getConnection} from "typeorm";

// this code removes a category from a given post
await getConnection()
    .createQueryBuilder()
    .relation(Post, "categories")
    .of(post) // you can use just post id as well
    .remove(category); // you can use just category id as well
```

Adding and removing related entities works in `many-to-many` and `one-to-many` relations.
For `one-to-one` and `many-to-one` relations use `set` method instead:

```typescript
import {getConnection} from "typeorm";

// this code sets category of a given post
await getConnection()
    .createQueryBuilder()
    .relation(Post, "categories")
    .of(post) // you can use just post id as well
    .set(category); // you can use just category id as well
```

If you want to unset a relation (set it to null), simply pass `null` to a `set` method:

```typescript
import {getConnection} from "typeorm";

// this code unsets category of a given post
await getConnection()
    .createQueryBuilder()
    .relation(Post, "categories")
    .of(post) // you can use just post id as well
    .set(null);
```

Besides updating relations relational query builder also allows you to load relational entities.
For example, lets say we have inside a `Post` entity many-to-many `categories` relation and many-to-one `user` relation.
To load those relations you can use following code:

```typescript
import {getConnection} from "typeorm";

const post = await getConnection().manager.findOneById(Post, 1);

post.categories = await getConnection()
    .createQueryBuilder()
    .relation(Post, "categories")
    .of(post) // you can use just post id as well
    .loadMany();

post.author = await getConnection()
    .createQueryBuilder()
    .relation(User, "user")
    .of(post) // you can use just post id as well
    .loadOne();
```