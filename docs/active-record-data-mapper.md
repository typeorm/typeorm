# Active Record vs Data Mapper

* [What is Active Record?](#what-is-active-record)
* [What is Data Mapper?](#what-is-data-mapper)
* [Which one should I choose?](#which-one-should-i-choose)

## What is Active Record?

In TypeORM you can use both Active Record and Data Mapper patterns.

Using Active Record approach you define all your query methods inside model itself, 
 and you save, remove, load objects using model methods. 

Simply said active record is an approach to access your database within your models. 
You can read more about active record on [wikipedia](https://en.wikipedia.org/wiki/Active_record_pattern).

Example:
 
```typescript
import {BaseEntity, Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class User extends BaseEntity {
       
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    firstName: string;
    
    @Column()
    lastName: string;
    
    @Column()
    isActive: boolean;

}
```

All active-record entities must extend `BaseEntity` class which provides methods to work with entity.
Example how to work with such entity:

```typescript

// example how to save AR entity
const user = new User();
user.firstName = "Timber";
user.lastName = "Saw";
user.isActive = true;
await user.save();

// example how to remove AR entity
await user.remove();

// example how to load AR entities
const users = await User.find({ skip: 2, take: 5 });
const newUsers = await User.find({ isActive: true });
const timber = await User.findOne({ firstName: "Timber", lastName: "Saw" });
```

`BaseEntity` has most of methods standard `Repository` has.
Most of times you don't need to use `Repository` or `EntityManager` with active record entities.

Now lets say we want to create a function that returns users by first and last names. 
We can create such function as a static method in a `User` class:

```typescript
import {BaseEntity, Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class User extends BaseEntity {
       
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    firstName: string;
    
    @Column()
    lastName: string;
    
    @Column()
    isActive: boolean;
    
    static findByName(firstName: string, lastName: string) {
        return this.createQueryBuilder("user")
            .where("user.firstName = :firstName", { firstName })
            .andWhere("user.lastName = :lastName", { lastName })
            .getMany();
    }

}
```

And use it just like other methods:

```typescript
const timber = await User.findByName("Timber", "Saw");
```

## What is Data Mapper?

In TypeORM you can use both Active Record and Data Mapper patterns.

Using Data Mapper approach you define all your query methods separate classes called "repositories", 
and you save, remove, load objects using repositories. 
In data mapper your entities are very dumb - they just define their properties and may have some "dummy" methods.  

Simply said data mapper is an approach to access your database within repositories instead of models. 
You can read more about data mapper on [wikipedia](https://en.wikipedia.org/wiki/Data_mapper_pattern).

Example:
 
```typescript
import {BaseEntity, Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class User {
       
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    firstName: string;
    
    @Column()
    lastName: string;
    
    @Column()
    isActive: boolean;

}
```
Example how to work with such entity:

```typescript
const userRepository = connection.getRepository(User);

// example how to save DM entity
const user = new User();
user.firstName = "Timber";
user.lastName = "Saw";
user.isActive = true;
await userRepository.save(user);

// example how to remove DM entity
await userRepository.remove(user);

// example how to load DM entities
const users = await userRepository.find({ skip: 2, take: 5 });
const newUsers = await userRepository.find({ isActive: true });
const timber = await userRepository.findOne({ firstName: "Timber", lastName: "Saw" });
```

Now lets say we want to create a function that returns users by first and last names. 
We can create such function in a "custom repository".

```typescript
import {EntityRepository, Repository} from "typeorm";
import {User} from "../entity/User";

@EntityRepository()
export class UserRepository extends Repository<User> {
       
    findByName(firstName: string, lastName: string) {
        return this.createQueryBuilder("user")
            .where("user.firstName = :firstName", { firstName })
            .andWhere("user.lastName = :lastName", { lastName })
            .getMany();
    }

}
```

And use it this way:

```typescript
const userRepository = connection.getCustomRepository(UserRepository);
const timber = await userRepository.findByName("Timber", "Saw");
```

For more information about custom repositories refer [this documentation](./entity-manager-and-repository.md#custom-repositories).

## Which one should I choose?

Decision is up to you.
Both strategies have their own cons and pros.

One thing we should always keep in mind in software development is how we are going to maintain it.
`Data Mapper` approach helps you to keep maintainability of your software in a bigger apps more effective.
`Active record` approach helps you to keep things simple which work good in a small apps.
 And simplicity is always a key to better maintainability.