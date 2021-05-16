# What is Repository

`Repository` is just like `EntityManager` but its operations are limited to a concrete entity.

You can access repository via `getRepository(Entity)`, 
`Connection#getRepository`, or `EntityManager#getRepository`.
Example:
 
```typescript
import {getRepository} from "typeorm";
import {User} from "./entity/User";

const userRepository = getRepository(User); // you can also get it via getConnection().getRepository() or getManager().getRepository()
const user = await userRepository.findOne(1);
user.name = "Umed";
await userRepository.save(user);
```

There are 3 types of repositories:
* `Repository` - Regular repository for any entity.
* `TreeRepository` - Repository, extensions of `Repository` used for tree-entities 
(like entities marked with `@Tree` decorator). 
Has special methods to work with tree structures.
* `MongoRepository` - Repository with special functions used only with MongoDB.
