# Migrations

* [How migrations work](#how-migrations-work)
* [Creating a new migration](#creating-a-new-migration)
* [Running and reverting migrations](#running-and-reverting-migrations)
* [Generating migrations](#generating-migrations)
* [Using migration API to write migrations](#using-migration-api-to-write-migrations)

## How migrations work

Once you get into production you'll need to synchronize model changes into the database.
Typically it is unsafe to use `synchronize: true` for schema synchronization on production once
you get data in your database. Here is where migrations come to help.

A migration is just a single file with sql queries to update a database schema
and apply new changes to an existing database.

Let's say you already have a database and a post entity:

```typescript
@Entity()
export class Post {
    
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    title: string;
    
    @Column()
    text: string;
    
}
```

And your entity worked in production for months without any changes.
You have thousands posts in your database.

Now you need to make a new release and rename `title` to `name`.
What would you do? 

You need to create a new migration with the following sql query (postgres dialect):

```sql
ALTER TABLE "post" ALTER COLUMN "title" RENAME TO "name";
```

Once you run this sql query your database schema is ready to work with your new codebase.
TypeORM provides a place where you can write such sql queries and run them when needed.
This place is called "migrations".

## Creating a new migration

Before creating a new migration you need to setup your connection options properly:

```json
{
    "type": "mysql",
    "host": "localhost",
    "port": 3306,
    "username": "test",
    "password": "test",
    "database": "test",
    "entities": ["entity/*.js"],
    "migrationsTableName": "custom_migration_table",
    "migrations": ["migration/*.js"],
    "cli": {
        "migrationsDir": "migration"
    }
}
```

Here we setup three options:
* `"migrationsTableName": "migrations"` - Specify this option only if you need migration table name to be different from `"migrations"`.
* `"migrations": ["migration/*.js"]` - indicates that typeorm must load migrations from the given "migration" directory.
* `"cli": { "migrationsDir": "migration" }` - indicates that the CLI must create new migrations in the "migration" directory.

Once you setup connection options you can create a new migration using CLI:

```
typeorm migration:create -n PostRefactoring
```

To use CLI commands, you need to install typeorm globally (`npm i typeorm -g`).
Also, make sure your local typeorm version matches the global version.
Learn more about the [TypeORM CLI](./using-cli.md).

Here, `PostRefactoring` is the name of the migration - you can specify any name you want.
After you run the command you can see a new file generated in the "migration" directory 
named `{TIMESTAMP}-PostRefactoring.ts` where `{TIMESTAMP}` is the current timestamp when the migration was generated.
Now you can open the file and add your migration sql queries there.

You should see the following content inside your migration:

```typescript
import {MigrationInterface, QueryRunner} from "typeorm";

export class PostRefactoringTIMESTAMP implements MigrationInterface {
    
    async up(queryRunner: QueryRunner): Promise<any> {
        
    }

    async down(queryRunner: QueryRunner): Promise<any> { 
        
    }

    
}
```

There are two methods you must fill with your migration code: `up` and `down`.
`up` has to contain the code you need to perform the migration.
`down` has to revert whatever `up` changed.
`down` method is used to revert the last migration.

Inside both `up` and `down` you have a `QueryRunner` object.
All database operations are executed using this object.
Learn more about [query runner](./query-runner.md).

Let's see what the migration looks like with our `Post` changes:

```typescript
import {MigrationInterface, QueryRunner} from "typeorm";

export class PostRefactoringTIMESTAMP implements MigrationInterface {
    
    async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "post" ALTER COLUMN "title" RENAME TO "name"`);
    }

    async down(queryRunner: QueryRunner): Promise<any> { 
        await queryRunner.query(`ALTER TABLE "post" ALTER COLUMN "name" RENAME TO "title"`); // reverts things made in "up" method
    }

    
}
```

## Running and reverting migrations

Once you have a migration to run on production, you can run them using a CLI command:

```
typeorm migration:run
```

This command will execute all pending migrations and run them in a sequence ordered by their timestamps.
This means all sql queries written in the `up` methods of your created migrations will be executed.
That's all! Now you have your database schema up-to-date.

If for some reason you want to revert the changes, you can run:

```
typeorm migration:revert
```

This command will execute `down` in the latest executed migration. 
If you need to revert multiple migrations you must call this command multiple times. 

## Generating migrations

TypeORM is able to automatically generate migration files with schema changes you made.

Let's say you have a `Post` entity with a `title` column, and you have changed the name `title` to `name`.
You can run following command:

```
typeorm migration:generate -n PostRefactoring
```

And it will generate a new migration called `{TIMESTAMP}-PostRefactoring.ts` with the following content:

```typescript
import {MigrationInterface, QueryRunner} from "typeorm";

export class PostRefactoringTIMESTAMP implements MigrationInterface {
    
    async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "post" ALTER COLUMN "title" RENAME TO "name"`);
    }

    async down(queryRunner: QueryRunner): Promise<any> { 
        await queryRunner.query(`ALTER TABLE "post" ALTER COLUMN "name" RENAME TO "title"`);
    }

    
}
```

See, you don't need to write the queries on your own. 
The rule of thumb for generating migrations is that you generate them after "each" change you made to your models.

## Using migration API to write migrations

In order to use an API to change a database schema you can use `QueryRunner`.
`QueryRunner` API is subject to change in the next TypeORM version. 
Expect to see documentation soon.
