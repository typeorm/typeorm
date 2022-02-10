# What is EntityManager

Using `EntityManager` you can manage (insert, update, delete, load, etc.) any entity. 
EntityManager is just like a collection of all entity repositories in a single place.
 
You can access the entity manager via DataSource's manager.
Example how to use it:
 
```typescript
import {Manager} from "./config/DataSource";
import {User} from "./entity/User";

const entityManager = Manager;
const user = await entityManager.findOne(User, 1);
user.name = "Umed";
await entityManager.save(user);
```
