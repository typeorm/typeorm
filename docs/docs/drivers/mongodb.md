# MongoDB

## MongoDB support

TypeORM has basic MongoDB support (Node.js driver **v7 or later**).

Most of TypeORM functionality is RDBMS-specific, this page contains all MongoDB-specific functionality.

## Installation

```shell
npm install mongodb
```

## Data Source Options

- `appName` - The name of the application that created this MongoClient instance. MongoDB will print this value in the server log upon establishing each connection. It is also recorded in the slow query log and profile collections.

- `authMechanism` - Sets the authentication mechanism that MongoDB will use to authenticate the connection.

- `authSource` - Specify the database name associated with the user's credentials.

- `autoEncryption` - Optionally enable in-use auto encryption.

- `checkServerIdentity` - Verifies the certificate `cert` is issued to `hostname`.

- `compressors` - An array or comma-delimited string of compressors to enable network compression for communication between this client and a mongod/mongos instance.

- `connectTimeoutMS` - The time in milliseconds to attempt a connection before timing out. Default: `30000`.

- `database` - Database name.

- `directConnection` - Allow a driver to force a Single topology type with a connection string containing one host.

- `driver` - The driver object. Defaults to `require("mongodb")`.

- `family` - IP family.

- `forceServerObjectId` - Force server to assign \_id values instead of driver. Default: `false`.

- `host` - Database host.

- `hostReplicaSet` - Database host replica set.

- `ignoreUndefined` - Specify if the BSON serializer should ignore undefined fields. Default: `false`.

- `localThresholdMS` - The size (in milliseconds) of the latency window for selecting among multiple suitable MongoDB instances.

- `maxStalenessSeconds` - Specifies, in seconds, how stale a secondary can be before the client stops using it for read operations. Minimum is 90 seconds.

- `minPoolSize` - The minimum number of connections in the connection pool.

- `monitorCommands` - Enable command monitoring for this client.

- `noDelay` - TCP Connection no delay.

- `password` - Database password.

- `pkFactory` - A primary key factory object for generation of custom \_id keys.

- `poolSize` - Maximum number of connections in the connection pool. Mapped to the MongoDB driver's `maxPoolSize` option.

- `port` - Database host port. Default mongodb port is `27017`.

- `promoteBuffers` - Promotes Binary BSON values to native Node Buffers. Default: `false`.

- `promoteLongs` - Promotes Long values to number if they fit inside the 53-bit resolution. Default: `true`.

- `promoteValues` - Promotes BSON values to native types where possible, set to false to only receive wrapper types. Default: `true`.

- `proxyHost` - Configures a Socks5 proxy host used for creating TCP connections.

- `proxyPassword` - Configures a Socks5 proxy password when the proxy requires username/password authentication.

- `proxyPort` - Configures a Socks5 proxy port used for creating TCP connections.

- `proxyUsername` - Configures a Socks5 proxy username when the proxy requires username/password authentication.

- `raw` - Return document results as raw BSON buffers. Default: `false`.

- `readConcern` - Specify a read concern for the collection.

- `readPreference` - The preferred read preference.
    - `ReadPreference.PRIMARY`
    - `ReadPreference.PRIMARY_PREFERRED`
    - `ReadPreference.SECONDARY`
    - `ReadPreference.SECONDARY_PREFERRED`
    - `ReadPreference.NEAREST`

- `readPreferenceTags` - Specifies the tags document as a comma-separated list of colon-separated key-value pairs.

- `replicaSet` - Specifies the name of the replica set, if the mongod is a member of a replica set.

- `retryWrites` - Enable retryable writes.

- `serializeFunctions` - Serialize functions on any object. Default: `false`.

- `socketTimeoutMS` - The time in milliseconds to attempt a send or receive on a socket before the attempt times out. Default: `360000`.

- `tls` - Enables or disables TLS/SSL for the connection. Default: `false`.

- `tlsAllowInvalidCertificates` - Bypasses validation of the certificates presented by the mongod/mongos instance. Default: `false`.

- `tlsCAFile` - Specifies the location of a local .pem file that contains the root certificate chain from the Certificate Authority.

- `tlsCertificateKeyFile` - Specifies the location of a local .pem file that contains the client's TLS/SSL certificate and key.

- `tlsCertificateKeyFilePassword` - Specifies the password to decrypt the `tlsCertificateKeyFile`.

- `url` - Connection url where the connection is performed. Please note that other data source options will override parameters set from url.

- `username` - Database username.

- `writeConcern` - A MongoDB WriteConcern, which describes the level of acknowledgement requested from MongoDB for write operations.

Additional options can be added to the `extra` object and will be passed directly to the client library. See more in `mongodb`'s documentation for [Connection Options](https://mongodb-node.netlify.app/docs/drivers/node/current/connect/connection-options/).

## Defining entities and columns

Defining entities and columns is almost the same as in relational databases,
the main difference is that you must use `@ObjectIdColumn`
instead of `@PrimaryColumn` or `@PrimaryGeneratedColumn`.

Simple entity example:

```typescript
import { ObjectId } from "mongodb"
import { Entity, ObjectIdColumn, Column } from "typeorm"

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

Since MongoDB stores objects and objects inside objects (or documents inside documents), you can do the same in TypeORM:

```typescript
import { ObjectId } from "mongodb"
import { Entity, ObjectIdColumn, Column } from "typeorm"

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
import { ObjectId } from "mongodb"
import { Entity, ObjectIdColumn, Column } from "typeorm"

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

await myDataSource.manager.save(user)
```

The following document will be saved in the database:

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

Both `MongoEntityManager` and `MongoRepository` contain a lot of useful MongoDB-specific methods:

### `createCursor`

Create a cursor for a query that can be used to iterate over results from MongoDB.

### `createEntityCursor`

Create a cursor for a query that can be used to iterate over results from MongoDB.
This returns a modified version of the cursor that transforms each result into Entity models.

### `aggregate`

Execute an aggregation framework pipeline against the collection.

### `bulkWrite`

Perform a bulkWrite operation without a fluent API.

### `count`

Count the number of matching documents in the db to a query.

### `countDocuments`

Count the number of matching documents in the db to a query.

### `createCollectionIndex`

Create an index on the db and collection.

### `createCollectionIndexes`

Create multiple indexes in the collection. Index specifications are defined at [createIndexes](http://docs.mongodb.org/manual/reference/command/createIndexes/).

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

Retrieve all the indexes of the collection.

### `collectionIndexExists`

Retrieve if an index exists on the collection

### `collectionIndexInformation`

Retrieve this collection's index info.

### `initializeOrderedBulkOp`

Initiate an In order bulk write operation; operations will be serially executed in the order they are added, creating a new operation for each switch in types.

### `initializeUnorderedBulkOp`

Initiate an Out of order batch write operation. All operations will be buffered into insert/update/remove commands executed out of order.

### `insertMany`

Insert an array of documents into MongoDB.

### `insertOne`

Insert a single document into MongoDB.

### `isCapped`

Return if the collection is a capped collection.

### `listCollectionIndexes`

Get the list of all indexes information for the collection.

### `parallelCollectionScan`

Return N number of parallel cursors for a collection allowing parallel reading of the entire collection. There are no ordering guarantees for returned results

### `reIndex`

Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.

### `rename`

Change the name of an existing collection.

### `replaceOne`

Replace a document on MongoDB.

### `updateMany`

Update multiple documents within the collection based on the filter.

### `updateOne`

Update a single document within the collection based on the filter.
