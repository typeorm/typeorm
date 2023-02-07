# 多对多的关系

多对多是一种 A 包含多个 B 实例，而 B 包含多个 A 实例的关系。
我们以`Question` 和 `Category` 实体为例。
Question 可以有多个 categories, 每个 category 可以有多个 questions。

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
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

  @ManyToMany(() => Category)
  @JoinTable()
  categories: Category[];
}
```

`@JoinTable()`是`@ManyToMany`关系所必需的。
你必须把`@JoinTable`放在关系的一个（拥有）方面。

此示例将生成以下表：

```bash
+-------------+--------------+----------------------------+
|                        category                         |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| name        | varchar(255) |                            |
+-------------+--------------+----------------------------+

+-------------+--------------+----------------------------+
|                        question                         |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| title       | varchar(255) |                            |
+-------------+--------------+----------------------------+

+-------------+--------------+----------------------------+
|              question_categories_category               |
+-------------+--------------+----------------------------+
| questionId  | int(11)      | PRIMARY KEY FOREIGN KEY    |
| categoryId  | int(11)      | PRIMARY KEY FOREIGN KEY    |
+-------------+--------------+----------------------------+
```

如何保存这种关系：

```typescript
const category1 = new Category();
category1.name = "animals";
await connection.manager.save(category1);

const category2 = new Category();
category2.name = "zoo";
await connection.manager.save(category2);

const question = new Question();
question.categories = [category1, category2];
await connection.manager.save(question);
```

启用级联后，只需一次`save`调用即可保存此关系。

要在 categories 里面加载 question，你必须在`FindOptions`中指定关系：

```typescript
const questionRepository = connection.getRepository(Question);
const questions = await questionRepository.find({ relations: ["categories"] });
```

或者使用`QueryBuilder`

```typescript
const questions = await connection
  .getRepository(Question)
  .createQueryBuilder("question")
  .leftJoinAndSelect("question.categories", "category")
  .getMany();
```

通过在关系上启用预先加载，你不必指定关系或手动加入，它将始终自动加载。

关系可以是单向的和双向的。
单向是仅在一侧与关系装饰器的关系。
双向是与关系两侧的装饰者的关系。

我们刚刚创建了一个单向关系。 让我们改为双向：

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import { Question } from "./Question";

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToMany(() => Question, question => question.categories)
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

  @ManyToMany(() => Category, category => category.questions)
  @JoinTable()
  categories: Category[];
}
```

我们只是创建了双向关系。 注意，反向关系没有`@JoinTable`。
`@JoinTable`必须只在关系的一边。

双向关系允许您使用`QueryBuilder`从双方加入关系：

```typescript
const categoriesWithQuestions = await connection
  .getRepository(Category)
  .createQueryBuilder("category")
  .leftJoinAndSelect("category.questions", "question")
  .getMany();
```
