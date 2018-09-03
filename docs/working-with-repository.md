# What is Repository

`Repository` is just like `EntityManager` but its operations are limited to a concrete entity.

You can access repository via `getRepository(Entity)`, 
`Connection#getRepository`, or `EntityManager#getRepository`.
Example:
 
```typescript
import { getManager, EntityRepository, Repository } from "typeorm";
import {User} from "./entity/User";


 async getData() {

        // Instanciates repository and gets all data
        const data = await this._repository.find({  is_active: "1"});

        return _.sortBy(data, 'User_name');
}

async getByUserId(id: number) {

        // Instanciates repository and gets specific data
        var data = await this._repository.findOne({ is_active: "1", id: id });

        return data;
}

// save data into database by id
async saveData(data: health_systems) {
        //creates the users into the repository instance
        const state = this._repository.create(data);

        //save (or) insert the data into the db
        var data = await this._repository.save(state);

        return data;
}


 //delete the data by id
async deleteData(data: User) {

        //soft deleting the data
        data.is_active = "0";

        //creates the users into the repository instance
        const healthSystem = this._repository.create(data);

        //save (or) insert the data into the db
        return this._repository.save(healthSystem);;
}
    
    
```

There are 3 types of repositories:
* `Repository` - Regular repository for any entity.
* `TreeRepository` - Repository, extensions of `Repository` used for tree-entities 
(like entities marked with `@Tree` decorator). 
Has special methods to work with tree structures.
* `MongoRepository` - Repository with special functions used only with MongoDB.
