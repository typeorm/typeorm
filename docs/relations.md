# Relations

* [What are relations](#what-are-relations)
* [Relation options](#relation-options)
* [Cascades](#cascades)
* [`@JoinColumn` options](#joincolumn-options)
* [`@JoinTable` options](#jointable-options)

## What are relations

Relations helps you to work with related entities easily. 
There are several types of relations:

* [one-to-one](./one-to-one-relations.md) using `@OneToOne`
* [many-to-one](./many-to-one-one-to-many-relations.md) using `@ManyToOne`
* [one-to-many](./many-to-one-one-to-many-relations.md) using `@OneToMany`
* [many-to-many](./many-to-many-relations.md) using `@ManyToMany`
          
## Relation options

There are several options you can specify for relations:

* `eager: boolean` - If set to true, the relation will always be loaded with the main entity when using `find*` methods or `QueryBuilder` on this entity 
* `cascade: boolean` - If set to true, the related object will be inserted and update in the database.
* `onDelete: "RESTRICT"|"CASCADE"|"SET NULL"` - specifies how foreign key should behave when referenced object is deleted
* `primary: boolean` - Indicates whether this relation's column will be a primary column or not.
* `nullable: boolean` - Indicates whether this relation's column is nullable or not. By default it is nullable.

## Cascades

Cascades example:

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
    
    @ManyToMany(type => Category, category => category.questions, {
        cascade: true
    })
    @JoinTable()
    categories: Category[];
    
}
```

```typescript
const category1 = new Category();
category1.name = "animals";

const category2 = new Category();
category2.name = "zoo";

const question = new Question();
question.categories = [category1, category2];
await connection.manager.save(question);
```

As you can see in this example we did not call `save` for `category1` and `category2`.
They will be automatically inserted, because we set `cascade` to true.

Keep in mind - great power comes with great responsibility.
Cascades may seem like a good and easy way to work with relations,
but they may also bring bugs and security issues when some undesired object is being saved into the database. 
Also, they provide a less explicit way of saving new objects into the database.

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
Column name for that relation will become `categoryName`

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
