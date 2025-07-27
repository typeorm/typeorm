# MongoDB

## MongoDB support

TypeORM has basic MongoDB support.
Most of TypeORM functionality is RDBMS-specific,
this page contains all MongoDB-specific functionality documentation.

## Installation

```shell
npm install mongodb
```

## Data Source Options

-   `url` - Connection url where the connection is performed. Please note that other data source options will override parameters set from url.

-   `host` - Database host.

-   `port` - Database host port. Default mongodb port is `27017`.

-   `username` - Database username (replacement for `auth.user`).

-   `password` - Database password (replacement for `auth.password`).

-   `database` - Database name.

-   `poolSize` - Set the maximum pool size for each individual server or proxy connection.

-   `tls` - Use a TLS/SSL connection (needs a mongod server with ssl support, 2.4 or higher). Default: `false`.

-   `tlsAllowInvalidCertificates` - Specifies whether the driver generates an error when the server's TLS certificate is invalid. Default: `false`.

-   `tlsCAFile` - Specifies the location of a local .pem file that contains the root certificate chain from the Certificate Authority.

-   `tlsCertificateKeyFile` - Specifies the location of a local .pem file that contains the client's TLS/SSL certificate and key.

-   `tlsCertificateKeyFilePassword` - Specifies the password to de-crypt the `tlsCertificateKeyFile`.

-   `keepAlive` - The number of milliseconds to wait before initiating keepAlive on the TCP socket. Default: `30000`.

-   `connectTimeoutMS` - TCP Connection timeout setting. Default: `30000`.

-   `socketTimeoutMS` - TCP Socket timeout setting. Default: `360000`.

-   `replicaSet` - The name of the replica set to connect to.

-   `authSource` - If the database authentication is dependent on another databaseName.

-   `writeConcern` - The write concern.

-   `forceServerObjectId` - Force server to assign \_id values instead of driver. Default: `false`.

-   `serializeFunctions` - Serialize functions on any object. Default: `false`.

-   `ignoreUndefined` - Specify if the BSON serializer should ignore undefined fields. Default: `false`.

-   `raw` - Return document results as raw BSON buffers. Default: `false`.

-   `promoteLongs` - Promotes Long values to number if they fit inside the 53 bits resolution. Default: `true`.

-   `promoteBuffers` - Promotes Binary BSON values to native Node Buffers. Default: `false`.

-   `promoteValues` - Promotes BSON values to native types where possible, set to false to only receive wrapper types.
    Default: `true`.

-   `readPreference` - The preferred read preference.

    -   `ReadPreference.PRIMARY`
    -   `ReadPreference.PRIMARY_PREFERRED`
    -   `ReadPreference.SECONDARY`
    -   `ReadPreference.SECONDARY_PREFERRED`
    -   `ReadPreference.NEAREST`

-   `pkFactory` - A primary key factory object for generation of custom \_id keys.

-   `readConcern` - Specify a read concern for the collection. (only MongoDB 3.2 or higher supported).

-   `maxStalenessSeconds` - Specify a maxStalenessSeconds value for secondary reads, minimum is 90 seconds.

-   `appName` - The name of the application that created this MongoClient instance. MongoDB 3.4 and newer will print this
    value in the server log upon establishing each connection. It is also recorded in the slow query log and profile
    collections

-   `authMechanism` - Sets the authentication mechanism that MongoDB will use to authenticate the connection.

-   `directConnection` - Specifies whether to force dispatch all operations to the specified host.

Additional options can be added to the `extra` object and will be passed directly to the client library. See more in `mongodb`'s documentation for [Connection Options](https://mongodb-node.netlify.app/docs/drivers/node/current/connect/connection-options/).

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
    _id: ObjectId

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

### `createCursor`

Creates a cursor for a query that can be used to iterate over results from MongoDB.

### `createEntityCursor`

Creates a cursor for a query that can be used to iterate over results from MongoDB.
This returns a modified version of the cursor that transforms each result into Entity models.

### `aggregate`

Execute an aggregation framework pipeline against the collection.

### `bulkWrite`

Perform a bulkWrite operation without a fluent API.

### `count`

Count number of matching documents in the db to a query.

### `countDocuments`

Count number of matching documents in the db to a query.

### `createCollectionIndex`

Creates an index on the db and collection.

### `createCollectionIndexes`

Creates multiple indexes in the collection, this method is only supported in MongoDB 2.6 or higher. Earlier versions of MongoDB will throw a "command not supported" error. Index specifications are defined at [createIndexes](http://docs.mongodb.org/manual/reference/command/createIndexes/).

### `deleteMany`

Delete multiple documents on MongoDB.

### `deleteOne`

Delete a document on MongoDB.

### `distinct`

The distinct command returns a list of distinct values for the given key across a collection.

### `dropCollectionIndex`

Drops an index from this collection.

### `dropCollectionIndexes`

Drops all indexes from the collection.

### `findOneAndDelete`

Find a document and delete it in one atomic operation, requires a write lock for the duration of the operation.

### `findOneAndReplace`

Find a document and replace it in one atomic operation, requires a write lock for the duration of the operation.

### `findOneAndUpdate`

Find a document and update it in one atomic operation, requires a write lock for the duration of the operation.

### `geoHaystackSearch`

Execute a geo search using a geo haystack index on a collection.

### `geoNear`

Execute the geoNear command to search for items in the collection.

### `group`

Run a group command across a collection.

### `collectionIndexes`

Retrieve all the indexes on the collection.

### `collectionIndexExists`

Retrieve if an index exists on the collection

### `collectionIndexInformation`

Retrieves this collections index info.

### `initializeOrderedBulkOp`

Initiate an In order bulk write operation, operations will be serially executed in the order they are added, creating a new operation for each switch in types.

### `initializeUnorderedBulkOp`

Initiate a Out of order batch write operation. All operations will be buffered into insert/update/remove commands executed out of order.

### `insertMany`

Inserts an array of documents into MongoDB.

### `insertOne`

Inserts a single document into MongoDB.

### `isCapped`

Returns if the collection is a capped collection.

### `listCollectionIndexes`

Get the list of all indexes information for the collection.

### `parallelCollectionScan`

Return N number of parallel cursors for a collection allowing parallel reading of entire collection. There are no ordering guarantees for returned results

### `reIndex`

Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.

### `rename`

Changes the name of an existing collection.

### `replaceOne`

Replace a document on MongoDB.

### `stats`

Get all the collection statistics.

### `updateMany`

Updates multiple documents within the collection based on the filter.

### `updateOne`

Updates a single document within the collection based on the filter.
