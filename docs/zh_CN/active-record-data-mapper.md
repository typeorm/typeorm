# Active Record 与 Data Mapper

  * [什么是Active Record模式？](#什么是Active-Record模式？)
  * [什么是Data Mapper模式？](#什么是Data-Mapper模式？)
  * [我应该选择哪一个？](#我应该选择哪一个？)

## 什么是Active Record模式？

在 TypeORM 中，你可以使用 Active Record 和 Data Mapper 模式。

使用 Active Record 方法，你可以在模型本身内定义所有查询方法，并使用模型方法保存、删除和加载对象。

简单来说，Active Record 模式是一种在模型中访问数据库的方法。
你可以在[Wikipedia](https://en.wikipedia.org/wiki/Active_record_pattern)上查看有关 Active Record 模式的更多信息。

例如:

```typescript
import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from "typeorm";

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

所有 active-record 实体都必须扩展`BaseEntity`类，它提供了与实体一起使用的方法。

以下示例展示如何使用此类实体：

```typescript
// 示例如何保存AR实体
const user = new User();
user.firstName = "Timber";
user.lastName = "Saw";
user.isActive = true;
await user.save();

// 示例如何删除AR实体
await user.remove();

// 示例如何加载AR实体
const users = await User.find({ skip: 2, take: 5 });
const newUsers = await User.find({ isActive: true });
const timber = await User.findOne({ firstName: "Timber", lastName: "Saw" });
```

`BaseEntity`具有标准`Repository`的大部分方法。
大多数情况下，你不需要将`Repository`或`EntityManager`与 active record 实体一起使用。

现在假设我们要创建一个按 first name 和 last name 返回用户的函数。
我们可以在`User`类中创建静态方法等函数：

```typescript
import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from "typeorm";

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

并像使用其他方法一样使用它：

```typescript
const timber = await User.findByName("Timber", "Saw");
```

## 什么是Data Mapper模式？

在 TypeORM 中，您可以使用 Active Record 和 Data Mapper 模式。

使用 Data Mapper 方法，你可以在名为"repositories"的单独类中定义所有查询方法，并使用存储库保存、删除和加载对象。
在数据映射器中，你的实体非常笨，它们只是定义了相应的属性，并且可能有一些很笨的方法。

简单来说，数据映射器是一种在存储库而不是模型中访问数据库的方法。
你可以在[Wikipedia](https://en.wikipedia.org/wiki/Data_mapper_pattern)上查看更多关于 data mapper 的信息。

例如:

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

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

以下示例展示如何使用此类实体：

```typescript
const userRepository = connection.getRepository(User);

// 示例如何保存DM实体
const user = new User();
user.firstName = "Timber";
user.lastName = "Saw";
user.isActive = true;
await userRepository.save(user);

// 示例如何删除DM实体
await userRepository.remove(user);

// 示例如何加载DM实体
const users = await userRepository.find({ skip: 2, take: 5 });
const newUsers = await userRepository.find({ isActive: true });
const timber = await userRepository.findOne({ firstName: "Timber", lastName: "Saw" });
```

现在假设我们要创建一个按 first name 和 last name 返回用户的函数。
我们可以在"custom repository"中创建这样的功能。

```typescript
import { EntityRepository, Repository } from "typeorm";
import { User } from "../entity/User";

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

并以这种方式使用它：

```typescript
const userRepository = connection.getCustomRepository(UserRepository);
const timber = await userRepository.findByName("Timber", "Saw");
```

了解有关[custom repositories](working-with-entity-manager.md#custom-repositories)的更多信息。

## 我应该选择哪一个？

决定取决于你。
这两种策略都有自己的缺点和优点。

在软件开发中我们应该始终牢记的一件事是我们如何维护它。
`Data Mapper`方法可以帮助你保持软件的可维护性，这在更大的应用程序中更有效。
`Active record`方法可以帮助你保持简单，这在小型应用程序中运行更好。
简单性始终是提高可维护性的关键。
