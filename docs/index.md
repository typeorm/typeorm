# TypeORM

## What is TypeORM?

TypeORM is an [Object Relational Mapper](https://en.wikipedia.org/wiki/Object-relational_mapping) (ORM) 
for NodeJS written in
TypeScript that can be used with TypeScript or JavaScript (ES5, ES6, ES7).
Its goal to always support latest JavaScript features and provide features
that help you to develop any kind of applications that use database - from
small applications with a few tables to large scale enterprise applications.
TypeORM helps you to:

* automatically create in the database tables based on your models
* ability to transparently insert / update / delete to the database
your objects
* map your selections from tables to javascript objects and map table columns
to javascript object's properties
* create one-to-one, many-to-one, one-to-many, many-to-many relations between tables
* and much more...

TypeORM uses the Data Mapper pattern, unlike all other JavaScript ORMs that
currently exist, which means you can write loosely coupled, scalable,
maintainable applications with fewer problems.

The benefit of using TypeORM for the programmer is the ability to focus on
the business logic and worry about persistence only as a secondary problem.

TypeORM is highly influenced by other ORMs, such as [Hibernate](http://hibernate.org/orm/),
 [Doctrine](http://www.doctrine-project.org/) and [Entity Framework](https://www.asp.net/entity-framework).


## Features

Its all possible with TypeORM:

* write code in TypeScript or JavaScript
* works on node.js / browser / ionic / electron platforms
* supports mysql / mariadb / postgres / sqlite / sql server / oracle / websql / sqljs
* supports all data types your database support
* schema configuration using decorators / json / xml / yml files
* you produce performant, flexible, clean and maintainable code using it
* follows all possible best practices
* supports both Active Record and Data Mapper patterns
* you have Repository and Entity Manager
* you have multiple types of inheritance patterns
* you can use cascades for persistence
* you can use relations and produce a clean object relational model
* you can left / inner join and data
* you can create any complexity query using **QueryBuilder**
* transactions
* migrations
* automatic migrations generation
* replication
* connection pooling
* query caching
* CLI to simplify and automate your work with database

And more...

## Amazing ORM

With TypeORM your models will look like this:

```typescript
import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    age: number;

}
```

And your domain logic will look like this:

```typescript
const user = new User();
user.firstName = "Timber";
user.lastName = "Saw";
user.age = 25;
await repository.save(user);

const allUsers = await repository.find();
const firstUser = await repository.findOneById(1);
const timber = await repository.findOne({ firstName: "Timber", lastName: "Saw" });

await repository.remove(timber);
```

Alternatively, if you prefer to use `ActiveRecord` implementation, you can use it as well:

```typescript
import {Entity, PrimaryGeneratedColumn, Column, BaseEntity} from "typeorm";

@Entity()
export class User extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    age: number;

}
```

And your domain logic will look like this:

```typescript
const user = new User();
user.firstName = "Timber";
user.lastName = "Saw";
user.age = 25;
await user.save();

const allUsers = await User.find();
const firstUser = await User.findOneById(1);
const timber = await User.findOne({ firstName: "Timber", lastName: "Saw" });

await timber.remove();
```

TypeORM is one of the most powerful ORM ever exist, 
using it you can produce a high quality, declarative, maintainable, scalable and simply beautiful 
software the most productive way.

## Installation


1. Install npm package:

    `npm install typeorm --save`

2. You need to install `reflect-metadata` shim:

    `npm install reflect-metadata --save`

    and import it somewhere in the global place of your app (for example in `app.ts`):

    `import "reflect-metadata";`

3. You may need to install node typings:

    `npm install @types/node --save`

4. Install database driver:

    * for **MySQL** or **MariaDB**
    
        `npm install mysql --save`
    
    * for **PostgreSQL**
    
        `npm install pg --save`
    
    * for **SQLite**
    
        `npm install sqlite3 --save`
    
    * for **Microsoft SQL Server**
    
        `npm install mssql --save`
    
    * for **Oracle** (experimental)
    
        `npm install oracledb --save`
    
    Install only one of them, depending on what database you use.
    
    To make the Oracle driver work, you need to follow the installation instructions from 
    [their](https://github.com/oracle/node-oracledb) site.
    Oracle support is experimental at the moment and is not bug-free.
    Expect to see more stable Oracle support in a near future.

#### TypeScript configuration

Also make sure you are using version **2.3** or greater of the TypeScript compiler, 
and you have enabled the following settings in `tsconfig.json`:

```json
"emitDecoratorMetadata": true,
"experimentalDecorators": true,
```

You may also need to enable `es6` in the `lib` section of compiler options, or install `es6-shim` from `@types`.

## Quick Start

The quickest way to get started with TypeORM is to use its CLI commands to generate you a starter TypeORM project.
Quick start works only if you are using TypeORM in NodeJS. 
If you are using other platforms, proceed to [step-by-step guide](#step-by-step-guide).

First, install TypeORM globally:

```
npm install typeorm -g
```

Then go to the directory where you want to create a new project and run:

```
typeorm init --name MyProject --database mysql
```

Where `name` is the name of your project and `database` is the database you'll use.
`database` can be one of the following values: `mysql`, `mariadb`, `postgres`, `sqlite`, `mssql`, `oracle`,
`websql`, `mongodb`.

This command will generate you a new project in `MyProject` directory with following files:

```
MyProject
├── src              // place of your TypeScript code
│   ├── entity       // place where your entities (database models) will be stored
│   │   └── User.ts  // sample entity
│   ├── migration    // place where your migrations will be stored
│   └── index.ts     // start point of your application
├── .gitignore       // standard gitignore file
├── ormconfig.json   // your database and ORM configuration
├── package.json     // your node module dependencies
├── README.md        // simple readme file of your project
└── tsconfig.json    // TypeScript compiler options
```

> You can also run `typeorm init` on exist node project, but be careful - it may override some files you may already have.

Next step is to install new project dependencies:

```typescript
cd MyProject
npm install
```

While installation in the progress edit `ormconfig.json` file and put your own database connection configuration options in there:

```json
{
   "type": "mysql",
   "host": "localhost",
   "port": 3306,
   "username": "test",
   "password": "test",
   "database": "test",
   "synchronize": true,
   "logging": false,
   "entities": [
      "src/entity/**/*.ts"
   ],
   "migrations": [
      "src/migration/**/*.ts"
   ],
   "subscribers": [
      "src/subscriber/**/*.ts"
   ]
}
```

Particularly most of the time you'll only need to configure 
`host`, `username`, `password`, `database` and maybe `port` options.

Once you finish with configuration and all node modules are installed you can run your application:

```
npm start
```

That's it, your application should successfully run now and insert a new user into the database.
You can continue to work with this project and integrate other modules you need and start 
creating more entities. 

> You can generate even more advanced project with express installed by running
`typeorm init --name MyProject --database mysql --express` command.

## Step-by-Step Guide

What are you expecting from ORM when you are using it?
First of all you are expecting it will create a database tables for you
and find / insert / update / delete your data without 
having to write lot of hardly maintainable SQL queries.
This guide will show you how to setup TypeORM from scratch and make it to do what you are expecting from ORM.

## Create a model

Working with database starts from creating a tables. 
How do you tell TypeORM to create a database table?
Answer is - thought the models. 
Your models in your app - are your database tables.

For example, you have a `Photo` model:

```typescript
export class Photo {
    id: number;
    name: string;
    description: string;
    filename: string;
    views: number;
}
````

And you want to store photos in your database.
To store things in the database first you need a database table.
And database tables are created from your models.
Not all models, but only those you defined as *entities*. 
        
### Create an entity

*Entity* is your model decorated by `@Entity` decorator.
Database tables will be created for those models.
You work with entities everywhere with TypeORM.
You can load/insert/update/remove and perform other operations with them.

Let's make our `Photo` model as entity:

```typescript
import {Entity} from "typeorm";

@Entity()
export class Photo {
    id: number;
    name: string;
    description: string;
    filename: string;
    views: number;
    isPublished: boolean;
}
```

Now database table will be created for `Photo` entity and we'll be able to work with it anywhere in our app.
We have created a database table, however what table can exist without columns?
Let's create a few columns in our database table.
        
### Adding table columns

To add database columns you simply need to decorate entity's properties you want to make a columns
with a `@Column` decorator.

```typescript
import {Entity, Column} from "typeorm";

@Entity()
export class Photo {

    @Column()
    id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @Column()
    filename: string;

    @Column()
    views: number;

    @Column()
    isPublished: boolean;
}
```

Now `id`, `name`, `description`, `filename`, `views` and `isPublished` columns will be added to the `photo` table.
Column types in the database are inferred from the property types you used, e.g.
`number` will be converted into `integer`, `string` into `varchar`, `boolean` into `bool`, etc.
But you can use any column type your database support by implicitly specify a column type into `@Column` decorator.

We generated a database table with columns.
But there is one thing left.
Each database table must have a column with primary key. 

### Creating a primary column

Each entity **must** have at least one primary column.
This is requirement and you can't avoid it. 
To make a column a primary you need to use `@PrimaryColumn` decorator.

```typescript
import {Entity, Column, PrimaryColumn} from "typeorm";

@Entity()
export class Photo {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @Column()
    filename: string;

    @Column()
    views: number;

    @Column()
    isPublished: boolean;
}
```
   
### Creating an auto-increment / generated / sequence / identity column

Now, let's say you want your id column to be auto-generated (this is known as auto-increment / sequence / serial / generated identity column).
To do that you need to change your column's type to integer and set a `{ generated: true }` in your primary column's options:

```typescript
import {Entity, Column, PrimaryColumn} from "typeorm";

@Entity()
export class Photo {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @Column()
    filename: string;

    @Column()
    views: number;

    @Column()
    isPublished: boolean;
}
```

### Using the `@PrimaryGeneratedColumn` decorator

Now your photo's id will always be a generated, auto-increment value. 
Since creating a generated auto-incrementing primary column is a common task, 
there is a special decorator called `@PrimaryGeneratedColumn` to do the same. 
Let's use it instead:

```typescript
import {Entity, Column, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class Photo {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @Column()
    filename: string;

    @Column()
    views: number;

    @Column()
    isPublished: boolean;
}
```

### Column data types

Next, let's fix our data types. By default, string is mapped to a varchar(255)-like type (depending on the database type). 
Number is mapped to a integer-like type (depending on the database type). 
We don't want all our columns to be limited varchars or integers. 
Let's setup correct data types:

```typescript
import {Entity, Column, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class Photo {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        length: 100
    })
    name: string;

    @Column("text")
    description: string;

    @Column()
    filename: string;

    @Column("double")
    views: number;

    @Column()
    isPublished: boolean;
}
```

Column types are database-specific.
You can set any column type your database support.

### Creating a connection to the database

Now, when our entity is created, let's create an `index.ts` (or `app.ts` whatever you call it) file and set up our connection there:

```typescript
import "reflect-metadata";
import {createConnection} from "typeorm";
import {Photo} from "./entity/Photo";

createConnection({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    entities: [
        Photo
    ],
    synchronize: true,
    logging: false
}).then(connection => {
    // Here you can start to work with your entities
}).catch(error => console.log(error));
```

We are using MySQL in this example, but you can use any other supported database. 
To use another database, simply change the `type` in the options to the database type you are using: 
mysql, mariadb, postgres, sqlite, mssql, oracle,
websql, cordova or mongodb.
Also make sure to use your own host, port, username, password and database settings.

We added our Photo entity to the list of entities for this connection. 
Each entity you are using in your connection must be listed there.

Setting `synchronize` makes sure your entities will be synced with the database, every time you run the application.

### Loading all entities from the directory

Later, when we create more entities we need to add them to the entities in our configuration. 
This is not very convenient, so instead we can set up the whole directory, from where all entities will be connected and used in our connection:

```typescript
import {createConnection} from "typeorm";

createConnection({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    entities: [
        __dirname + "/entity/*.js"
    ],
    synchronize: true,
}).then(connection => {
    // Here you can start to work with your entities
}).catch(error => console.log(error));
```

But be careful with this approach.
If you are using `ts-node` then you need to specify paths to `.ts` files instead.
If you are using `outDir` then you'll need to specify paths to `.js` files inside outDir directory.
If you are using `outDir` and when you remove or rename your entities make sure to clear `outDir` directory
and re-compile your project again, because when you remove your source `.ts` files their compiled `.js` versions
aren't removed from output directory and still are loaded by TypeORM because they present in outDir directory.

### Running the application

Now if you run your `app.ts`, a connection with database will be initialized and a database table for your photos will be created.


```shell
+-------------+--------------+----------------------------+
|                         photo                           |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| name        | varchar(500) |                            |
| description | text         |                            |
| filename    | varchar(255) |                            |
| views       | int(11)      |                            |
| isPublished | boolean      |                            |
+-------------+--------------+----------------------------+
```

### Creating and inserting a photo into the database

Now let's create a new photo to save it in the database:

```typescript
import {createConnection} from "typeorm";

createConnection(/*...*/).then(connection => {

    let photo = new Photo();
    photo.name = "Me and Bears";
    photo.description = "I am near polar bears";
    photo.filename = "photo-with-bears.jpg";
    photo.views = 1;
    photo.isPublished = true;

    return connection.manager
            .save(photo)
            .then(photo => {
                console.log("Photo has been saved. Photo id is", photo.id);
            });

}).catch(error => console.log(error));
```

Once your entity is saved it will get a newly generated id.
`save` method returns instance of same object you pass to it.
Its not a new copy of an object, it modifies its "id" and returns it.
  
### Using async/await syntax

Let's take advantage of the latest ES7 features and use async/await syntax instead:

```typescript
import {createConnection} from "typeorm";
import {Photo} from "./entity/Photo";

createConnection(/*...*/).then(async connection => {

    let photo = new Photo();
    photo.name = "Me and Bears";
    photo.description = "I am near polar bears";
    photo.filename = "photo-with-bears.jpg";
    photo.views = 1;
    photo.isPublished = true;

    await connection.manager.save(photo);
    console.log("Photo has been saved");

}).catch(error => console.log(error));
```

### Using Entity Manager

We just created a new photo and saved it in the database. 
We used `EntityManager` to save it. 
Using entity manager you can manipulate any entity in your app. 
For example, let's load our saved entity:

```typescript
import {createConnection} from "typeorm";
import {Photo} from "./entity/Photo";

createConnection(/*...*/).then(async connection => {

    /*...*/
    let savedPhotos = await connection.manager.find(Photo);
    console.log("All photos from the db: ", savedPhotos);

}).catch(error => console.log(error));
```
   
`savedPhotos` will be an array of Photo objects with the data loaded from the database.

### Using Repositories

Now let's refactor our code and use `Repository` instead of `EntityManager`.
Each entity has its own repository which handles all operations with its entity. 
When you deal with entities a lot, Repositories are more convenient to use than EntityManagers:


```typescript
import {createConnection} from "typeorm";
import {Photo} from "./entity/Photo";

createConnection(/*...*/).then(async connection => {

    let photo = new Photo();
    photo.name = "Me and Bears";
    photo.description = "I am near polar bears";
    photo.filename = "photo-with-bears.jpg";
    photo.views = 1;
    photo.isPublished = true;

    let photoRepository = connection.getRepository(Photo);

    await photoRepository.save(photo);
    console.log("Photo has been saved");

    let savedPhotos = await photoRepository.find();
    console.log("All photos from the db: ", savedPhotos);

}).catch(error => console.log(error));
```
 
### Loading from the database

Let's try more load operations using the Repository:

```typescript
import {createConnection} from "typeorm";
import {Photo} from "./entity/Photo";

createConnection(/*...*/).then(async connection => {

    /*...*/
    let allPhotos = await photoRepository.find();
    console.log("All photos from the db: ", allPhotos);

    let firstPhoto = await photoRepository.findOneById(1);
    console.log("First photo from the db: ", firstPhoto);

    let meAndBearsPhoto = await photoRepository.findOne({ name: "Me and Bears" });
    console.log("Me and Bears photo from the db: ", meAndBearsPhoto);

    let allViewedPhotos = await photoRepository.find({ views: 1 });
    console.log("All viewed photos: ", allViewedPhotos);

    let allPublishedPhotos = await photoRepository.find({ isPublished: true });
    console.log("All published photos: ", allPublishedPhotos);

    let [allPhotos, photosCount] = await photoRepository.findAndCount();
    console.log("All photos: ", allPhotos);
    console.log("Photos count: ", photosCount);

}).catch(error => console.log(error));
```

### Updating in the database

Now let's load a single photo from the database, update it and save it:

```typescript
import {createConnection} from "typeorm";
import {Photo} from "./entity/Photo";

createConnection(/*...*/).then(async connection => {

    /*...*/
    let photoToUpdate = await photoRepository.findOneById(1);
    photoToUpdate.name = "Me, my friends and polar bears";
    await photoRepository.save(photoToUpdate);

}).catch(error => console.log(error));
```

Now photo with `id = 1` will be updated in the database.

### Removing from the database

Now let's remove our photo from the database:

```typescript
import {createConnection} from "typeorm";
import {Photo} from "./entity/Photo";

createConnection(/*...*/).then(async connection => {

    /*...*/
    let photoToRemove = await photoRepository.findOneById(1);
    await photoRepository.remove(photoToRemove);

}).catch(error => console.log(error));
``` 

Now photo with `id = 1` will be removed from the database.

### Creating a one-to-one relation

Let's create a one-to-one relation with another class. 
Let's create a new class in `PhotoMetadata.ts`. This PhotoMetadata class is supposed to contain our photo's additional meta-information:

```typescript
import {Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn} from "typeorm";
import {Photo} from "./Photo";

@Entity()
export class PhotoMetadata {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("int")
    height: number;

    @Column("int")
    width: number;

    @Column()
    orientation: string;

    @Column()
    compressed: boolean;

    @Column()
    comment: string;

    @OneToOne(type => Photo)
    @JoinColumn()
    photo: Photo;
}
```
     
Here, we are used a new decorator called `@OneToOne`. It allows us to create a one-to-one relation between two entities. 
`type => Photo` is a function that returns the class of the entity with which we want to make our relation. 
We are forced to use a function that returns a class, instead of using class directly, because of the language specifics.
We can also write it as a `() => Photo`, but we use `type => Photo` as convention to increase code readability.
The type variable itself does not contain anything.

We also add a `@JoinColumn` decorator, which indicates that this side of the relationship will own the relationship.
Relations can be unidirectional or bidirectional. 
Only one side of relational can be owner. 
Using this decorator is required on the owner side of the relationship.

If you run the app, you'll see a newly generated table, and it will contain a column with a foreign key for the photo relation:

```shell
+-------------+--------------+----------------------------+
|                     photo_metadata                      |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| height      | int(11)      |                            |
| width       | int(11)      |                            |
| comment     | varchar(255) |                            |
| compressed  | boolean      |                            |
| orientation | varchar(255) |                            |
| photoId     | int(11)      | FOREIGN KEY                |
+-------------+--------------+----------------------------+
```

### Save a one-to-one relation

Now let's save a photo, its metadata and attach them to each other.

```typescript
import {createConnection} from "typeorm";
import {Photo} from "./entity/Photo";
import {PhotoMetadata} from "./entity/PhotoMetadata";

createConnection(/*...*/).then(async connection => {

    // Create a photo
    let photo = new Photo();
    photo.name = "Me and Bears";
    photo.description = "I am near polar bears";
    photo.filename = "photo-with-bears.jpg";
    photo.isPublished = true;

    // Create a photo metadata
    let metadata = new PhotoMetadata();
    metadata.height = 640;
    metadata.width = 480;
    metadata.compressed = true;
    metadata.comment = "cybershoot";
    metadata.orientation = "portait";
    metadata.photo = photo; // this way we connect them

    // Get entity repositories
    let photoRepository = connection.getRepository(Photo);
    let metadataRepository = connection.getRepository(PhotoMetadata);

    // First we should persist a photo
    await photoRepository.save(photo);

    // Photo is saved. Now we need to persist a photo metadata
    await metadataRepository.save(metadata);

    // Done
    console.log("Metadata is saved, and relation between metadata and photo is created in the database too");

}).catch(error => console.log(error));
```
 
### Inverse side of the relationship

Relations can be unidirectional or bidirectional. 
Currently, our relation between PhotoMetadata and Photo is unidirectional.
The owner of the relation is PhotoMetadata, and Photo doesn't know anything about PhotoMetadata. 
This makes it complicated to access photo metadata from the photo objects. 
To fix it we should add an inverse relation, and make relations between PhotoMetadata and Photo bidirectional. 
Let's modify our entities:

```typescript
import {Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn} from "typeorm";
import {Photo} from "./Photo";

@Entity()
export class PhotoMetadata {

    /* ... other columns */

    @OneToOne(type => Photo, photo => photo.metadata)
    @JoinColumn()
    photo: Photo;
}
```   

```typescript
import {Entity, Column, PrimaryGeneratedColumn, OneToOne} from "typeorm";
import {PhotoMetadata} from "./PhotoMetadata";

@Entity()
export class Photo {

    /* ... other columns */

    @OneToOne(type => PhotoMetadata, photoMetadata => photoMetadata.photo)
    metadata: PhotoMetadata;
}
```  

`photo => photo.metadata` is a function that returns the name of the inverse side of the relation. 
Here we show that the metadata property of the Photo class is where we store PhotoMetadata in the Photo class. 
Instead of passing a function that returns a property of the photo, you could alternatively simply pass a string to `@OneToOne` decorator, like `"metadata"`. 
But we used this function-typed approach to make our refactoring easier.

Note that we should use `@JoinColumn` on one side of a relation only. 
Whichever side you put this decorator on will be the owning side of the relationship. 
The owning side of a relationship contains a column with a foreign key in the database.

### Loading objects with their relations

Now let's load our photo, and its photo metadata in a single query. 
There are two ways to do it - using `find*` methods or using `QueryBuilder` functionality. 
Let's use `find*` methods first. 
`find*` methods allow you to specify an object with the `FindOneOptions` / `FindManyOptions` interface. 

```typescript
import {createConnection} from "typeorm";
import {Photo} from "./entity/Photo";
import {PhotoMetadata} from "./entity/PhotoMetadata";

createConnection(/*...*/).then(async connection => {

    /*...*/
    let photoRepository = connection.getRepository(Photo);
    let photos = await photoRepository.find({ relations: ["metadata"] });


}).catch(error => console.log(error));
```
        
Here photos will contain an array of photos from the database, and each photo will contain its photo metadata.
Using find options is good and dead simple, but if you need more complex query you should use `QueryBuilder`.
`QueryBuilder` allows to use more complex queries in an elegant way:

```typescript
import {createConnection} from "typeorm";
import {Photo} from "./entity/Photo";
import {PhotoMetadata} from "./entity/PhotoMetadata";

createConnection(/*...*/).then(async connection => {

    /*...*/
    let photoRepository = connection.getRepository(Photo);
    let photos = await photoRepository.createQueryBuilder("photo")
            .innerJoinAndSelect("photo.metadata", "metadata")
            .getMany();


}).catch(error => console.log(error));
```

`QueryBuilder` allows to create and execute SQL query of almost any complexity.
When you work with `QueryBuilder` think like you are creating SQL query.
In this example "photo" and "metadata" are aliases applied to selected photos.
You use aliases to access columns and properties of the selected data.

### Using cascades to automatically save related objects

We can setup cascade options in our relations, in the cases when we want our related object to be persisted whenever the other object is saved. 
Let's change our photo's `@OneToOne` decorator a bit:

```typescript
export class Photo {
    /// ... other columns

    @OneToOne(type => PhotoMetadata, metadata => metadata.photo, {
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true
    })
    metadata: PhotoMetadata;
}
```

* **cascadeInsert** - automatically insert metadata in the relation if it does not exist in its table. 
    This means that we don't need to manually insert a newly created `photoMetadata` object.
* **cascadeUpdate** - automatically update metadata in the relation if something is changed in this object.
* **cascadeRemove** - automatically remove metadata from its table if you removed metadata from photo object.

Using `cascadeInsert` allows us not to separately persist photo and separately persist metadata objects now. 
Now we can simply persist a photo object, and the metadata object will persist automatically because of cascade options.

```typescript
createConnection(options).then(async connection => {

    // Create photo object
    let photo = new Photo();
    photo.name = "Me and Bears";
    photo.description = "I am near polar bears";
    photo.filename = "photo-with-bears.jpg"
    photo.isPublished = true;

    // Create photo metadata object
    let metadata = new PhotoMetadata();
    metadata.height = 640;
    metadata.width = 480;
    metadata.compressed = true;
    metadata.comment = "cybershoot";
    metadata.orientation = "portait";
    
    photo.metadata = metadata; // this way we connect them

    // Get repository
    let photoRepository = connection.getRepository(Photo);

    // Persisting a photo also persist the metadata
    await photoRepository.save(photo);

    console.log("Photo is saved, photo metadata is saved too.")

}).catch(error => console.log(error));
```     

### Creating a many-to-one / one-to-many relation

Let's create a many-to-one / one-to-many relation. 
Let's say a photo has one author, and each author can have many photos. 
First, let's create an `Author` class:

```typescript
import {Entity, Column, PrimaryGeneratedColumn, OneToMany, JoinColumn} from "typeorm";
import {Photo} from "./Photo";

@Entity()
export class Author {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Photo, photo => photo.author) // Note: we will create author property in the Photo class below
    photos: Photo[];
}
```

`Author` contains an inverse side of a relation. 
`OneToMany` is always an inverse side of relation, and it can't exist without `ManyToOne` on the other side of the relation.

Now let's add the owner side of the relation into the Photo entity:

```typescript
import {Entity, Column, PrimaryGeneratedColumn, ManyToOne} from "typeorm";
import {PhotoMetadata} from "./PhotoMetadata";
import {Author} from "./Author";

@Entity()
export class Photo {

    /* ... other columns */

    @ManyToOne(type => Author, author => author.photos)
    author: Author;
}
```

In many-to-one / one-to-many relation, the owner side is always many-to-one. 
It means that the class that uses `@ManyToOne` will store the id of the related object.

After you run the application, the ORM will create the `author` table:


```shell
+-------------+--------------+----------------------------+
|                          author                         |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| name        | varchar(255) |                            |
+-------------+--------------+----------------------------+
```

It will also modify the `photo` table, adding a new `author` column and creating a foreign key for it:

```shell
+-------------+--------------+----------------------------+
|                         photo                           |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| name        | varchar(255) |                            |
| description | varchar(255) |                            |
| filename    | varchar(255) |                            |
| isPublished | boolean      |                            |
| authorId    | int(11)      | FOREIGN KEY                |
+-------------+--------------+----------------------------+
```
   
### Creating a many-to-many relation

Let's create a many-to-one / many-to-many relation. 
Let's say a photo can be in many albums, and each album can contain many photos. 
Let's create an `Album` class:

```typescript
import {Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable} from "typeorm";

@Entity()
export class Album {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany(type => Photo, photo => photo.albums, {  // Note: we will create "albums" property in the Photo class below
        cascadeInsert: true, // Allow to insert a new photo on album save
        cascadeUpdate: true // Allow to update a photo on album save
    })
    @JoinTable()
    photos: Photo[];
}
```
  
`@JoinTable` is required to specify that this is the owner side of the relationship.

Now let's add the inverse side of our relation to the `Photo` class:

```typescript
export class Photo {
    /// ... other columns

    @ManyToMany(type => Album, album => album.photos, {
        cascadeInsert: true, // Allow to insert a new album on photo save
        cascadeUpdate: true // Allow to update an album on photo save
    })
    albums: Album[];
}
```

After you run the application, the ORM will create a **album_photos_photo_albums** *junction table*:

```shell
+-------------+--------------+----------------------------+
|                album_photos_photo_albums                |
+-------------+--------------+----------------------------+
| album_id    | int(11)      | PRIMARY KEY FOREIGN KEY    |
| photo_id    | int(11)      | PRIMARY KEY FOREIGN KEY    |
+-------------+--------------+----------------------------+
```

Don't forget to register the `Album` class with your connection in the ORM:

```typescript
const options: CreateConnectionOptions = {
    // ... other options
    entities: [Photo, PhotoMetadata, Author, Album]
};
```
        
Now let's insert albums and photos to our database:

```typescript
let connection = await createConnection(options);

// Create a few albums
let album1 = new Album();
album1.name = "Bears";

let album2 = new Album();
album2.name = "Me";

// Create a few photos
let photo1 = new Photo();
photo1.name = "Me and Bears";
photo1.description = "I am near polar bears";
photo1.filename = "photo-with-bears.jpg";
photo1.albums = [album1];

let photo2 = new Photo();
photo2.name = "Me and Bears";
photo2.description = "I am near polar bears";
photo2.filename = "photo-with-bears.jpg";
photo2.albums = [album1];

// Get entity repository
let photoRepository = connection.getRepository(Photo);

// First save a first photo
// We only save the photos, albums are persisted
// automatically because of cascade options
await photoRepository.save(photo1);

// Second save a first photo
await photoRepository.save(photo2);

console.log("Both photos have been saved");
```

### Using QueryBuilder

You can use QueryBuilder to build SQL query of almost any complexity. For example, you can do this:

```typescript
let photos = await connection
    .getRepository(Photo)
    .createQueryBuilder("photo") // first argument is an alias. Alias is what you are selecting - photos. You must specify it.
    .innerJoinAndSelect("photo.metadata", "metadata")
    .leftJoinAndSelect("photo.albums", "album")
    .where("photo.isPublished=true")
    .andWhere("(photo.name=:photoName OR photo.name=:bearName)")
    .orderBy("photo.id", "DESC")
    .skip(5)
    .take(10)
    .setParameters({ photoName: "My", bearName: "Mishka" })
    .getMany();
```

This query builder will select all photos that are published and whose name is "My" or "Mishka".
It will select results from position 5 (pagination offset), 
and will select only 10 results (pagination limit). 
The selection result will be ordered by id in descending order. 
The photos' albums will be left-joined and their metadata will be inner joined.

You'll use the query builder in your application a lot. 
Learn more about QueryBuilder [here](./query-builder.md).
