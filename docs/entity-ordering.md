# Entity Ordering

-   [Decorators](#decorators)
-   [Priority Ordering](#priority-ordering)
-   [Named Sorting](#named-sorting)
-   [Inherited Property Ordering](#inherited-property-ordering)
-   [Limitations](#limitations)

## Decorators

Column ordering is enabled with the use of the `@Orderable` and `@Order` decorators.
Attach the `@Orderable()` decorator to your classes or entities you wish to sort, and
tag each column you want sorted with the `@Order()` decorator.

## Priority Ordering

Columns tagged with `@Order()` can be sorted with the `priority` prop.
By default, a column without `@Order()`, and a column with `@Order()` but
no priority specified will have a priority of 0.
Lower priorities will be sorted first, so priority 10 will come before priority 100 when columns are created.

```typescript
@Orderable()
@Entity()
export class Photo {
    @PrimaryGeneratedColumn()
    id: number

    @Order({ priority: 3 })
    @Column()
    title: string

    @Order({ priority: 1 })
    @Column()
    description: string

    @Order({ priority: 2 })
    @Column()
    size: string
}
```

The order of the columns in the `Photo` entity will be:
* `id`
* `description`
* `size`
* `title`

## Named Sorting

Columns can also be ordered to come `before` or `after` other columns by setting the
corresponding prop in the `@Order()` decorator.

```typescript
@Orderable()
@Entity()
export class Photo {
    @PrimaryGeneratedColumn()
    id: number

    @Order({ before: 'id' })
    @Column()
    title: string

    @Order({ after: 'size' })
    @Column()
    description: string

    @Column()
    size: string
}
```

The order of the columns in the `Photo` entity will be:
* `title`
* `id`
* `size`
* `description`

## Inherited Property Ordering

Ordering can be applied with base classes.
The base class should still be decorated with `@Orderable()` and columns should be decorated with `@Order()`.

```typescript
@Orderable()
export class TimestampedEntity {
    @Order({ priority: 100 })
    @CreateDateColumn()
    createdAt!: Date

    @Order({ priority: 100 })
    @UpdateDateColumn()
    updatedAt!: Date

    @Order({ priority: 100 })
    @DeleteDateColumn()
    deletedAt!: Date | null
}

@Orderable()
@Entity()
export class Post extends TimestampedEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    description: string
}
```

In the entity `Post`, the order of columns inserted into the database will be:
* `id`
* `title`
* `description`
* `createdAt`
* `updatedAt`
* `deletedAt`

Without column ordering, `typeorm` will read the base entity properties before the properties of the derived entity.

## Limitations

The `Orderable` decorator only functions properly with drivers that respect the initial order that columns are created.
A notable exception is `CockroachDB`, which has its own column ordering scheme, and may not
put the columns in the order you expect.
