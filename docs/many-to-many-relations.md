# Many-to-many relations

Many-to-many is a relation where A contains multiple instances of B, and B contain multiple instances of A.
Let's take for example `Question` and `Category` entities.
Question can have multiple categories, and each category can have multiple questions.

```typescript
import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}
```

```typescript
import {Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable} from "typeorm";
import {Category} from "./Category";

@Entity()
export class Question {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @ManyToMany(type => Category)
    @JoinTable()
    categories: Category[];

}
```

`@JoinTable()` is required for `@ManyToMany` relations.
You must put `@JoinTable` on one (owning) side of relation.

This example will produce following tables:

```shell
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

Example how to save such relation:

```typescript
const category1 = new Category();
category1.name = "animals";
await connection.manager.save(category1);

const category2 = new Category();
category2.name = "zoo";
await connection.manager.save(category2);

const question = new Question();
question.title = "dogs";
question.text = "who let the dogs out?";
question.categories = [category1, category2];
await connection.manager.save(question);
```

With cascades enabled you can save this relation with only one `save` call.

To load question with categories inside you must specify relation in `FindOptions`:

```typescript
const questionRepository = connection.getRepository(Question);
const questions = await questionRepository.find({ relations: ["categories"] });
```

Or using `QueryBuilder` you can join them:

```typescript
const questions = await connection
    .getRepository(Question)
    .createQueryBuilder("question")
    .leftJoinAndSelect("question.categories", "category")
    .getMany();
```

With eager loading enabled on a relation you don't have to specify relation or join it - it will ALWAYS be loaded automatically.

Relations can be uni-directional and bi-directional.
Uni-directional are relations with a relation decorator only on one side.
Bi-directional are relations with decorators on both sides of a relation.

We just created a uni-directional relation. Let's make it bi-directional:

```typescript
import {Entity, PrimaryGeneratedColumn, Column, ManyToMany} from "typeorm";
import {Question} from "./Question";

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
import {Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable} from "typeorm";
import {Category} from "./Category";

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
    categories: Category[];

}
```

We just made our relation bi-directional. Note, the inverse relation does not have a `@JoinTable`.
`@JoinTable` must be only on one side of the relation.

Bi-directional relations allow you to join relations from both sides using `QueryBuilder`:

```typescript
const categoriesWithQuestions = await connection
    .getRepository(Category)
    .createQueryBuilder("category")
    .leftJoinAndSelect("category.questions", "question")
    .getMany();
```

## many-to-many relations with custom properties

In case you need to have additional properties to your many-to-many relationship you have to create a new entity yourself. 
For example if you would like entities `Post` and `Category` to have a many-to-many relationship with a `createdAt` property 
associated to it you have to create entity `PostToCategory` like the following:

```typescript
import { Entity, Column, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Post } from "./post";
import { Category } from "./category";

@Entity()
export class PostToCategory {
    @PrimaryGeneratedColumn()
    public postToCategoryId!: number;

    @Column()
    public postId!: number;
    
    @Column()
    public categoryId!: number;

    @Column()
    public order!: number;

    @ManyToOne(type => Post, post => post.postToCategories)
    public post!: Post;

    @ManyToOne(type => Category, category => category.postToCategories)
    public category!: Category;
}
```

Additionally you will have to add a relationship like the following to `Post` and `Category`:

```typescript
// category.ts
...
@OneToMany((type) => PostToCategory, (postToCategory) => postToCategory.category)
public postToCategories!: PostToCategory[];

// post.ts
...
@OneToMany((type) => PostToCategory, (postToCategory) => postToCategory.post)
public postToCategories!: PostToCategory[];
```
