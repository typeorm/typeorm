# Delete using Query Builder

* [Delete using Query Builder](#delete-using-query-builder)
    * [`Delete`](#delete)
    * [`Soft-Delete`](#soft-delete)
    * [`Restore-Soft-Delete`](#restore-soft-delete)

### `Delete`

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

This is the most efficient way in terms of performance to delete entities from your database.

---

### `Soft-Delete`

Applying Soft Delete to QueryBuilder

```typescript
import {createConnection} from "typeorm";
import {Entity} from "./entity";

createConnection(/*...*/).then(async connection => {

    await connection
      .getRepository(Entity)
      .createQueryBuilder()
      .softDelete()

}).catch(error => console.log(error));
```

### `Restore-Soft-Delete`

Alternatively, You can recover the soft deleted rows by using the `restore()` method:

```typescript
import {createConnection} from "typeorm";
import {Entity} from "./entity";

createConnection(/*...*/).then(async connection => {

    await connection
      .getRepository(Entity)
      .createQueryBuilder()
      .restore()

}).catch(error => console.log(error));
```
