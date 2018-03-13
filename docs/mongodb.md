# MongoDB

* [MongoDB support](#mongodb-support)
* [Defining entities and columns](#defining-entities-and-columns)
* [Defining subdocuments (embed documents)](#defining-subdocuments-embed-documents)
* [Using `MongoEntityManager` and `MongoRepository`](#using-mongoentitymanager-and-mongorepository)

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
import {Entity, ObjectID, ObjectIdColumn, Column} from "typeorm";

@Entity()
export class User {
    
    @ObjectIdColumn()
    id: ObjectID;
    
    @Column()
    firstName: string;
    
    @Column()
    lastName: string;
    
}
```

And this is how you bootstrap the app:

```typescript
import {createConnection, Connection} from "typeorm";

const connection: Connection = await createConnection({
    type: "mongodb",
    host: "localhost",
    port: 27017,
    database: "test"
});
```

## Defining subdocuments (embed documents)

Since MongoDB stores objects and objects inside objects (or documents inside documents)
you can do the same in TypeORM:

```typescript
import {Entity, ObjectID, ObjectIdColumn, Column} from "typeorm";

export class Profile {
    
    @Column()
    about: string;
    
    @Column()
    education: string;
    
    @Column()
    career: string;
    
}
```

```typescript
import {Entity, ObjectID, ObjectIdColumn, Column} from "typeorm";

export class Photo {
    
    @Column()
    url: string;
    
    @Column()
    description: string;
    
    @Column()
    size: number;
    
    constructor(url: string, description: string, size: number) {
        this.url = url;
        this.description = description;
        this.size = size;
    }
    
}
```

```typescript
import {Entity, ObjectID, ObjectIdColumn, Column} from "typeorm";

@Entity()
export class User {
    
    @ObjectIdColumn()
    id: ObjectID;
    
    @Column()
    firstName: string;
    
    @Column()
    lastName: string;
    
    @Column(type => Profile)
    profile: Profile;
    
    @Column(type => Photo)
    photos: Photo[];
    
}
```

If you save this entity:

```typescript
import {getMongoManager} from "typeorm";

const user = new User();
user.firstName = "Timber";
user.lastName = "Saw";
user.profile = new Profile();
user.profile.about = "About Trees and Me";
user.profile.education = "Tree School";
user.profile.career = "Lumberjack";
user.photos = [
    new Photo("me-and-trees.jpg", "Me and Trees", 100),
    new Photo("me-and-chakram.jpg", "Me and Chakram", 200),
];

const manager = getMongoManager();
await manager.save(user);
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
import {getManager} from "typeorm";

const manager = getManager(); // or connection.manager
const timber = await manager.findOne(User, { firstName: "Timber", lastName: "Saw" });
```

For MongoDB there is also a separate `MongoEntityManager` which extends `EntityManager`.

```typescript
import {getMongoManager} from "typeorm";

const manager = getMongoManager(); // or connection.mongoManager
const timber = await manager.findOne(User, { firstName: "Timber", lastName: "Saw" });
```

Just like separate like `MongoEntityManager` there is a `MongoRepository` with extended `Repository`:

```typescript
import {getMongoRepository} from "typeorm";

const userRepository = getMongoRepository(User); // or connection.getMongoManager
const timber = await userRepository.findOne({ firstName: "Timber", lastName: "Saw" });
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

#### `deleteMany`

Earlier version of MongoDB will throw a command not supported error.

#### `deleteOne`

Index specifications are defined at http://docs.mongodb.org/manual/reference/command/createIndexes/.

#### `distinct`

Delete multiple documents on MongoDB.

#### `dropCollectionIndex`

Delete a document on MongoDB.

#### `dropCollectionIndexes`

The distinct command returns returns a list of distinct values for the given key across a collection.

#### `findOneAndDelete`

Drops an index from this collection.

#### `findOneAndReplace`

Drops all indexes from the collection.

#### `findOneAndUpdate`

Find a document and update it in one atomic operation, requires a write lock for the duration of the operation.

#### `geoHaystackSearch`

Find a document and replace it in one atomic operation, requires a write lock for the duration of the operation.

#### `geoNear`

Find a document and update it in one atomic operation, requires a write lock for the duration of the operation.

#### `group`

Execute a geo search using a geo haystack index on a collection.

#### `collectionIndexes`

Execute the geoNear command to search for items in the collection.

#### `collectionIndexExists`

Run a group command across a collection.

#### `collectionIndexInformation`

Retrieve all the indexes on the collection.

#### `initializeOrderedBulkOp`

Retrieve all the indexes on the collection.

#### `initializeUnorderedBulkOp`

Retrieves this collections index info.

#### `insertMany`

Initiate an In order bulk write operation, operations will be serially executed in the order they are added, creating a new operation for each switch in types.

#### `insertOne`

Initiate a Out of order batch write operation. All operations will be buffered into insert/update/remove commands executed out of order.

#### `isCapped`

Inserts an array of documents into MongoDB.

#### `listCollectionIndexes`

Inserts a single document into MongoDB.

#### `mapReduce`

Returns if the collection is a capped collection.

#### `parallelCollectionScan`

Get the list of all indexes information for the collection.

#### `reIndex`

Run Map Reduce across a collection. Be aware that the inline option for out will return an array of results not a collection.

#### `rename`

Return N number of parallel cursors for a collection allowing parallel reading of entire collection.

#### `replaceOne`

There are no ordering guarantees for returned results.

#### `stats`

Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.

#### `updateMany`

Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.

#### `updateOne`

Replace a document on MongoDB.

