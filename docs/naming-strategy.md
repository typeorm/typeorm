# Naming strategy

* Specify custom table name
* Specify custom column name
* Specify custom foreign column name
* Specify custom many-to-many junction table name
* Creating your own `NamingStrategy`

## Creating your own `NamingStrategy`

If you defined your connection options in the `ormconfig` file,
then you can simply use it and override it following way:

```typescript
import {createConnection, getConnectionOptions} from "typeorm";
import {MyNamingStrategy} from "./logger/MyNamingStrategy";

// getConnectionOptions will read options from your ormconfig file
// and return it in connectionOptions object
// then you can simply append additional properties to it
getConnectionOptions().then(connectionOptions => {
    return createConnection(Object.assign(connectionOptions, {
        namingStrategy: new MyNamingStrategy()
    }))
});
```

Naming Strategy is a subject to change.
Expect detailed documentation once its API gets stabilized.