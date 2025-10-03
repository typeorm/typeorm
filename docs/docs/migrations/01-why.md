# How migrations work?

Once you get into production you'll need to synchronize model changes into the database.
Typically, it is unsafe to use `synchronize: true` for schema synchronization on production once
you get data in your database. Here is where migrations come to help.

A migration is just a single file with sql queries to update a database schema
and apply new changes to an existing database.

Let's say you already have a database and a post entity:

```typescript
import { Entity, Column, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    text: string
}
```

And your entity worked in production for months without any changes.
You have thousands of posts in your database.

Now you need to make a new release and rename `title` to `name`.
What would you do?

You need to create a new migration with the following SQL query (postgres dialect):

```sql
ALTER TABLE "post" ALTER COLUMN "title" RENAME TO "name";
```

Once you run this SQL query your database schema is ready to work with your new codebase.
TypeORM provides a place where you can write such sql queries and run them when needed.
This place is called "migrations".
