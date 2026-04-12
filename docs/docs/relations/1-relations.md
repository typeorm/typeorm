# Relations

## What are relations?

Relations helps you to work with related entities easily.
There are several types of relations:

- [one-to-one](./2-one-to-one-relations.md) using `@OneToOne`
- [many-to-one](./3-many-to-one-one-to-many-relations.md) using `@ManyToOne`
- [one-to-many](./3-many-to-one-one-to-many-relations.md) using `@OneToMany`
- [many-to-many](./4-many-to-many-relations.md) using `@ManyToMany`

## Relation options

There are several options you can specify for relations:

- `eager: boolean` (default: `false`) - If set to true, the relation will always be loaded with the main entity when using `find*` methods or `QueryBuilder` on this entity
- `cascade: boolean | ("insert" | "update")[]` (default: `false`) - If set to true, the related object will be inserted and updated in the database. You can also specify an array of [cascade options](#cascade-options).
- `onDelete: "RESTRICT"|"CASCADE"|"SET NULL"` (default: `RESTRICT`) - specifies how foreign key should behave when referenced object is deleted
- `deferrable: "INITIALLY DEFERRED"|"INITIALLY IMMEDIATE"` - When set, foreign key constraints are deferrable (e.g. validated at commit time). For many-to-many relations this applies to both junction-table foreign keys. Supported on PostgreSQL, better-sqlite3, and SAP HANA.
- `nullable: boolean` (default: `true`) - Indicates whether this relation's column is nullable or not. By default it is nullable. For `ManyToOne` and owning `OneToOne` relations, setting `nullable: false` also causes TypeORM to use `INNER JOIN` instead of `LEFT JOIN` when loading the relation, since the related entity is guaranteed to exist.
- `orphans: "nullify" | "delete" | "soft-delete" | "disable"` (default: `nullify`) - Applies to `@OneToMany` relations. Controls what happens to children removed from the collection when the parent is saved. See [Orphaned row handling](#orphaned-row-handling).

## Cascades

Cascades example:

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm"
import { Question } from "./Question"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToMany((type) => Question, (question) => question.categories)
    questions: Question[]
}
```

```typescript
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToMany,
    JoinTable,
} from "typeorm"
import { Category } from "./Category"

@Entity()
export class Question {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    text: string

    @ManyToMany((type) => Category, (category) => category.questions, {
        cascade: true,
    })
    @JoinTable()
    categories: Category[]
}
```

```typescript
const category1 = new Category()
category1.name = "ORMs"

const category2 = new Category()
category2.name = "Programming"

const question = new Question()
question.title = "How to ask questions?"
question.text = "Where can I ask TypeORM-related questions?"
question.categories = [category1, category2]
await dataSource.manager.save(question)
```

As you can see in this example we did not call `save` for `category1` and `category2`.
They will be automatically inserted, because we set `cascade` to true.

Keep in mind - great power comes with great responsibility.
Cascades may seem like a good and easy way to work with relations,
but they may also bring bugs and security issues when some undesired object is being saved into the database.
Also, they provide a less explicit way of saving new objects into the database.

### Cascade Options

The `cascade` option can be set as a `boolean` or an array of cascade options `("insert" | "update" | "remove" | "soft-remove" | "recover")[]`.

It will default to `false`, meaning no cascades. Setting `cascade: true` will enable full cascades. You can also specify options by providing an array.

For example:

```typescript
@Entity(Post)
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    text: string

    // Full cascades on categories.
    @ManyToMany((type) => PostCategory, {
        cascade: true,
    })
    @JoinTable()
    categories: PostCategory[]

    // Cascade insert here means if there is a new PostDetails instance set
    // on this relation, it will be inserted automatically to the db when you save this Post entity
    @ManyToMany((type) => PostDetails, (details) => details.posts, {
        cascade: ["insert"],
    })
    @JoinTable()
    details: PostDetails[]

    // Cascade update here means if there are changes to an existing PostImage, it
    // will be updated automatically to the db when you save this Post entity
    @ManyToMany((type) => PostImage, (image) => image.posts, {
        cascade: ["update"],
    })
    @JoinTable()
    images: PostImage[]

    // Cascade insert & update here means if there are new PostInformation instances
    // or an update to an existing one, they will be automatically inserted or updated
    // when you save this Post entity
    @ManyToMany((type) => PostInformation, (information) => information.posts, {
        cascade: ["insert", "update"],
    })
    @JoinTable()
    informations: PostInformation[]
}
```

:::note Cascade remove
When using `cascade: ["remove"]` or `cascade: true`, calling `manager.remove(entity)` will also remove related entities that are loaded on the entity instance. TypeORM only traverses relations that are populated on the object — if a relation is not loaded, its children will not be cascade-removed. Make sure to load relations before removing:

```typescript
const post = await manager.findOne(Post, {
    where: { id: 1 },
    relations: { categories: true },
})
await manager.remove(post) // categories will also be removed
```

:::

## Orphaned row handling

When you save a parent entity with a `@OneToMany` relation and some children that were previously in the database are no longer in the collection, those missing children are called **orphans**. The `orphans` option controls what happens to them.

TypeORM only detects orphans among children that are **loaded** on the entity. If the relation is not loaded (the property is `undefined`), no orphan handling occurs. Always load the relation before saving.

:::warning
Be careful when combining `orphans` with `eager: true`. Eagerly loaded relations are always populated when you load the parent, which means orphan handling can trigger unexpectedly — for example, if you modify the parent's fields and save it, any child you omitted from the collection before saving will be treated as an orphan.
:::

```typescript
@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToMany(() => Post, (post) => post.category, {
        orphans: "delete",
    })
    posts: Post[]
}
```

```typescript
const category = await manager.findOne(Category, {
    where: { id: 1 },
    relations: { posts: true },
})
category.posts = category.posts.filter((post) => post.id !== 2) // remove post #2
await manager.save(category) // post #2 is now an orphan — action is applied
```

### Available actions

| Action          | Behavior                                                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `"nullify"`     | Sets the foreign key to `null` on the orphaned child. If the FK column is non-nullable, the orphaned row is deleted instead. |
| `"delete"`      | Removes the orphaned row from the database.                                                                                  |
| `"soft-delete"` | Marks the orphaned row as soft-deleted (requires `@DeleteDateColumn` on the child entity).                                   |
| `"disable"`     | Skips orphan handling entirely — the relation is left intact.                                                                |

:::warning Deprecation notice
When `orphans` is not set, TypeORM currently defaults to `"nullify"` for backward compatibility and logs a deprecation warning the first time an orphan is processed for that relation. In the next major version this default will change — unset will mean "no action". Always set `orphans` explicitly to the value you want. The `"disable"` value will also be removed in the next major since it becomes redundant with unset. See [#12343](https://github.com/typeorm/typeorm/issues/12343).
:::

## `@JoinColumn` options

`@JoinColumn` not only defines which side of the relation contains the join column with a foreign key,
but also allows you to customize join column name and referenced column name.

When we set `@JoinColumn`, it automatically creates a column in the database named `propertyName + referencedColumnName`.
For example:

```typescript
@ManyToOne(type => Category)
@JoinColumn() // this decorator is optional for @ManyToOne, but required for @OneToOne
category: Category;
```

This code will create a `categoryId` column in the database.
If you want to change this name in the database you can specify a custom join column name:

```typescript
@ManyToOne(type => Category)
@JoinColumn({ name: "cat_id" })
category: Category;
```

Join columns are always a reference to some other columns (using a foreign key).
By default your relation always refers to the primary column of the related entity.
If you want to create relation with other columns of the related entity -
you can specify them in `@JoinColumn` as well:

```typescript
@ManyToOne(type => Category)
@JoinColumn({ referencedColumnName: "name" })
category: Category;
```

The relation now refers to `name` of the `Category` entity, instead of `id`.
Column name for that relation will become `categoryName`.

You can also join multiple columns. Note that they do not reference the primary column of the related entity by default: you must provide the referenced column name.

```typescript
@ManyToOne(type => Category)
@JoinColumn([
    { name: "category_id", referencedColumnName: "id" },
    { name: "locale_id", referencedColumnName: "locale_id" }
])
category: Category;
```

> **Note:** When using composite `@JoinColumn` or `@JoinTable`, TypeORM automatically sorts the foreign key columns to match the referenced entity's primary key order. This ensures compatibility with databases like MySQL, MSSQL, and SAP HANA that require FK columns to reference PK columns in index order.

## `@JoinTable` options

`@JoinTable` is used for `many-to-many` relations and describes join columns of the "junction" table.
A junction table is a special separate table created automatically by TypeORM with columns that refer to the related entities.
You can change column names inside junction tables and their referenced columns with `@JoinColumn`:
You can also change the name of the generated "junction" table.

```typescript
@ManyToMany(type => Category)
@JoinTable({
    name: "question_categories", // table name for the junction table of this relation
    joinColumn: {
        name: "question",
        referencedColumnName: "id"
    },
    inverseJoinColumn: {
        name: "category",
        referencedColumnName: "id"
    }
})
categories: Category[];
```

If the destination table has composite primary keys,
then an array of properties must be sent to `@JoinTable`.
