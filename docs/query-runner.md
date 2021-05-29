# Working with Query Runner

* [What is `QueryRunner`](#what-is-queryrunner)
* [Creating a queryRunner](#creating-a-new-queryrunner)
* [Using queryRunner](#using-queryrunner)
* [Working with `QueryRunner`](#working-with-queryrunner)
    
## What is `QueryRunner`

Your interaction with the database is only possible once you setup a connection.
TypeORM's `Connection` does not setup a database connection as it might seem, instead it sets up a connection pool.
If you are interested in a real database connection, you should use `QueryRunner`.
Each instance of `QueryRunner` is a separate isolated database connection. Using query runners you can control your queries to execute using single database connection and manually control your database transaction.

## Creating a new queryRunner

To create a new instance of `QueryRunner` you should first create a connection pool, in any of the ways described on the `Connection` documentation. Once a connection has established, use the `createQueryRunner` function to create an isolated connection.

`createQueryRunner` Creates a query runner used to perform queries on a single database connection.
 

```typescript
import { getConnection, QueryRunner } from 'typeorm';
// can be used once createConnection is called and is resolved
const connection: Connection = getConnection();

const queryRunner: QueryRunner = connection.createQueryRunner();
```
## Using queryRunner

After creating an instance of `QueryRunner` use connect to activate the connection.

```typescript
import { getConnection, QueryRunner } from 'typeorm';
// can be used once createConnection is called and is resolved
const connection: Connection = getConnection();

const queryRunner: QueryRunner = connection.createQueryRunner();

await queryRunner.connect(); // performs connection
```

Since the `QueryRunner` is used to manage an isolated database connection, make sure to release it when it is not needed anymore to make it available to the connection pool again. After connection is released it is not possible to use the query runner methods.

## Working with `QueryRunner`

Once you set your queryRunner up, you can use it with an interface similar to the `Connection` interface:

```typescript
import { getConnection, QueryRunner } from 'typeorm';
import { User } from "../entity/User";

export class UserController {


    @Get("/users")
    getAll(): Promise<User[]> {
        // can be used once createConnection is called and is resolved
        const connection: Connection = getConnection();

        const queryRunner: QueryRunner = connection.createQueryRunner();

        await queryRunner.connect(); // performs connection

        const users = await queryRunner.manager.find(User);
        
        await queryRunner.release(); // release connection
		
        return users;
    }

}
```
