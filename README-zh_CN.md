TypeORM是一个优秀的Node.js ORM框架，采用TypeScript编写，支持使用TypeScript或Javascript(ES5, ES6, ES7)开发。
目标是保持支持最新的Javascript特性来帮助开发各种用到数据库的应用 - 不管是轻应用还是企业级的。

TypeORM可以做到：

* 根据Models自动创建数据库Table
* 可以透明的insert/update/delete数据库对象
* 映射数据库table到javascript对象，映射table column到javascript对象属性
* 提供表的一对一，多对一，一对多，多对多关系处理
* 还有更多 ...

不同于其他的JavaScript ORM，TypeORM使用的是数据映射模式，可以很轻松的创建出松耦合、可伸缩、可维护的应用。

TypeORM可以帮助开发者专注于业务逻辑，而不用过于担心数据存储的问题。

TypeORM参考了很多其他优秀ORM的实现, 比如 [Hibernate](http://hibernate.org/orm/), [Doctrine](http://www.doctrine-project.org/) 和 [Entity Framework](https://www.asp.net/entity-framework).

## Note

This documentation is not up-to-date. 
See latest english documentation on the [website](http://typeorm.io).
Contributions are welcomed.

## 安装

1. 安装TypeORM:

    `npm install typeorm --save`

2. 需要安装依赖模块 `reflect-metadata` :

    `npm install reflect-metadata --save`

    在应用里全局引用一下:

    * 比如在app.ts的入口处 `require("reflect-metadata")` 

3. 安装数据库驱动:

    * **MySQL** 或 **MariaDB**
    
        `npm install mysql --save`
    
    * **Postgres**
    
        `npm install pg --save`
    
    * **SQLite**
    
        `npm install sqlite3 --save`
    
    * **Microsoft SQL Server**
    
        `npm install mssql --save`
    
    * **Oracle** (experimental)
    
        `npm install oracledb --save`
    
    可以根据你的数据库选择安装上面的任意一个.
    
    使用oracle驱动需要参考安装说明：[地址](https://github.com/oracle/node-oracledb).

#### TypeScript配置

确保你的TypeScript编译器的版本大于**2.1**，并且在`tsconfig.json`开启下面设置:

```json
"emitDecoratorMetadata": true,
"experimentalDecorators": true,
```

同时需要开启编译选项里的`lib`下的`es6`或者从`@typings`安装`es6-shim`

#### Node.js 版本

TypeORM在Node.JS 4.0或以上版本上测试通过。
如果在应用启动过程中出错可以尝试升级node.js到最新版本。

#### 在浏览器中使用WebSQL (试用)

TypeORM可以在浏览器环境中工作，并且试验性的支持WebSQL
如果在浏览器环境中使用TypeORM需要使用 `npm i typeorm-browser` 来替代 `typeorm`.
更多相关可以参考[这里](https://typeorm.io)和[这个例子](https://github.com/typeorm/browser-example).

## 快速开始

在TypeORM中，数据库table都是从实体中创建。
所谓*实体*其实就是用装饰器`@Entity`装饰的一个model。 
可以直接从数据库中得到包含数据的实体对象，并且可以通过实体进行数据库表的insert/update/remove。
来看看这个model `entity/Photo.ts`:

```typescript
export class Photo {
    id: number;
    name: string;
    description: string;
    filename: string;
    views: number;
}
```
        
### 创建实体

现在把Model变成实体:

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
        
### 添加table列

已经有了一个table，每个table都有column. 
现在来添加列. 
可以使用装饰器`@Column`来把model的属性变成列：

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
        
### 创建一个主键列

很好， 现在ORM马上就可以在数据库中生成这个photo表，不过还漏了一个，每个table都必须要有主键列，所以要加上它。
可以用`@PrimaryColumn`装饰器来标记一个主键列。

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
   
### 使用 `@PrimaryGeneratedColumn` 装饰器

现在photo表的id可能自动生成自动增长，不过还是有点麻烦，这个一个很常见的功能，所以有一个专门的装饰器`@PrimaryGeneratedColumn`来实现相同的功能。

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

### 自定义列的数据类型

接下来让我们改一下列的数据类型。默认情况下，string类型的属性会映射到数据库里varchar(255)的数据类型，number则会映射到类似于float/double这样的数据类型（取决到是什么数据库）。
但是我们不想所有的列被限制在varchar或float之类，下面来改进：

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
    filename: string;

    @Column("int")
    views: number;

    @Column()
    isPublished: boolean;
}
```

### 创建数据库连接

现在实体已经有了，接下来创建`app.ts`并配置数据库连接：

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
    synchronize: true,
}).then(connection => {
    // 这里可以写实体操作相关的代码 
}).catch(error => console.log(error));
```

在例子里使用的是mysql，你也可以选择其他数据库，只需要简单修改driver选项里的数据库的类型就可以了，比如： 
mysql, mariadb, postgres, sqlite, mssql or oracle.
同样可以修改host, port, username, password 以及database等设置.

把Photo实体加到数据连接的实体列表中，所有需要在这个连接下使用的实体都必须加到这个列表中。

`synchronize`选项可以在应用启动时确保你的实体和数据库保持同步。 

### 引用目录下的所有实体

接下来我们可能会创建更多的实体并把它们一一加到配置当中。
不过这样会比较麻烦，好在可以直接写上实体的目录，这样这个目录下的所有实体都可以在当前连接中被使用：

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
    synchronize: true,
}).then(connection => {
    // here you can start to work with your entities
}).catch(error => console.log(error));
```

### 启动应用

现在可以启动`app.ts`，启动后可以发现数据库自动被初始化，并且Photo这个表也会创建出来。

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

### 添加和插入photo

现在创建一个新的photo然后存到数据库：

```typescript
import {createConnection} from "typeorm";

createConnection(/*...*/).then(connection => {

    let photo = new Photo();
    photo.name = "Me and Bears";
    photo.description = "I am near polar bears";
    photo.filename = "photo-with-bears.jpg";
    photo.views = 1;
    photo.isPublished = true;

    connection.manager
            .save(photo)
            .then(photo => {
                console.log("Photo has been saved");
            });

}).catch(error => console.log(error));
```
  
### 使用async/await语法

现在利用TypeScript的async/await语法来实现同样的功能：

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

### 使用EntityManager

刚刚我们创建了一个新的photo并且存进数据库。使用EntityManager可以操作实体，现在用`EntityManager`来把photo从数据库中取出来。

```typescript
import {createConnection} from "typeorm";
import {Photo} from "./entity/Photo";

createConnection(/*...*/).then(async connection => {

    /*...*/
    let savedPhotos = await connection.manager.find(Photo);
    console.log("All photos from the db: ", savedPhotos);

}).catch(error => console.log(error));
```

savedPhotos 会从数据库中取到的是一个Photo对象的数组

### 使用Repositories

现在重构下代码，使用`Repository`来代替EntityManage。每个实体都有自己的repository，可以对这个实体进行任何操作。
如果要对实体做很多操作，Repositories会比EntityManager更加方便。

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
 
### 从数据库中取photos

现在来尝试用Repository做一些取数据方面的操作:

```typescript
import {createConnection} from "typeorm";
import {Photo} from "./entity/Photo";

createConnection(/*...*/).then(async connection => {

    /*...*/
    let allPhotos = await photoRepository.find();
    console.log("All photos from the db: ", allPhotos);

    let firstPhoto = await photoRepository.findOne(1);
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

### 更新photo

现在来从数据库中取出一个photo，修改并更新到数据库。

```typescript
import {createConnection} from "typeorm";
import {Photo} from "./entity/Photo";

createConnection(/*...*/).then(async connection => {

    /*...*/
    let photoToUpdate = await photoRepository.findOne(1);
    photoToUpdate.name = "Me, my friends and polar bears";
    await photoRepository.save(photoToUpdate);

}).catch(error => console.log(error));
```

这个`id = 1`的photo在数据库中就成功更新了.

### 删除photo

再来，从数据库中删除我们的photo:


```typescript
import {createConnection} from "typeorm";
import {Photo} from "./entity/Photo";

createConnection(/*...*/).then(async connection => {

    /*...*/
    let photoToRemove = await photoRepository.findOne(1);
    await photoRepository.remove(photoToRemove);

}).catch(error => console.log(error));
``` 

这个`id = 1`的photo就在数据库中被移除了。

### 一对一关系

来创建与另一个类的一对一关系。
新建PhotoMetadata.ts用来存photo的元信息。

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

这里我们用到了一个新的装饰器`@OneToOne`，它可以用来在两个实体之间创建一对一关系。
`type => Photo`指示了我们想要连接的实体类名，这里因为TypeScript语言的支持原因不能直接用类名。
当然也可以使用`() => Photo`，但是`type => Photo`显得更有可读性。
Type变量本身并不包含任何东西。

我们同样使用了`@JoinColumn`装饰器，这个装饰器可以指定一对一关系的拥有者。
关系可以是单向的或双向的，但是只有一方是拥有者，加个这个装饰器就表示关系是给这个表服务的。

现在运行app，会新创建一个table，这个table有一个连接photo的外键：

```shell
+-------------+--------------+----------------------------+
|                      photo `译者注：应该是PhotoMetadata` |
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

### 存一个有一对一关系的对象

现在来创建一个photo，一个photo的元信息，并把它们已经连接起来。

```typescript
import {createConnection} from "typeorm";
import {Photo} from "./entity/Photo";
import {PhotoMetadata} from "./entity/PhotoMetadata";

createConnection(/*...*/).then(async connection => {

    // 创建一个photo
    let photo = new Photo();
    photo.name = "Me and Bears";
    photo.description = "I am near polar bears";
    photo.filename = "photo-with-bears.jpg"
    photo.isPublished = true;

    // 创建一个photo的元信息
    let  metadata = new PhotoMetadata();
    metadata.height = 640;
    metadata.width = 480;
    metadata.compressed = true;
    metadata.comment = "cybershoot";
    metadata.orientation = "portait";
    metadata.photo = photo; // 这里把两者连起来

    // 获取实体repositories
    let photoRepository = connection.getRepository(Photo);
    let metadataRepository = connection.getRepository(PhotoMetadata);

    // 先来把photo存到数据库
    await photoRepository.save(photo);

    // photo存完了，再存下photo的元信息
    await metadataRepository.save(metadata);

    // 搞定
    console.log("metadata is saved, and relation between metadata and photo is created in the database too");

}).catch(error => console.log(error));
```
 
### 双向关系

关系可以是单向的或是双向的. 
现在PhotoMetadata和Photo的关系是单向的，关系拥有者是PhotoMetadata，Photo并不知道PhotoMetadata，这样如果要想从Photo里得到PhotoMetadata的数据会比较麻烦。
现在来改变一下，把单向改成双向：

```typescript
import {Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn} from "typeorm";
import {Photo} from "./Photo";

@Entity()
export class PhotoMetadata {

    /* ... 其他列 */

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

    /* ... 其他列 */

    @OneToOne(type => PhotoMetadata, photoMetadata => photoMetadata.photo)
    metadata: PhotoMetadata;
}
```  

`photo => photo.metadata` 是用来指定反向关系的字段名字，photo.metadata就指出了Photo里的metadata字段名字。
当然也可以使用`@OneToOne('metadata')`来达到同样的目的，不过这种对于以后的代码重构不友好。

按上面说的，`@JoinColumn`只能在关系的一边使用来使这边做为关系的拥有者，关系拥有者在数据库里的表现就是拥有一个外键列。

### 取出关系对象的数据

现在来用一个查询来取出photo以及它的元信息。
有两种方式，一是用`FindOptions`，另一个是使用`QueryBuilder`。
先试下`FindOptions`，通过指定`FindOptions`接口作为参数来使用`Repository.find`方法可以完成非常复杂的查询。

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
返回的photos是从数据库里取回的photo的数组，每个photo都包含它的元信息。

`alias` 是FindOptions的一个必需选项，这是你自己在select里定义的别名，然后需要用在接下来的 where, order by, group by, join 以及其他表达式.

这里还用到了`innerJoinAndSelect`，表示内联查询photo.metadata的数据。 
`"photo.metadata"`里"photo"是一个别名，"metadata"则是你想查询的那个对象的属性名。 
`"metadata"`: 是内联返回数据的新的别名.

下面来尝试第二种方式：`QueryBuilder`来达到同样的目的. 使用`QueryBuilder`可以优雅完成复杂的查询:

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

### 使用 cascade 选项来自动保存关系着的对象

上面要保存关系对象需要一个一个来保存，略显麻烦。
如果我们需要当关系对象中的一个被保存后，另一个也同样被保存，则可以使用`cascade`选项来做到。
稍微改下`@OneToOne`装饰:

```typescript
export class Photo {
    /// ... 其他列

    @OneToOne(type => PhotoMetadata, metadata => metadata.photo, {
        cascade: true,
    })
    metadata: PhotoMetadata;
}
```

使用cascade就可以不需要像上面那边先存photo再存metadata了。
现在我们来单单存photo对象，由于cascade的作用，metadata也会自动存上。

```typescript
createConnection(options).then(async connection => {

    // 创建photo对象
    let photo = new Photo();
    photo.name = "Me and Bears";
    photo.description = "I am near polar bears";
    photo.filename = "photo-with-bears.jpg"
    photo.isPublished = true;

    // 创建photo metadata 对象
    let metadata = new PhotoMetadata();
    metadata.height = 640;
    metadata.width = 480;
    metadata.compressed = true;
    metadata.comment = "cybershoot";
    metadata.orientation = "portait";
    
    photo.metadata = metadata; // 连接起来

    // 得到repository
    let photoRepository = connection.getRepository(Photo);

    // 存photo
    await photoRepository.save(photo);
    // photo metadata也自动存上了
    console.log("Photo is saved, photo metadata is saved too.")

}).catch(error => console.log(error));
```     

### 多对一/一对多关系

接下来显示多对一/一对多关系。
假设一个photo会有一个author，并且每个author可以有很多photo。
先创建Author实体：

```typescript
import {Entity, Column, PrimaryGeneratedColumn, OneToMany, JoinColumn} from "typeorm";
import {Photo} from "./Photo";

@Entity()
export class Author {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Photo, photo => photo.author) // 备注：下面会为Photo创建author属性
    photos: Photo[];
}
```

Author包含一个反向的关系，`OneToMany`总是反向的，并且总是与`ManyToOne`成对出现。

现在来为Photo加上关系拥有者。

```typescript
import {Entity, Column, PrimaryGeneratedColumn, ManyToOne} from "typeorm";
import {PhotoMetadata} from "./PhotoMetadata";
import {Author} from "./Author";

@Entity()
export class Photo {

    /* ... 其他列 */

    @ManyToOne(type => Author, author => author.photos)
    author: Author;
}
```

在`ManyToOne/OneToMany`关系中，拥有者一边总是`ManyToOne`。`译者注：拥有外键者即关系拥有者`
也就是`ManyToOne`的那个字段存的是另一个对象的id。`译者注：也就是上面的author虽然属性是Author，但在数据库中类型是Author id的类型，存的也是id`

执行上面的代码将会自动创建author表，如下:


```shell
+-------------+--------------+----------------------------+
|                          author                         |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| name        | varchar(255) |                            |
+-------------+--------------+----------------------------+
```

因为photo表已经存在，所以不是增加而是修改photo表 - 添加一个新外键列author:

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
   
### 多对多关系

假设photo可以存在多个相册中，并且相册里可以包含多个photo。
先创建一个`Album`类 

```typescript
import {Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable} from "typeorm";

@Entity()
export class Album {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany(type => Photo, photo => photo.albums, {  // 备注: 会在下面的Photo类里添加"albums"属性
        cascade:true
    })
    @JoinTable()
    photos: Photo[];
}
```
  
`@JoinTable`多对多关系拥有者必须指定的。

接着给`Photo`实体加个反向关系:

```typescript
export class Photo {
    /// ... 其他列

    @ManyToMany(type => Album, album => album.photos, {
        cascade: true
    })
    albums: Album[];
}
```

执行上面的代码后会自动创建一个叫 **album_photos_photo_albums**的*联接表*:

```shell
+-------------+--------------+----------------------------+
|                album_photos_photo_albums                |
+-------------+--------------+----------------------------+
| album_id_1  | int(11)      | PRIMARY KEY FOREIGN KEY    |
| photo_id_2  | int(11)      | PRIMARY KEY FOREIGN KEY    |
+-------------+--------------+----------------------------+
```

记得把`Album`实体加到ConnectionOptions中:

```typescript
const options: CreateConnectionOptions = {
    // ... 其他配置
    entities: [Photo, PhotoMetadata, Author, Album]
};
```

现在来往数据库里插入albums和photos        

```typescript
let connection = await createConnection(options);

// 创建两个albums
let album1 = new Album();
album1.name = "Bears";

let album2 = new Album();
album2.name = "Me";

// 创建两个photos
let photo1 = new Photo();
photo1.name = "Me and Bears";
photo1.description = "I am near polar bears";
photo1.filename = "photo-with-bears.jpg";
photo1.albums = [album1];

let photo2 = new Photo();
photo2.name = "Me and Bears";
photo2.description = "I am near polar bears";
photo2.filename = "photo-with-bears.jpg";
photo2.albums = [album2];

// 获取Photo的repository
let photoRepository = connection.getRepository(Photo);

// 依次存储photos，由于cascade，albums也同样会自动存起来
await photoRepository.save(photo1);
await photoRepository.save(photo2);

console.log("Both photos have been saved");
```

### 使用QueryBuilder

可以利用QueryBuilder来构建一个非常复杂的查询，例如：

```typescript
let photoRepository = connection.getRepository(Photo);
let photos = await photoRepository
    .createQueryBuilder("photo") // 别名，必填项，用来指定本次查询
    .innerJoinAndSelect("photo.metadata", "metadata")
    .leftJoinAndSelect("photo.albums", "albums")
    .where("photo.isPublished=true")
    .andWhere("(photo.name=:photoName OR photo.name=:bearName)")
    .orderBy("photo.id", "DESC")
    .skip(5)
    .take(10)
    .setParameters({ photoName: "My", bearName: "Mishka" })
    .getMany();
```

这个查询会查找已经published的，并且name是"My"或"Mishka"，
得到的结果会从第5个开始（分页偏移决定的），
并且只会得到10个结果（分页每页个数决定的），
所得结果是以id的倒序排序的，
Photo的albums是左联接，photo的metadata是内联接。
