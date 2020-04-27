# Transactions

- [Creating and using transactions](#creating-and-using-transactions)
	- [Specifying Isolation Levels](#specifying-isolation-levels)
- [Transaction decorators](#transaction-decorators)
- [Using `QueryRunner` to create and control state of single database connection](#using-queryrunner-to-create-and-control-state-of-single-database-connection)

## Creating and using transactions

Transactions are created using `Connection` or `EntityManager`. 
Examples:

```typescript
import {getConnection} from "typeorm";

await getConnection().transaction(async transactionalEntityManager => {
    
});
```

or 

```typescript
import {getManager} from "typeorm";

await getManager().transaction(async transactionalEntityManager => {
    
});
```

Everything you want to run in a transaction must be executed in a callback:

```typescript
import {getManager} from "typeorm";

await getManager().transaction(async transactionalEntityManager => {
    await transactionalEntityManager.save(users);
    await transactionalEntityManager.save(photos);
    // ...
});
```

The most important restriction when working in an transaction is, to **ALWAYS** use the provided instance of entity manager - 
`transactionalEntityManager` in this example.
If you'll use global manager (from `getManager` or manager from connection) you'll have problems.
You also cannot use classes which use global manager or connection to execute their queries.
All operations **MUST** be executed using the provided transactional entity manager.

### Specifying Isolation Levels

Specifying the isolation level for the transaction can be done by supplying it as the first parameter:

```typescript
import {getManager} from "typeorm";

await getManager().transaction("SERIALIZABLE", transactionalEntityManager => {
    
});
```

Isolation level implementations are *not* agnostic across all databases.

The following database drivers support the standard isolation levels (`READ UNCOMMITTED`, `READ COMMITTED`, `REPEATABLE READ`, `SERIALIZABLE`):
* MySQL
* Postgres
* SQL Server

**SQlite** defaults transactions to `SERIALIZABLE`, but if *shared cache mode* is enabled, a transaction can use the `READ UNCOMMITTED` isolation level.

**Oracle** only supports the `READ COMMITTED` and `SERIALIZABLE` isolation levels.


## Transaction decorators

There are a few decorators which can help you organize your transactions - 
`@Transaction`, `@TransactionManager` and `@TransactionRepository`.

`@Transaction` wraps all its execution into a single database transaction,
and `@TransactionManager` provides a transaction entity manager which must be used to execute queries inside this transaction:

```typescript
@Transaction()
save(@TransactionManager() manager: EntityManager, user: User) {
    return manager.save(user);
}
```

with isolation level:

```typescript
@Transaction({ isolation: "SERIALIZABLE" })
save(@TransactionManager() manager: EntityManager, user: User) {
    return manager.save(user);
}
```

You **must** always use the manager provided by `@TransactionManager`.

However, you can also inject transaction repository (which uses transaction entity manager under the hood), 
using `@TransactionRepository`:

```typescript
@Transaction()
save(user: User, @TransactionRepository(User) userRepository: Repository<User>) {
    return userRepository.save(user);    
}
``` 

You can inject both built-in TypeORM's repositories like `Repository`, `TreeRepository` and `MongoRepository` 
(using `@TransactionRepository(Entity) entityRepository: Repository<Entity>`) 
or custom repositories (classes extending the built-in TypeORM's repositories classes and decorated with `@EntityRepository`) 
using the `@TransactionRepository() customRepository: CustomRepository`.

## Using `QueryRunner` to create and control state of single database connection

`QueryRunner` provides a single database connection.
Transactions are organized using query runners. 
Single transactions can only be established on a single query runner.
You can manually create a query runner instance and use it to manually control transaction state.
Example:

```typescript
import {getConnection} from "typeorm";

// get a connection and create a new query runner
const connection = getConnection();
const queryRunner = connection.createQueryRunner();

// establish real database connection using our new query runner
await queryRunner.connect();

// now we can execute any queries on a query runner, for example:
await queryRunner.query("SELECT * FROM users");

// we can also access entity manager that works with connection created by a query runner:
const users = await queryRunner.manager.find(User);

// lets now open a new transaction:
await queryRunner.startTransaction();

try {
    
    // execute some operations on this transaction:
    await queryRunner.manager.save(user1);
    await queryRunner.manager.save(user2);
    await queryRunner.manager.save(photos);
    
    // commit transaction now:
    await queryRunner.commitTransaction();
    
} catch (err) {
    
    // since we have errors let's rollback changes we made
    await queryRunner.rollbackTransaction();
    
} finally {
    
    // you need to release query runner which is manually created:
    await queryRunner.release();
}
```

There are 3 methods to control transactions in `QueryRunner`:


* `startTransaction` - starts a new transaction inside the query runner instance.
* `commitTransaction` - commits all changes made using the query runner instance.
* `rollbackTransaction` - rolls all changes made using the query runner instance back.

Learn more about [Query Runner](./query-runner.md).
