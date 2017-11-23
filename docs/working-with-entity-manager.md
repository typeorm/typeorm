# What is EntityManager

Using `EntityManager` you can manage (insert, update, delete, load, etc.) any entity. 
EntityManager is just like a collection of all entity repositories in a single place.
 
You can access the entity manager via `getManager()` or from `Connection`.
Example how to use it:
 
```typescript
import {getManager} from "typeorm";
import {User} from "./entity/User";

const entityManager = getManager(); // you can also get it via getConnection().manager
const user = await entityManager.findOne(User, 1);
user.name = "Umed";
await entityManager.save(user);
```
