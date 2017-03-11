<div align="center">
  <a href="https://typeorm.github.io/">
    <img src="./resources/logo_big.png" width="492" height="228">
  </a>
  <br>
  <br>
	<a href="https://travis-ci.org/typeorm/typeorm">
		<img src="https://travis-ci.org/typeorm/typeorm.svg?branch=master">
	</a>
	<a href="https://badge.fury.io/js/typeorm">
		<img src="https://badge.fury.io/js/typeorm.svg">
	</a>
	<a href="https://david-dm.org/typeorm/typeorm">
		<img src="https://david-dm.org/typeorm/typeorm.svg">
	</a>
	<a href="https://david-dm.org/typeorm/typeorm#info=devDependencies">
		<img src="https://david-dm.org/typeorm/typeorm/dev-status.svg">
	</a>
	<a href="https://gitter.im/typeorm/typeorm?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge">
		<img src="https://badges.gitter.im/typeorm/typeorm.svg">
	</a>
  <br>
  <br>
</div>

> Please support a project by simply putting a github star. 
Share this library with friends on twitter and everywhere else you can.

> ORM is in active development, but main API is pretty stable.
If you notice bug or have something not working please report an issue, we'll try to fix it as soon as possible.
More documentation and features expected to be soon. Feel free to contribute.

> 0.0.9 is released! Most notable changes are in the [changelog](./CHANGELOG.md).

TypeORM is an [Object Relational Mapper](1) (ORM) for node.js written in
TypeScript that can be used with TypeScript or JavaScript (ES5, ES6, ES7).
Its goal to always support latest JavaScript features and provide features
that help you to develop any kind of applications that use database - from
small applications with a few tables to large scale enterprise applications.
TypeORM helps you to:

* automatically create in the database table schemas based on your models
* ability to transparently insert / update / delete to the database
your objects
* map your selections from tables to javascript objects and map table columns
to javascript object's properties
* create one-to-one, many-to-one, one-to-many, many-to-many relations between tables
* and much more ...

TypeORM uses Data Mapper pattern, unlike all other JavaScript ORMs that
currently exist, which means you can write loosely coupled, scalable,
maintainable applications with less problems.

The benefit of using TypeORM for the programmer is the ability to focus on
the business logic and worry about persistence only as a secondary problem.

TypeORM is highly influenced by other ORMs, such as [Hibernate](http://hibernate.org/orm/),
 [Doctrine](http://www.doctrine-project.org/) and [Entity Framework](https://www.asp.net/entity-framework).

## Installation

1. Install module:

    `npm install typeorm --save`

2. You need to install `reflect-metadata` shim:

    `npm install reflect-metadata --save`

    and use it somewhere in the global place of your app:

    * `require("reflect-metadata")` in your app's entry point (for example `app.ts`)

3. You may need to install node typings:

    `npm install @types/node --save`

4. Install database driver:

    * for **MySQL** or **MariaDB**
    
        `npm install mysql --save`
    
    * for **Postgres**
    
        `npm install pg --save`
    
    * for **SQLite**
    
        `npm install sqlite3 --save`
    
    * for **Microsoft SQL Server**
    
        `npm install mssql --save`
    
    * for **Oracle** (experimental)
    
        `npm install oracledb --save`
    
    Install only one of them, depend on which database you use.
    
    To make oracle driver to work you need to follow installation instructions from 
    [their](https://github.com/oracle/node-oracledb) site.

#### TypeScript configuration

Also make sure you are using TypeScript compiler version > **2.1** and you have enabled following settings in `tsconfig.json`:

```json
"emitDecoratorMetadata": true,
"experimentalDecorators": true,
```

You'll also need to enable `es6` in the `lib` section of compiler options, or install `es6-shim` from `@typings`.

#### Node.js version

TypeORM was tested with Node.JS version 4 and above. 
If you have errors during app bootstrap, try to upgrade your node.js version to the latest version.

#### Usage in the browser with WebSQL (experimental)

TypeORM works in the browser and has experimental support of WebSQL.
If you want to use TypeORM in the browser then you need to `npm i typeorm-browser` instead of `typeorm`.
More information about it in [this page](https://typeorm.github.io/usage-in-browser.html). 
Also take a look on [this sample](https://github.com/typeorm/browser-example).

## Quick Start

In TypeORM tables are created from Entities. 
*Entity* is your model decorated by a `@Entity` decorator. 
You can get entities from the database and insert/update/remove them from there. 
Let's say we have a model `entity/Photo.ts`:

```typescript
export class Photo {
    id: number;
    name: string;
    description: string;
    fileName: string;
    views: number;
}
````
        
### Creating entity

Now lets make it entity:

```typescript
import {Entity} from "typeorm";

@Entity()
export class Photo {
    id: number;
    name: string;
    description: string;
    fileName: string;
    views: number;
    isPublished: boolean;
}
```
        
### Add table columns

Now we have a table, and each table consist of columns. 
Let's add some columns. 
You can make any property of your model a column by using a `@Column` decorator:

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
    fileName: string;

    @Column()
    views: number;

    @Column()
    isPublished: boolean;
}
```
        
### Create a primary column

Perfect. 
Now ORM will generate us a photo table with all its properties as columns. 
But there is one thing left.
Each entity must have a primary column. 
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
    fileName: string;

    @Column()
    views: number;

    @Column()
    isPublished: boolean;
}
```
   
### Create auto-increment / generated / sequence / identity column

Now, lets say you want to make your id column to be auto-generated (this is known as auto-increment / sequence / generated identity column).
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
    fileName: string;

    @Column()
    views: number;

    @Column()
    isPublished: boolean;
}
```

### Using `@PrimaryGeneratedColumn` decorator

Now your photo's id will always be a generated, auto increment value. 
Since this is a common task - to create a generated auto increment primary column, 
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
    fileName: string;

    @Column()
    views: number;

    @Column()
    isPublished: boolean;
}
```

### Custom column data types

Next step, lets fix our data types. By default, string is mapped to a varchar(255)-like type (depend of database type). 
Number is mapped to a float/double-like type (depend of database type). 
We don't want all our columns to be limited varchars or excessive floats. 
Lets setup correct data types:

```typescript
import {Entity, Column, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class Photo {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        length: 500
    })
    name: string;

    @Column("text")
    description: string;

    @Column()
    fileName: string;

    @Column("int")
    views: number;

    @Column()
    isPublished: boolean;
}
```

### Creating connection with the database

Now, when our entity is created, lets create `app.ts` file and setup our connection there:

```typescript
import "reflect-metadata";
import {createConnection} from "typeorm";
import {Photo} from "./entity/Photo";

createConnection({
    driver: {
        type: "mysql",
        host: "localhost",
        port: 3306,
        username: "root",
        password: "admin",
        database: "test"
    },
    entities: [
        Photo
    ],
    autoSchemaSync: true,
}).then(connection => {
    // here you can start to work with your entities
}).catch(error => console.log(error));
```

We are using mysql in this example, but you can use any other database. 
To use another database simply change type in the driver options to the database type you are using: 
mysql, mariadb, postgres, sqlite, mssql or oracle.
Also make sure to use your own host, port, username, password and database settings.

We added our Photo entity to the list of entities for this connection. 
Each entity you are using in your connection must be listed here.

Setting `autoSchemaSync` makes sure your entities will be synced with the database, every time you run the application.

### Loading all entities from the directory

Later, when we create more entities we need to add them to the entities in our configuration. 
But this is not very convenient, and instead we can setup the whole directory, 
where from all entities will be connected and used in our connection:

```typescript
import {createConnection} from "typeorm";

createConnection({
    driver: {
        type: "mysql",
        host: "localhost",
        port: 3306,
        username: "root",
        password: "admin",
        database: "test"
    },
    entities: [
        __dirname + "/entity/*.js"
    ],
    autoSchemaSync: true,
}).then(connection => {
    // here you can start to work with your entities
}).catch(error => console.log(error));
```

### Run the application

Now you if run your `app.ts`, connection with database will be initialized and database table for your Photo will be created.


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
    
Now you can run your `app.ts`, connection with database will be initialized, and database table for your Photo will be created.

### Creating and inserting photo into the database

Now lets create a new photo to save it in the database:

```typescript
import {createConnection} from "typeorm";

createConnection(/*...*/).then(connection => {

    let photo = new Photo();
    photo.name = "Me and Bears";
    photo.description = "I am near polar bears";
    photo.filename = "photo-with-bears.jpg";
    photo.views = 1;
    photo.isPublished = true;

    connection.entityManager
            .persist(photo)
            .then(photo => {
                console.log("Photo has been saved");
            });

}).catch(error => console.log(error));
```
  
### Using async/await syntax

Lets use latest TypeScript advantages and use async/await syntax instead:

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

    await connection.entityManager.persist(photo);
    console.log("Photo has been saved");

}).catch(error => console.log(error));
```

### Using Entity Manager

We just created a new photo and saved it in the database. 
We used `EntityManager` to save it. 
Using entity managers you can manipulate any entity in your app. 
Now lets load our saved entity:

```typescript
import {createConnection} from "typeorm";
import {Photo} from "./entity/Photo";

createConnection(/*...*/).then(async connection => {

    /*...*/
    let savedPhotos = await connection.entityManager.find(Photo);
    console.log("All photos from the db: ", savedPhotos);

}).catch(error => console.log(error));
```
   
savedPhotos will be an array of Photo objects with the data loaded from the database.

### Using Repositories

Now lets refactor our code and use `Repository` instead of EntityManager.
Each entity has its own repository which handles all operations with its entity. 
When you deal with entities a lot, Repositories are more convenient to use then EntityManager:


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

    await photoRepository.persist(photo);
    console.log("Photo has been saved");

    let savedPhotos = await photoRepository.find();
    console.log("All photos from the db: ", savedPhotos);

}).catch(error => console.log(error));
```
 
### Loading photos from the database

Lets try more load operations using Repository:

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
    console.log("All photos: ", allPublishedPhotos);
    console.log("Photos count: ", allPublishedPhotos);

}).catch(error => console.log(error));
```

### Updating photo in the database

Now lets load a single photo from the database, update it and save it:

```typescript
import {createConnection} from "typeorm";
import {Photo} from "./entity/Photo";

createConnection(/*...*/).then(async connection => {

    /*...*/
    let photoToUpdate = await photoRepository.findOneById(1);
    photoToUpdate.name = "Me, my friends and polar bears";
    await photoRepository.persist(photoToUpdate);

}).catch(error => console.log(error));
```

Now photo with `id = 1` will be updated in the database.

### Removing photo from the database

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

### creating a one-to-one relation

Lets create a one-to-one relation with another class. 
Lets create a new class called PhotoMetadata.ts which will contain a PhotoMetadata class which supposed to contain our photo's additional meta-information:

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
     
Here, we are used a new decorator called `@OneToOne`. It allows to create one-to-one relations between two entities. 
`type => Photo` is a function that returns the class of the entity with which we want to make our relation. 
We are forced to use a function that returns a class, instead of using class directly, because of the language specifics.
We can also write it as a `() => Photo`, but we use `type => Photo as convention to increase code readability. `
Type variable itself does not contain anything.

We also put `@JoinColumn` decorator, which indicates that this side of the relationship will be owning relationship.
Relations can be a uni-directional and bi-directional. 
Only one side of relational can be owner. 
Using this decorator is required on owner side of the relationship.

If you run the app you'll see a new generated table, and it will contain a column with a foreign key for the photo relation:

```shell
+-------------+--------------+----------------------------+
|                         photo                           |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| height      | int(11)      |                            |
| width       | int(11)      |                            |
| comment     | varchar(255) |                            |
| compressed  | boolean      |                            |
| orientation | varchar(255) |                            |
| photo       | int(11)      | FOREIGN KEY                |
+-------------+--------------+----------------------------+
```

### persisting an object with one-to-one relation

Now lets save a photo, its metadata and attach them to each other.

```typescript
import {createConnection} from "typeorm";
import {Photo} from "./entity/Photo";
import {PhotoMetadata} from "./entity/PhotoMetadata";

createConnection(/*...*/).then(async connection => {

    // create a photo
    let photo = new Photo();
    photo.name = "Me and Bears";
    photo.description = "I am near polar bears";
    photo.filename = "photo-with-bears.jpg"
    photo.isPublished = true;

    // create a photo metadata
    let metadata = new PhotoMetadata();
    metadata.height = 640;
    metadata.width = 480;
    metadata.compressed = true;
    metadata.comment = "cybershoot";
    metadata.orientation = "portait";
    metadata.photo = photo; // this way we connect them

    // get entity repositories
    let photoRepository = connection.getRepository(Photo);
    let metadataRepository = connection.getRepository(PhotoMetadata);

    // first we should persist a photo
    await photoRepository.persist(photo);

    // photo is saved. Now we need to persist a photo metadata
    await metadataRepository.persist(metadata);

    // done
    console.log("metadata is saved, and relation between metadata and photo is created in the database too");

}).catch(error => console.log(error));
```
 
### Adding inverse side of a relation

Relations can be a uni-directional and bi-directional. 
Now, relation between PhotoMetadata and Photo is uni-directional.
Owner of the relation is PhotoMetadata and Photo doesn't know anything about PhotoMetadata. 
This makes complicated accessing a photo metadata from the photo objects. 
To fix it we should add inverse relation and make relations between PhotoMetadata and Photo bi-directional. 
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

`photo => photo.metadata` is a function that returns a name of the inverse side of the relation. 
Here we show that metadata property of the Photo class is where we store PhotoMetadata in the Photo class. 
You could also instead of passing function that returns a property of the photo simply pass a string to `@OneToOne` decorator, like `"metadata"`. 
But we used this function-typed approach to make your refactorings easier.

Note that we should use `@JoinColumn` only on one side of relation. 
On which side you put this decorator, that side will be owning side of relationship. 
Owning side of relationship contain a column with a foreign key in the database.

### Loading object with their relations

Now lets load our photo, and its photo metadata in a single query. 
There are two ways to do it - one you can use `FindOptions`, second is to use QueryBuilder. 
Lets use FindOptions first. 
`Repository.find` method allows you to specify object with FindOptions interface. 
Using this you can customize your query to perform more complex queries.

```typescript
import {createConnection} from "typeorm";
import {Photo} from "./entity/Photo";
import {PhotoMetadata} from "./entity/PhotoMetadata";

createConnection(/*...*/).then(async connection => {

    /*...*/
    let photoRepository = connection.getRepository(Photo);
    let photos = await photoRepository.find({
        alias: "photo",
        innerJoinAndSelect: {
            "metadata": "photo.metadata"
        }
    });


}).catch(error => console.log(error));
```
        
Here photos will contain array of photos from the database, and each photo will contain its photo metadata.

`alias` is a required property of FindOptions. Its your own alias name of the data you are selecting. 
You'll use this alias in your where, order by, group by, join and other expressions.

We also used `innerJoinAndSelect` to inner and join and select the data from photo.metadata. 
In `"photo.metadata"` "photo" is an alias you used, and "metadata" is a property name with relation of the object you are selecting. 
`"metadata"`: is a new alias to the data returned by join expression.

Lets use `QueryBuilder` for the same purpose. QueryBuilder allows to use more complex queries in an elegant way:

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

### using cascade options to automatically save related objects

We can setup cascade options in our relations, in the cases when we want our related object to be persisted whenever other object is saved. 
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
    This means that we don't need to manually insert a newly created photoMetadata object.
* **cascadeUpdate** - automatically update metadata in the relation if in this object something is changed.
* **cascadeRemove** - automatically remove metadata from its table if you removed metadata from photo object.

Using cascadeInsert allows us not to separately persist photo and separately persist metadata objects now. 
Now we can simply persist a photo object, and metadata object will persist automatically because of cascade options.

```typescript
createConnection(options).then(async connection => {

    // create photo object
    let photo = new Photo();
    photo.name = "Me and Bears";
    photo.description = "I am near polar bears";
    photo.filename = "photo-with-bears.jpg"
    photo.isPublished = true;

    // create photo metadata object
    let metadata = new PhotoMetadata();
    metadata.height = 640;
    metadata.width = 480;
    metadata.compressed = true;
    metadata.comment = "cybershoot";
    metadata.orientation = "portait";
    
    photo.metadata = metadata; // this way we connect them

    // get repository
    let photoRepository = connection.getRepository(Photo);

    // first we should persist a photo
    await photoRepository.persist(photo);

    console.log("Photo is saved, photo metadata is saved too.")

}).catch(error => console.log(error));
```     

### creating a many-to-one / one-to-many relation

Lets create a many-to-one / one-to-many relation. 
Lets say a photo has one author, and each author can have many photos. 
First, lets create Author class:

```typescript
import {Entity, Column, PrimaryGeneratedColumn, OneToMany, JoinColumn} from "typeorm";
import {Photo} from "./Photo";

@Entity()
export class Author {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Photo, photo => photo.author) // note: we will create author property in the Photo class below
    photos: Photo[];
}
```

Author contains an inverse side of a relationship. 
OneToMany is always an inverse side of relation, and it can't exist without ManyToOne of the other side of relationship.

Now lets add owner side of relationship into the Photo entity:

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

In many-to-one / one-to-many relation, owner side is always many-to-one. 
It means that class which uses `@ManyToOne` will store id of the related object.

After you run application ORM will create author table:


```shell
+-------------+--------------+----------------------------+
|                          author                         |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| name        | varchar(255) |                            |
+-------------+--------------+----------------------------+
```

It will also modify photo table - add a new column author and create a foreign key for it:

```shell
+-------------+--------------+----------------------------+
|                         photo                           |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| name        | varchar(255) |                            |
| description | varchar(255) |                            |
| filename    | varchar(255) |                            |
| isPublished | boolean      |                            |
| author      | int(11)      | FOREIGN KEY                |
+-------------+--------------+----------------------------+
```
   
### creating a many-to-many relation

Lets create a many-to-one / many-to-many relation. 
Lets say a photo can be in many albums, and multiple can have many photos. 
Lets create an `Album` class:

```typescript
import {Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable} from "typeorm";

@Entity()
export class Album {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany(type => Photo, photo => photo.albums, {  // note: we will create "albums" property in the Photo class below
        cascadeInsert: true, // allow to insert a new photo on album save
        cascadeUpdate: true, // allow to update a photo on album save
        cascadeRemove: true  // allow to remove a photo on album remove
    })
    @JoinTable()
    photos: Photo[] = []; // we initialize array for convinience here
}
```
  
`@JoinTable` is required to specify that this is owner side of the relationship.

Now lets add inverse side of our relation to the `Photo` class:

```typescript
export class Photo {
    /// ... other columns

    @ManyToMany(type => Album, album => album.photos, {
        cascadeInsert: true, // allow to insert a new album on photo save
        cascadeUpdate: true, // allow to update an album on photo save
        cascadeRemove: true  // allow to remove an album on photo remove
    })
    albums: Album[] = []; // we initialize array for convinience here
}
```

After you run application ORM will create a **album_photos_photo_albums** *junction table*:

```shell
+-------------+--------------+----------------------------+
|                album_photos_photo_albums                |
+-------------+--------------+----------------------------+
| album_id_1  | int(11)      | PRIMARY KEY FOREIGN KEY    |
| photo_id_2  | int(11)      | PRIMARY KEY FOREIGN KEY    |
+-------------+--------------+----------------------------+
```

Don't forget to register `Album` class for your connection in the ORM:

```typescript
const options: CreateConnectionOptions = {
    // ... other options
    entities: [Photo, PhotoMetadata, Author, Album]
};
```
        
Now lets insert albums and photos to our database:

```typescript
let connection = await createConnection(options);

// create a few albums
let album1 = new Album();
album1.name = "Bears";

let album2 = new Album();
album2.name = "Me";

// create a few photos
let photo1 = new Photo();
photo1.name = "Me and Bears";
photo1.description = "I am near polar bears";
photo1.filename = "photo-with-bears.jpg";
photo1.albums.push(album1);

let photo2 = new Photo();
photo2.name = "Me and Bears";
photo2.description = "I am near polar bears";
photo2.filename = "photo-with-bears.jpg";
photo2.albums.push(album2);

// get entity repository
let photoRepository = connection.getRepository(Photo);

// first save a first photo
// we only save the photos, albums are persisted
// automatically because of cascade options
await photoRepository.persist(photo1);

// second save a first photo
await photoRepository.persist(photo2);

console.log("Both photos have been saved");
```

### using QueryBuilder

You can use QueryBuilder to build even more complex queries. For example you can do this:

```typescript
let photoRepository = connection.getRepository(Photo);
let photos = await photoRepository
    .createQueryBuilder("photo") // first argument is an alias. Alias is what you are selecting - photos. You must specify it.
    .innerJoinAndSelect("photo.metadata", "metadata")
    .leftJoinAndSelect("photo.albums", "albums")
    .where("photo.isPublished=true")
    .andWhere("(photo.name=:photoName OR photo.name=:bearName)")
    .orderBy("photo.id", "DESC")
    .setFirstResult(5)
    .setMaxResults(10)
    .setParameters({ photoName: "My", bearName: "Mishka" })
    .getMany();
```

This query builder will select you all photos that are published and whose name is "My" or "Mishka", 
it will select results from 5 position (pagination offset), 
and will select only 10 results (pagination limit). 
Selection result will be ordered by id in descending order. 
Photo's albums will be left-joined and photo's metadata will be inner joined.

You'll use query builder in your application a lot. Learn more about QueryBuilder [here](https://typeorm.github.io/query-builder.html).

## Learn more

* [Connection and connection options](https://typeorm.github.io/connection.html)
* [Connection Manager](https://typeorm.github.io/connection-manager.html)
* [Databases and drivers](https://typeorm.github.io/databases-and-drivers.html)
* [Updating database schema](https://typeorm.github.io/updating-database-schema.html)
* [Tables and columns](https://typeorm.github.io/tables-and-columns.html)
* [Relations](https://typeorm.github.io/relations.html)
* [Indices](https://typeorm.github.io/indices.html)
* [Repository](https://typeorm.github.io/repository.html)
* [Query Builder](https://typeorm.github.io/query-builder.html)
* [Entity Manager](https://typeorm.github.io/entity-manager.html)
* [Subscribers and entity listeners](https://typeorm.github.io/subscribers-and-entity-listeners.html)
* [Migrations](https://typeorm.github.io/migrations.html)
* [Using service container](https://typeorm.github.io/using-service-container.html)
* [Decorators Reference](https://typeorm.github.io/decorators-reference.html)
* [Usage in the browser](https://typeorm.github.io/usage-in-browser.html)
* [Using with JavaScript](https://typeorm.github.io/usage-with-javascript.html)

## Samples

Take a look on samples in [./sample](sample) for examples of usage.

There are few repositories which you can clone and start with:

* [Example how to use TypeORM with TypeScript](https://github.com/typeorm/typescript-example)
* [Example how to use TypeORM with JavaScript](https://github.com/typeorm/javascript-example)
* [Example how to use TypeORM with JavaScript and Babel](https://github.com/typeorm/babel-example)
* [Example how to use TypeORM with TypeScript and SystemJS in Browser](https://github.com/typeorm/browser-example)

## Extensions

There are several extensions that simplify TypeORM integration with other modules:

* [TypeORM integration](https://github.com/typeorm/typeorm-typedi-extensions) with [TypeDI](https://github.com/pleerock/typedi)
* [TypeORM integration](https://github.com/typeorm/typeorm-routing-controllers-extensions) with [routing-controllers](https://github.com/pleerock/routing-controllers)

## Contributing 

Learn about contribution [here](CONTRIBUTING.md) and how to setup your development environment [here](DEVELOPER.md).


[1]: https://en.wikipedia.org/wiki/Object-relational_mapping
