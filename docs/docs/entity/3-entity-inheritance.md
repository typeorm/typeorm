# Entity Inheritance

-   [Concrete Table Inheritance](#concrete-table-inheritance)
-   [Single Table Inheritance](#single-table-inheritance)
-   [Class Table Inheritance](#class-table-inheritance)
-   [Using embeddeds](#using-embeddeds)

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

### Eager relations in STI

When using Single Table Inheritance with eager relations on child entities, TypeORM scopes eager loading to the correct child type. This means that eager relations declared on one child entity will not be loaded when querying a sibling child entity.

For example, if `Photo` has an eager relation to `PhotoMetadata` and `Question` has an eager relation to `Answer`:

```typescript
@ChildEntity()
export class Photo extends Content {
    @Column()
    size: string

    @OneToOne(() => PhotoMetadata, { eager: true })
    @JoinColumn()
    metadata: PhotoMetadata
}
```

```typescript
@ChildEntity()
export class Question extends Content {
    @Column()
    answersCount: number

    @OneToOne(() => Answer, { eager: true })
    @JoinColumn()
    topAnswer: Answer
}
```

When loading a `Photo`, only `metadata` is eagerly loaded — the `topAnswer` relation from `Question` is not included. When querying the parent `Content` repository directly, all child-specific eager relations are loaded and assigned to the correct entity instances based on the discriminator column.

## Class Table Inheritance

Class Table Inheritance (also known as Joined Table Inheritance) maps an inheritance hierarchy to **multiple tables joined by primary key**. The parent table holds shared columns and a discriminator, while each child table holds only child-specific columns plus a primary key that is also a foreign key to the parent.

Use `pattern: "CTI"` in the `@TableInheritance` decorator to enable this:

```typescript
@Entity()
@TableInheritance({ pattern: "CTI", column: { type: "varchar", name: "type" } })
export class Actor {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}
```

```typescript
@ChildEntity()
export class User extends Actor {
    @Column()
    email: string
}
```

```typescript
@ChildEntity()
export class Organization extends Actor {
    @Column()
    industry: string
}
```

This creates **three tables**:

- `actor` — columns: `id`, `name`, `type` (discriminator)
- `user` — columns: `id` (FK to `actor.id`), `email`
- `organization` — columns: `id` (FK to `actor.id`), `industry`

When querying a child entity (e.g., `User`), TypeORM automatically generates an `INNER JOIN` to the parent table so all inherited columns are available. When querying the parent entity (`Actor`), only the parent table is queried — child-specific columns are **not** loaded. The correct child class is instantiated based on the discriminator column, but only parent-table columns are populated. To access child-specific data, query the child entity directly.

### Multi-level CTI

CTI supports hierarchies deeper than two levels. For example:

```typescript
@Entity()
@TableInheritance({ pattern: "CTI", column: { type: "varchar", name: "type" } })
export class Actor {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}
```

```typescript
@ChildEntity()
export class Contributor extends Actor {
    @Column()
    reputation: number
}
```

```typescript
@ChildEntity()
export class User extends Contributor {
    @Column()
    email: string
}
```

This creates tables `actor`, `contributor`, and `user`, each with their own columns. Querying `User` will chain `INNER JOIN`s through `contributor` up to `actor` to hydrate all inherited columns.

### Relations in CTI

Relations can be placed at any level of the hierarchy. Each relation's join column is stored on the table where it is declared:

```typescript
@ChildEntity()
export class User extends Actor {
    @Column()
    email: string

    @OneToOne(() => Profile, { eager: true })
    @JoinColumn()
    profile: Profile  // profileId column on `user` table
}
```

```typescript
@ChildEntity()
export class Organization extends Actor {
    @Column()
    industry: string

    @OneToOne(() => License, { eager: true })
    @JoinColumn()
    license: License  // licenseId column on `organization` table
}
```

Eager relations are scoped to the child type — `User`'s eager `profile` will not be loaded when querying `Organization`, and vice versa.

Relations can also be placed on the parent entity. In that case, the join column lives on the parent table and is available to all children:

```typescript
@Entity()
@TableInheritance({ pattern: "CTI", column: { type: "varchar", name: "type" } })
export class Actor {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToOne(() => Tag, { eager: true })
    @JoinColumn()
    tag: Tag  // tagId column on `actor` table, available to all children
}
```

### Custom child table names

By default, CTI child table names are derived from the class name. You can specify a custom table name using the options form of `@ChildEntity`:

```typescript
@ChildEntity({ tableName: "app_users" })
export class User extends Actor {
    @Column()
    email: string
}

@ChildEntity({ discriminatorValue: "Org", tableName: "app_organizations" })
export class Organization extends Actor {
    @Column()
    industry: string
}
```

This creates tables `app_users` and `app_organizations` instead of the default `user` and `organization`. The `discriminatorValue` option sets the value stored in the parent's discriminator column (defaults to the class name if omitted). The `tableName` option only applies to CTI — it is ignored for STI since all children share the parent table.

### Cross-child references

CTI children can reference each other via foreign keys. For example, an `Organization` can have a `User` as CEO, and a `User` can belong to an `Organization`:

```typescript
@ChildEntity()
export class User extends Actor {
    @Column()
    email: string

    @ManyToOne(() => Organization, (org) => org.members, { nullable: true })
    employer: Organization
}

@ChildEntity()
export class Organization extends Actor {
    @Column()
    industry: string

    @OneToMany(() => User, (user) => user.employer)
    members: User[]

    @ManyToOne(() => User, { nullable: true })
    ceo: User
}
```

Self-referential relations are also supported (e.g., a manager hierarchy):

```typescript
@ChildEntity()
export class User extends Actor {
    @Column()
    email: string

    @ManyToOne(() => User, (user) => user.directReports, { nullable: true })
    manager: User

    @OneToMany(() => User, (user) => user.manager)
    directReports: User[]
}
```

### CTI vs STI

| Feature | STI (`pattern: "STI"`) | CTI (`pattern: "CTI"`) |
|---------|----------------------|----------------------|
| Tables | One shared table | One table per entity |
| Nullable columns | Child-specific columns must be nullable | Each table only has its own columns |
| Query performance | No joins needed | Requires joins across tables |
| Schema clarity | All columns in one table | Clean separation of concerns |
| Best for | Few child-specific columns | Many child-specific columns or relations |

### Polymorphic parent queries

When querying a parent or mid-level entity (e.g., `actorRepository.find()`), the query returns polymorphic results with the correct child type instantiated based on the discriminator value. However, **only parent-table columns and parent-level relations are loaded** — child-specific columns and relations are not included:

```typescript
// Parent query — only the parent table is queried:
//   SELECT actor.* FROM actor

const actors = await actorRepository.find()
const user = actors[0] as User
user.name       // ← populated (parent-table column)
user.email      // ← undefined (child-specific column, not loaded)
user.profile    // ← undefined (child-specific relation, not loaded)
```

To access child-specific data, query the child entity directly:

```typescript
const user = await userRepository.findOne({
    where: { id: actors[0].id },
    relations: { profile: true },
})
user.email      // ← populated (child query INNER JOINs parent table)
user.profile    // ← populated (explicitly requested relation)
```

This follows the principle that the parent entity is a standalone entity, not an umbrella that aggregates all child data. Parent queries are lightweight (no child table JOINs), and child data is accessed through child-specific queries.

## Using embeddeds

There is an amazing way to reduce duplication in your app (using composition over inheritance) by using `embedded columns`.
Read more about embedded entities [here](./2-embedded-entities.md).
