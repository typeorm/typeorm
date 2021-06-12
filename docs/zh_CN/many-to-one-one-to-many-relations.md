# 多对一/一对多的关系

多对一/一对多是指 A 包含多个 B 实例的关系，但 B 只包含一个 A 实例。
让我们以`User` 和 `Photo` 实体为例。
User 可以拥有多张 photos，但每张 photo 仅由一位 user 拥有。

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { User } from "./User";

@Entity()
export class Photo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @ManyToOne(() => User, user => user.photos)
  user: User;
}
```

```typescript
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Photo } from "./Photo";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Photo, photo => photo.user)
  photos: Photo[];
}
```

这里我们将`@OneToMany`添加到`photos`属性中，并将目标关系类型指定为`Photo`。
你可以在`@ManyToOne` / `@OneToMany`关系中省略`@JoinColumn`，除非你需要自定义关联列在数据库中的名称。
`@ManyToOne`可以单独使用，但`@OneToMany`必须搭配`@ManyToOne`使用。
如果你想使用`@OneToMany`，则需要`@ManyToOne`。
在你设置`@ManyToOne`的地方，相关实体将有"关联 id"和外键。

此示例将生成以下表：

```bash
+-------------+--------------+----------------------------+
|                         photo                           |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| url         | varchar(255) |                            |
| userId      | int(11)      |                            |
+-------------+--------------+----------------------------+

+-------------+--------------+----------------------------+
|                          user                           |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| name        | varchar(255) |                            |
+-------------+--------------+----------------------------+
```

如何保存这种关系：

```typescript
const photo1 = new Photo();
photo1.url = "me.jpg";
await connection.manager.save(photo1);

const photo2 = new Photo();
photo2.url = "me-and-bears.jpg";
await connection.manager.save(photo2);

const user = new User();
user.name = "John";
user.photos = [photo1, photo2];
await connection.manager.save(user);
```

或者你可以选择：

```typescript
const user = new User();
user.name = "Leo";
await connection.manager.save(user);

const photo1 = new Photo();
photo1.url = "me.jpg";
photo1.user = user;
await connection.manager.save(photo1);

const photo2 = new Photo();
photo2.url = "me-and-bears.jpg";
photo2.user = user;
await connection.manager.save(photo2);
```

启用级联后，只需一次`save`调用即可保存此关系。

要在内部加载带有 photos 的 user，必须在`FindOptions`中指定关系：

```typescript
const userRepository = connection.getRepository(User);
const users = await userRepository.find({ relations: ["photos"] });

// or from inverse side

const photoRepository = connection.getRepository(Photo);
const photos = await photoRepository.find({ relations: ["user"] });
```

或者使用`QueryBuilder`:

```typescript
const users = await connection
  .getRepository(User)
  .createQueryBuilder("user")
  .leftJoinAndSelect("user.photos", "photo")
  .getMany();

// or from inverse side

const photos = await connection
  .getRepository(Photo)
  .createQueryBuilder("photo")
  .leftJoinAndSelect("photo.user", "user")
  .getMany();
```

通过在关系上启用预先加载，你不必指定关系或手动加入,它将始终自动加载。
