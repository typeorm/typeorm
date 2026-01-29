# Entity Inheritance

## Concrete Table Inheritance

You can reduce duplication in your code by using entity inheritance patterns.
The simplest and the most effective is concrete table inheritance.

For example, you have `Photo`, `Question`, `Post` entities:

```typescript
@Entity()
export class Photo {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    description: string

    @Column()
    size: string
}
```

```typescript
@Entity()
export class Question {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    description: string

    @Column()
    answersCount: number
}
```

```typescript
@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    description: string

    @Column()
    viewCount: number
}
```

As you can see all those entities have common columns: `id`, `title`, `description`.
To reduce duplication and produce a better abstraction we can create a base class called `Content` for them:

```typescript
export abstract class Content {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    description: string
}
```

```typescript
@Entity()
export class Photo extends Content {
    @Column()
    size: string
}
```

```typescript
@Entity()
export class Question extends Content {
    @Column()
    answersCount: number
}
```

```typescript
@Entity()
export class Post extends Content {
    @Column()
    viewCount: number
}
```

All columns (relations, embeds, etc.) from parent entities (parent can extend other entity as well)
will be inherited and created in final entities.

This example will create 3 tables - `photo`, `question` and `post`.

### Overriding Column Options in Inherited Entities

When using inheritance, you may want to override column options defined in a base or abstract class in your child entity. TypeORM allows you to override the options of a `@Column` decorator in a subclass by redeclaring the property with a new `@Column` decorator. The child entity's column options will take precedence over those defined in the parent class.

**Example:**

```typescript
export abstract class BaseContent {
    @Column({ length: 100, nullable: false })
    title: string
}

@Entity()
export class Article extends BaseContent {
    @Column({ length: 255 }) // This overrides the length from the base class
    title: string
}
```

In this example, the `Article` entity will have a `title` column with a length of 255 and `nullable` set to false, overriding the length of 100 defined in the `BaseContent` class. This works for all column options, such as type, nullable, default, etc.

## Single Table Inheritance

TypeORM also supports single table inheritance.
Single table inheritance is a pattern when you have multiple classes with their own properties,
but in the database they are stored in the same table.

```typescript
@Entity()
@TableInheritance({ column: { type: "varchar", name: "type" } })
export class Content {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    description: string
}
```

```typescript
@ChildEntity()
export class Photo extends Content {
    @Column()
    size: string
}
```

```typescript
@ChildEntity()
export class Question extends Content {
    @Column()
    answersCount: number
}
```

```typescript
@ChildEntity()
export class Post extends Content {
    @Column()
    viewCount: number
}
```

This will create a single table called `content` and all instances of photos, questions and posts
will be saved into this table.

## Using embeddeds

There is an amazing way to reduce duplication in your app (using composition over inheritance) by using `embedded columns`.
Read more about embedded entities [here](./2-embedded-entities.md).
