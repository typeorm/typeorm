# 一对一

一对一是一种 A 只包含一个 B 实例，而 B 只包含一个 A 实例的关系。
我们以`User`和`Profile`实体为例。

用户只能拥有一个配置文件，并且一个配置文件仅由一个用户拥有。

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  gender: string;

  @Column()
  photo: string;
}
```

```typescript
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { Profile } from "./Profile";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToOne(() => Profile)
  @JoinColumn()
  profile: Profile;
}
```

这里我们将`@OneToOne`添加到`profile`并将目标关系类型指定为`Profile`。
我们还添加了`@JoinColumn`，这是必选项并且只能在关系的一侧设置。
你设置`@JoinColumn`的哪一方，哪一方的表将包含一个"relation id"和目标实体表的外键。

此示例将生成以下表：

```bash
+-------------+--------------+----------------------------+
|                        profile                          |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| gender      | varchar(255) |                            |
| photo       | varchar(255) |                            |
+-------------+--------------+----------------------------+

+-------------+--------------+----------------------------+
|                          user                           |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| name        | varchar(255) |                            |
| profileId   | int(11)      | FOREIGN KEY                |
+-------------+--------------+----------------------------+
```

同样，`@JoinColumn`必须仅设置在关系的一侧且必须在数据库表中具有外键的一侧。

该例子展示如何保存这样的关系：

```typescript
const profile = new Profile();
profile.gender = "male";
profile.photo = "me.jpg";
await connection.manager.save(profile);

const user = new User();
user.name = "Joe Smith";
user.profile = profile;
await connection.manager.save(user);
```

启用级联后，只需一次`save`调用即可保存此关系。

要加载带有配置文件的用户，必须在`FindOptions`中指定关系：

```typescript
const userRepository = connection.getRepository(User);
const users = await userRepository.find({ relations: ["profile"] });
```

或者使用`QueryBuilder`:

```typescript
const users = await connection
  .getRepository(User)
  .createQueryBuilder("user")
  .leftJoinAndSelect("user.profile", "profile")
  .getMany();
```

通过在关系上启用预先加载，你不必指定关系或手动加入，它将始终自动加载。

关系可以是单向的和双向的。
单向是仅在一侧与关系装饰器的关系。
双向是与关系两侧的装饰者的关系。

我们刚刚创建了一个单向关系。 让我们将它改为双向：

```typescript
import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from "typeorm";
import { User } from "./User";

@Entity()
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  gender: string;

  @Column()
  photo: string;

  @OneToOne(() => User, user => user.profile) // 将另一面指定为第二个参数
  user: User;
}
```

```typescript
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { Profile } from "./Profile";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToOne(() => Profile, profile => profile.user) // 指定另一面作为第二个参数
  @JoinColumn()
  profile: Profile;
}
```

我们只是创建了双向关系。 注意，反向关系没有`@JoinColumn`。
`@JoinColumn`必须只在关系的一侧且拥有外键的表上。

双向关系允许你使用`QueryBuilder`从双方加入关系：

```typescript
const profiles = await connection
  .getRepository(Profile)
  .createQueryBuilder("profile")
  .leftJoinAndSelect("profile.user", "user")
  .getMany();
```
