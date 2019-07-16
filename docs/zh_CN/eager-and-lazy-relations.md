# Eager 和 Lazy 关系

## Eager 关系

每次从数据库加载实体时，都会自动加载 Eager 关系。
例如：

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import { Question } from "./Question";

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToMany(type => Question, question => question.categories)
  questions: Question[];
}
```

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from "typeorm";
import { Category } from "./Category";

@Entity()
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  text: string;

  @ManyToMany(type => Category, category => category.questions, {
    eager: true
  })
  @JoinTable()
  categories: Category[];
}
```

现在当你加载 questions 时，不需要加入或指定要加载的关系。它们将自动加载：

```typescript
const questionRepository = connection.getRepository(Question);

// questions 将加载其类别 categories
const questions = await questionRepository.find();
```

Eager 关系只有在使用`find *`方法时才有效。
如果你使用`QueryBuilder`，则禁用 eager 关系，并且必须使用`leftJoinAndSelect`来加载。
Eager 的关系只能用于关系的一方，在关系的两边使用`eager：true`是不允许的。

## Lazy 关系

当你访问的时候会加载 Lazy 关系中的实体。
这种关系必须有`Promise`作为类型 ，并且将值存储在一个 promise 中，
当你加载它们时，也会返回 promise。 例如：

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import { Question } from "./Question";

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToMany(type => Question, question => question.categories)
  questions: Promise<Question[]>;
}
```

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from "typeorm";
import { Category } from "./Category";

@Entity()
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  text: string;

  @ManyToMany(type => Category, category => category.questions)
  @JoinTable()
  categories: Promise<Category[]>;
}
```

`categories` 是一个 Promise. 这意味着它是 lazy 的，它只能存储一个带有值的 promise。

例如：

保存这种关系：

```typescript
const category1 = new Category();
category1.name = "animals";
await connection.manager.save(category1);

const category2 = new Category();
category2.name = "zoo";
await connection.manager.save(category2);

const question = new Question();
question.categories = Promise.resolve([category1, category2]);
await connection.manager.save(question);
```

如何在 Lazy 关系中加载对象：

```typescript
const question = await connection.getRepository(Question).findOne(1);
const categories = await question.categories;
// you'll have all question's categories inside "categories" variable now
```

注意：如果你来自其他语言（Java，PHP 等）并且习惯于在任何地方使用 lazy 关系，请小心使用。
这些语言不是异步的，延迟加载是以不同的方式实现的，这就是为什么不能使用 promises 的原因。
在 JavaScript 和 Node.JS 中，如果你想拥有延迟加载的关系，你必须使用 promises。
但是这是非标准技术，而且在 TypeORM 中被认为是实验性的。
