# DynamoDB

-   [DynamoDB support](#dynamodb-support)
-   [Defining entities and columns](#defining-entities-and-columns)
-   [Using `DynamoEntityManager` and `DynamoRepository`](#using-dynamoentitymanager-and-dynamorepository)
-   [Local testing](#local-testing)
-   [Deploy to AWS](#deploy-to-aws)
-   [Using the `GlobalSecondaryIndex` annotation](#using-the-globalsecondaryindex-annotation)

## DynamoDB support
TypeORM DynamoDB support is in BETA!
Most of TypeORM functionality is RDBMS-specific,
This page contains all DynamoDB-specific functionality documentation.

## Defining entities and columns

Defining entities and columns is almost the same as in relational databases,

Simple entity example:

```typescript
import { Entity, PrimaryColumn, Column } from "typeorm"

@Entity()
export class User {
    @PrimaryColumn()
    id: string

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
    name: "dynamodb",
    type: "dynamodb"
})
```

## Using `DynamoEntityManager` and `DynamoRepository`

You can use the majority of methods inside the `EntityManager` (except for RDBMS-specific, like `query` and `transaction`).

Put by id

```typescript
const repository = new PersonRepository(Person, datasource.createEntityManager())
const person1 = new Person()
person1.id = 'a7abb5c6-f0a7-4ffe-bfc7-6eaa8644f451'
person1.firstname = 'John'
person1.lastname = 'Doe'
await repository.put(person1)

const person2 = new Person()
person2.id = '73cd2d1b-2251-47a9-b137-58c1ffca4cfd'
person2.firstname = 'Jane'
person2.lastname = 'Doe'
await repository.put(person2)
```

Get by primary key:

```typescript
const repository = new PersonRepository(Person, datasource.createEntityManager())
const id = 'a7abb5c6-f0a7-4ffe-bfc7-6eaa8644f451'
const person = await repository.get(id)
```

Finding by other columns requires a Global Secondary Index.  In this example
we have a global secondary index with name "nameIndex" that we are using to query by
firstname and lastname.

```typescript
const repository = new PersonRepository(Person, datasource.createEntityManager())
const people = await repository.find({
    index: 'nameIndex',
    where: {
        firstname: 'John',
        lastname: 'Doe'
    }
})
```

Scan will get all values from the database and does not use an index.
This method should be avoided as it is expensive.  It might be useful if you truly need to get all values.

```typescript
const repository = new PersonRepository(Person, datasource.createEntityManager())
const people = await repository.scan()
```

You can also get all values in a table as a stream.  Limit 500 is set by default.

```typescript
const repository = new PersonRepository(Person, datasource.createEntityManager())
const stream = await repository.streamAll()
```

Delete multiple.  Also uses an index.  This example would delete both John Doe and Jane Doe.

```typescript
const repository = new PersonRepository(Person, datasource.createEntityManager())
await repository.deleteAllBy({
    index: 'lastnameIndex',
    where: {
        lastname: 'Doe'
    }
})
```

putMany uses batchWrite to insert items in batches (25 per batch).  Batches are inserted in parallel.  8 threads are used by default but you can configure it to your needs.

```typescript
const repository = new PersonRepository(Person, datasource.createEntityManager())

const person1 = new Person()
person1.id = 'a7abb5c6-f0a7-4ffe-bfc7-6eaa8644f451'
person1.firstname = 'John'
person1.lastname = 'Doe'
await repository.put(person1)

const person2 = new Person()
person2.id = '73cd2d1b-2251-47a9-b137-58c1ffca4cfd'
person2.firstname = 'Jane'
person2.lastname = 'Doe'
await repository.put(person2)

await repository.putMany([person1, person2])
```

deleteMany also uses batchWrite

```typescript
const repository = new PersonRepository(Person, datasource.createEntityManager())
const person1Id = 'a7abb5c6-f0a7-4ffe-bfc7-6eaa8644f451'
const person2Id = '73cd2d1b-2251-47a9-b137-58c1ffca4cfd'
await repository.deleteMany([person1Id, person2Id])
```

batchRead and batchWrite methods can be called directly if need be.  Here we are fetching multiple records at once.

```typescript
const repository = new PersonRepository(Person, datasource.createEntityManager())
const keys = [{ id: 'a7abb5c6-f0a7-4ffe-bfc7-6eaa8644f451', id: '73cd2d1b-2251-47a9-b137-58c1ffca4cfd' }]
await repository.batchRead(keys)
```

updateExpression can be used to set or increment values in the database.

This example increments a loginCount.

```typescript
const repository = new PersonRepository(Person, datasource.createEntityManager())
await repository.updateExpression({
    addValues: {
      loginCount: 1
    },
    where: {
        id: 'a7abb5c6-f0a7-4ffe-bfc7-6eaa8644f451'
    }
})
```

There is a convenience method "add" that does the same as the above example.

```typescript
const repository = new PersonRepository(Person, datasource.createEntityManager())
await repository.add({
    values: {
      loginCount: 1
    },
    where: {
        id: 'a7abb5c6-f0a7-4ffe-bfc7-6eaa8644f451'
    }
})
```

This example sets age and increments loginCount.

```typescript
const repository = new PersonRepository(Person, datasource.createEntityManager())
await repository.updateExpression({
    setValues: {
        age: 25
    },
    addValues: {
      loginCount: 1
    },
    where: {
        id: 'a7abb5c6-f0a7-4ffe-bfc7-6eaa8644f451'
    }
})
```
## Local testing
You can run a local version of dynamodb using [localstack](https://github.com/localstack/localstack).
```shell
localstack start
```
You can view your local dynamodb database using dynamodb-admin
You'll need to set an environment variable to tell dynamodb-admin about your local dynamodb database:
```shell
export DYNAMO_ENDPOINT=http://localhost:4566
```
Then install and run dynamodb-admin
```shell
# install globally
npm install -g dynamodb-admin
# start dynamodb-admin
dynamodb-admin
# open http://localhost:8001 in your browser
```

### Creating tables locally
Pass "synchronize": true into your DataSource configuration the tables an indexes will be created automatically.

```typescript
// you most likely do not want to synchronize in real environments ... only local
const connection = new DataSource({
    name: 'dynamodb',
    type: 'dynamodb',
    syncrhonize: process.env.NODE_ENV === 'local'
})
```

## Deploy to AWS
COMING SOON!  A separate CDK project will be published that will read your entities and created the appropriate CDK constructs.

## Using the GlobalSecondaryIndex annotation
Indexing is super important with dynamodb.  Efficient queries save time and $$$!
In most cases if you are querying on columns other than the primary key you should use an index.

```typescript
import { Entity, PrimaryColumn, Column } from "typeorm"

@Entity()
@GlobalSecondaryIndex({ name: 'nameIndex', partitionKey: ['firstname', 'lastname'], sortKey: 'lastname' })
export class User {
    @PrimaryColumn()
    id: string

    @Column()
    firstName: string

    @Column()
    lastName: string
}
```

This above example will create a partition on firstname and lastname and sort your results by lastname.
You end up with an additional column in your table created automatically.
For example, let's say you have "John Doe" and "Jane Doe" ... the indexed column would look like this:

| id                                   | firstname | lastname | firstname#lastname |
|--------------------------------------|-----------|----------|--------------------|
| a7abb5c6-f0a7-4ffe-bfc7-6eaa8644f451 | John      | Doe      | John#Doe           |
| 73cd2d1b-2251-47a9-b137-58c1ffca4cfd | Jane      | Doe      | Jane#Doe           |

When you find using an index the indexed column will be used automatically.  Slick!

```typescript
// will match against the index column firstname#lastname: 'John#Doe'
const repository = new PersonRepository(Person, datasource.createEntityManager())
const people = await repository.find({
    index: 'nameIndex',
    where: {
        firstname: 'John',
        lastname: 'Doe'
    }
})
```

**Please note:** adding an index does NOT populate the indexed column for existing records.  Population happens whenever an item is "saved".  You will need to re-save existing records.

