# MongoDB

-   [MongoDB support](#mongodb-support)
-   [Defining entities and columns](#defining-entities-and-columns)
-   [Defining subdocuments (embed documents)](#defining-subdocuments-embed-documents)
-   [Using `MongoEntityManager` and `MongoRepository`](#using-mongoentitymanager-and-mongorepository)

## MongoDB support

TypeORM has basic MongoDB support.
Most of TypeORM functionality is RDBMS-specific,
this page contains all MongoDB-specific functionality documentation.

## Defining entities and columns

Defining entities and columns is almost the same as in relational databases,
the main difference is that you must use `@ObjectIdColumn`
instead of `@PrimaryColumn` or `@PrimaryGeneratedColumn`.

Simple entity example:

```typescript
import { Entity, ObjectId, ObjectIdColumn, Column } from "typeorm"

@Entity()
export class User {
    @ObjectIdColumn()
    id: ObjectId

    @Column()
    firstName: string

    @Column()
    lastName: string
}
```

And this is how you bootstrap the app:

```typescript
import { DataSource } from "typeorm"

const myDataSource = new DataSource({
    type: "mongodb",
    host: "localhost",
    port: 27017,
    database: "test",
})
```

## Defining subdocuments (embed documents)

Since MongoDB stores objects and objects inside objects (or documents inside documents)
you can do the same in TypeORM:

```typescript
import { Entity, ObjectId, ObjectIdColumn, Column } from "typeorm"

export class Profile {
    @Column()
    about: string

    @Column()
    education: string

    @Column()
    career: string
}
```

```typescript
import { Entity, ObjectId, ObjectIdColumn, Column } from "typeorm"

export class Photo {
    @Column()
    url: string

    @Column()
    description: string

    @Column()
    size: number

    constructor(url: string, description: string, size: number) {
        this.url = url
        this.description = description
        this.size = size
    }
}
```

```typescript
import { Entity, ObjectId, ObjectIdColumn, Column } from "typeorm"

@Entity()
export class User {
    @ObjectIdColumn()
    id: ObjectId

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column((type) => Profile)
    profile: Profile

    @Column((type) => Photo)
    photos: Photo[]
}
```

If you save this entity:

```typescript
import { getMongoManager } from "typeorm"

const user = new User()
user.firstName = "Timber"
user.lastName = "Saw"
user.profile = new Profile()
user.profile.about = "About Trees and Me"
user.profile.education = "Tree School"
user.profile.career = "Lumberjack"
user.photos = [
    new Photo("me-and-trees.jpg", "Me and Trees", 100),
    new Photo("me-and-chakram.jpg", "Me and Chakram", 200),
]

const manager = getMongoManager()
await manager.save(user)
```

Following document will be saved in the database:

```json
{
    "firstName": "Timber",
    "lastName": "Saw",
    "profile": {
        "about": "About Trees and Me",
        "education": "Tree School",
        "career": "Lumberjack"
    },
    "photos": [
        {
            "url": "me-and-trees.jpg",
            "description": "Me and Trees",
            "size": 100
        },
        {
            "url": "me-and-chakram.jpg",
            "description": "Me and Chakram",
            "size": 200
        }
    ]
}
```

## Using `MongoEntityManager` and `MongoRepository`

You can use the majority of methods inside the `EntityManager` (except for RDBMS-specific, like `query` and `transaction`).
For example:

```typescript
const timber = await myDataSource.manager.findOneBy(User, {
    firstName: "Timber",
    lastName: "Saw",
})
```

For MongoDB there is also a separate `MongoEntityManager` which extends `EntityManager`.

```typescript
const timber = await myDataSource.manager.findOneBy(User, {
    firstName: "Timber",
    lastName: "Saw",
})
```

Just like separate like `MongoEntityManager` there is a `MongoRepository` with extended `Repository`:

```typescript
const timber = await myDataSource.getMongoRepository(User).findOneBy({
    firstName: "Timber",
    lastName: "Saw",
})
```

Use Advanced options in find():

Equal:

```typescript
const timber = await myDataSource.getMongoRepository(User).find({
    where: {
        firstName: { $eq: "Timber" },
    },
})
```

LessThan:

```typescript
const timber = await myDataSource.getMongoRepository(User).find({
    where: {
        age: { $lt: 60 },
    },
})
```

In:

```typescript
const timber = await myDataSource.getMongoRepository(User).find({
    where: {
        firstName: { $in: ["Timber", "Zhang"] },
    },
})
```

Not in:

```typescript
const timber = await myDataSource.getMongoRepository(User).find({
    where: {
        firstName: { $not: { $in: ["Timber", "Zhang"] } },
    },
})
```

Or:

```typescript
const timber = await myDataSource.getMongoRepository(User).find({
    where: {
        $or: [{ firstName: "Timber" }, { firstName: "Zhang" }],
    },
})
```

Querying subdocuments

```typescript
const users = await myDataSource.getMongoRepository(User).find({
    where: {
        "profile.education": { $eq: "Tree School" },
    },
})
```

Querying Array of subdocuments

```typescript
// Query users with photos of size less than 500
const users = await myDataSource.getMongoRepository(User).find({
    where: {
        "photos.size": { $lt: 500 },
    },
})
```

Both `MongoEntityManager` and `MongoRepository` contain lot of useful MongoDB-specific methods:

#### `createCursor`

Creates a cursor for a query that can be used to iterate over results from MongoDB.

#### `createEntityCursor`

Creates a cursor for a query that can be used to iterate over results from MongoDB.
This returns a modified version of the cursor that transforms each result into Entity models.

#### `aggregate`

Execute an aggregation framework pipeline against the collection.

#### `bulkWrite`

Perform a bulkWrite operation without a fluent API.

#### `count`

Count number of matching documents in the db to a query.

#### `createCollectionIndex`

Creates an index on the db and collection.

#### `createCollectionIndexes`

Creates multiple indexes in the collection, this method is only supported in MongoDB 2.6 or higher.
Earlier version of MongoDB will throw a command not supported error. Index specifications are defined at http://docs.mongodb.org/manual/reference/command/createIndexes/.

#### `deleteMany`

Delete multiple documents on MongoDB.

#### `deleteOne`

Delete a document on MongoDB.

#### `distinct`

The distinct command returns a list of distinct values for the given key across a collection.

#### `dropCollectionIndex`

Drops an index from this collection.

#### `dropCollectionIndexes`

Drops all indexes from the collection.

#### `findOneAndDelete`

Find a document and delete it in one atomic operation, requires a write lock for the duration of the operation.

#### `findOneAndReplace`

Find a document and replace it in one atomic operation, requires a write lock for the duration of the operation.

#### `findOneAndUpdate`

Find a document and update it in one atomic operation, requires a write lock for the duration of the operation.

#### `geoHaystackSearch`

Execute a geo search using a geo haystack index on a collection.

#### `geoNear`

Execute the geoNear command to search for items in the collection.

#### `group`

Run a group command across a collection.

#### `collectionIndexes`

Retrieve all the indexes on the collection.

#### `collectionIndexExists`

Retrieve if an index exists on the collection

#### `collectionIndexInformation`

Retrieves this collections index info.

#### `initializeOrderedBulkOp`

Initiate an In order bulk write operation, operations will be serially executed in the order they are added, creating a new operation for each switch in types.

#### `initializeUnorderedBulkOp`

Initiate a Out of order batch write operation. All operations will be buffered into insert/update/remove commands executed out of order.

#### `insertMany`

Inserts an array of documents into MongoDB.

#### `insertOne`

Inserts a single document into MongoDB.

#### `isCapped`

Returns if the collection is a capped collection.

#### `listCollectionIndexes`

Get the list of all indexes information for the collection.

#### `parallelCollectionScan`

Return N number of parallel cursors for a collection allowing parallel reading of entire collection. There are no ordering guarantees for returned results

#### `reIndex`

Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.

#### `rename`

Changes the name of an existing collection.

#### `replaceOne`

Replace a document on MongoDB.

#### `stats`

Get all the collection statistics.

#### `updateMany`

Updates multiple documents within the collection based on the filter.

#### `updateOne`

Updates a single document within the collection based on the filter.


Certainly! Here's an updated README with instructions for using MongoDB transactions with TypeORM:

---

# TypeORM MongoDB Transactions

This guide provides instructions on how to enable and use transactions with MongoDB using TypeORM. Transactions allow you to perform a series of database operations as a single atomic unit, ensuring data consistency and integrity.

## Prerequisites

- Node.js and npm installed on your system
- TypeORM and its dependencies installed in your project

## Enabling Transactions

To enable transactions for MongoDB in TypeORM, you need to set the `enableTransactions` option when creating your MongoDB data source. Here's an example:

```typescript
import { DataSource } from "typeorm";

const myDataSource = new DataSource({
  type: "mongodb",
  // other connection parameters
  enableTransactions: true,
});
```

Make sure to replace `"mongodb"` with the appropriate `type` value based on your configuration.

## Using Transactions

Once you have enabled transactions for MongoDB, you can use the `startTransaction()`, `commitTransaction()`, and `rollbackTransaction()` methods provided by the query runner to perform transactional operations. Here's an example:

```typescript
import { DataSource } from "typeorm";

const myDataSource = new DataSource({
  type: "mongodb",
  // other connection parameters
  enableTransactions: true,
});

async function performTransaction() {
  const queryRunner = myDataSource.createQueryRunner();
  await queryRunner.startTransaction();
  try {
    // Perform your database operations within the transaction
    // For example:
    await queryRunner.manager.save(userEntity);
    await queryRunner.manager.update(postEntity, { id: postId }, { likes: newLikeCount });
    // ...

    // If everything is successful, commit the transaction
    await queryRunner.commitTransaction();
  } catch (error) {
    // If any error occurs, rollback the transaction
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    // Release the query runner resources
    await queryRunner.release();
  }
}
```

Inside the `performTransaction()` function, you can execute your database operations using the `queryRunner.manager` object, which provides access to the EntityManager for performing CRUD operations.

If all operations within the transaction are successful, the `commitTransaction()` method is called to commit the changes to the database. If an error occurs during the transaction, the `rollbackTransaction()` method is called to undo any changes made within the transaction.

Remember to release the query runner resources by calling `release()` to free up database connections and avoid resource leaks.

