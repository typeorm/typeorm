# Custom repositories

You can create a custom repository which should contain methods to work with your database.
Usually custom repositories are created for a single entity and contains its specific queries.
For example, let's say we want to have a method called `findByName(firstName: string, lastName: string)`
which will search for users by a given first and last names. 
The best place for this method is in `Repository`,
so we could call it like `userRepository.findByName(...)`.
You can achieve this using custom repositories.

There are several ways how custom repositories can be created.

* [Custom repository extends standard Repository](#custom-repository-extends-standard-repository) 
* [Custom repository extends standard AbstractRepository](#custom-repository-extends-standard-abstractrepository) 
* [Custom repository without extends](#custom-repository-without-extends)
* [Using custom repositories in transactions](#using-custom-repositories-in-transactions-or-why-custom-repositories-cannot-be-services)

## Custom repository extends standard Repository

The first way to create a custom repository is to extend `Repository`.
Example:

```typescript
import {EntityRepository, Repository} from "typeorm";
import {User} from "../entity/User";

@EntityRepository(User)
export class UserRepository extends Repository<User> {

    findByName(firstName: string, lastName: string) {
        return this.findOne({ firstName, lastName });
    }

}
```

Then you can use it this way:

```typescript
import {getCustomRepository} from "typeorm";
import {UserRepository} from "./repository/UserRepository";

const userRepository = getCustomRepository(UserRepository); // or connection.getCustomRepository or manager.getCustomRepository()
const user = userRepository.create(); // same as const user = new User();
user.firstName = "Timber";
user.lastName = "Saw";
await userRepository.save(user);

const timber = await userRepository.findByName("Timber", "Saw");
```

As you can see you can "get" the repository using `getCustomRepository`
and you can access any method created inside it and any method in the standard entity repository.

## Custom repository extends standard AbstractRepository

The second way to create a custom repository is to extend `AbstractRepository`:

```typescript
import {EntityRepository, AbstractRepository} from "typeorm";
import {User} from "../entity/User";

@EntityRepository(User)
export class UserRepository extends AbstractRepository<User> {

    createAndSave(firstName: string, lastName: string) {
        const user = new User();
        user.firstName = firstName;
        user.lastName = lastName;
        return this.manager.save(user);
    }

    findByName(firstName: string, lastName: string) {
        return this.repository.findOne({ firstName, lastName });
    }

}
```

Then you can use it this way:

```typescript
import {getCustomRepository} from "typeorm";
import {UserRepository} from "./repository/UserRepository";

const userRepository = getCustomRepository(UserRepository); // or connection.getCustomRepository or manager.getCustomRepository()
await userRepository.createAndSave("Timber", "Saw");
const timber = await userRepository.findByName("Timber", "Saw");
```

The difference between this type of repository and the previous one is that it does not expose all the methods `Repository` has.
`AbstractRepository` does not have any public methods, 
it only has protected methods, like `manager` and `repository`, which you can use in your own
public methods.
Extending `AbstractRepository` is useful if you don't want to expose all methods the standard `Repository` has to the public.

## Custom repository without extends

The third way to create a repository is to not extend anything, 
but define a constructor which always accepts an entity manager instance:

```typescript
import {EntityRepository, Repository, EntityManager} from "typeorm";
import {User} from "../entity/User";

@EntityRepository()
export class UserRepository {

    constructor(private manager: EntityManager) {
    }

    createAndSave(firstName: string, lastName: string) {
        const user = new User();
        user.firstName = firstName;
        user.lastName = lastName;
        return this.manager.save(user);
    }

    findByName(firstName: string, lastName: string) {
        return this.manager.findOne(User, { firstName, lastName });
    }

}
```

Then you can use it this way:

```typescript
import {getCustomRepository} from "typeorm";
import {UserRepository} from "./repository/UserRepository";

const userRepository = getCustomRepository(UserRepository); // or connection.getCustomRepository or manager.getCustomRepository()
await userRepository.createAndSave("Timber", "Saw");
const timber = await userRepository.findByName("Timber", "Saw");
```

This type of repository does not extend anything - you only need to define a constructor
which must accept `EntityManager`. Then you can use it everywhere in your repository methods.
Also, this type of repository is not bound to a specific entity,
thus, you can operate with multiple entities inside them. 

## Using custom repositories in transactions or why custom repositories cannot be services

Custom repositories cannot be services, 
because there isn't a single instance of a custom repository (just like regular repositories or entity manager) in the app.
Besides the fact that there can be multiple connections in your app (where entity manager and repositories are different)
repositories and managers are different in transactions as well. 
For example:

```typescript
await connection.transaction(async manager => {
    // in transactions you MUST use manager instance provided by a transaction,
    // you cannot use global managers, repositories or custom repositories
    // because this manager is exclusive and transactional
    // and if let's say we would do custom repository as a service
    // it has a "manager" property which should be unique instance of EntityManager
    // but there is no global EntityManager instance and cannot be
    // thats why custom managers are specific to each EntityManager and cannot be services.
    // this also opens opportunity to use custom repositories in transactions without any issues:
    
    const userRepository = manager.getCustomRepository(UserRepository); // DONT USE GLOBAL getCustomRepository here!
    await userRepository.createAndSave("Timber", "Saw");
    const timber = await userRepository.findByName("Timber", "Saw");
});
```
