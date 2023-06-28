# What is a system-versioned temporal table?

A system-versioned temporal table is a type of user table designed to keep a full history of data changes, allowing easy point-in-time analysis. This type of temporal table is referred to as a system-versioned temporal table because the period of validity for each row is managed by the database engine.

## How to use versioning

In TypeORM you can enable this feature with the entity option `versioning`.

## Supported drivers

Right now MariaDB and SQL Server are supported.

Example:

```typescript
import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity({ versioning: true })
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}
```

Example of how to work with such an entity:

```typescript
const user = new User()
user.name = "foo"
await user.save()

// store the current date
const timestamp = new Date()
let result = await User.findOneBy({ id: 1 })
// user name is "foo"

user.name = "bar"
await user.save()

result = await User.findOneBy({ id: 1 })
// user name is "bar"

// get dataset before update (from history)
result = await User.findOneBy({ id: 1 }, timestamp)
// user name is "foo"
```

It works also with deleted datasets. Example:

```typescript
const userOne = new User()
userOne.name = "foo"
await userOne.save()

const userTwo = new User()
userTwo.name = "bar"
await userTwo.save()

// store the current date
const timestamp = new Date()
let results = await User.find()
// [ User { id: 1, name: 'foo' }, User { id: 2, name: 'bar' } ]

await userTwo.remove()

results = await User.find()
// [ User { id: 1, name: 'foo' } ]

// get datasets before deleting (from history)
results = await User.find({ timestamp })
// [ User { id: 1, name: 'foo' }, User { id: 2, name: 'bar' } ]
```
