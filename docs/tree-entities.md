# Tree Entities

TypeORM supports the Adjacency list and Closure table patterns for storing tree structures.

* [Adjacency list](#adjacency-list)
* [Closure table](#closure-table)

### Adjacency list

Adjacency list is a simple model with self-referencing. 
The benefit of this approach is simplicity, 
drawback is that you can't load big trees in all at once because of join limitations.
To learn more about the benefits and use of Adjacency Lists look at [this article by Matthew Schinckel](http://schinckel.net/2014/09/13/long-live-adjacency-lists/).
Example:

```typescript
import {Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany} from "typeorm";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @ManyToOne(type => Category, category => category.children)
    parent: Category;

    @OneToMany(type => Category, category => category.parent)
    children: Category[];
}
     
```

### Closure table


Closure table stores relations between parent and child in a separate table in a special way. 
It's efficient in both reads and writes. 
To learn more about closure table take a look at [this awesome presentation by Bill Karwin](https://www.slideshare.net/billkarwin/models-for-hierarchical-data). 
Example:

```typescript
import {ClosureEntity, Column, PrimaryGeneratedColumn, TreeChildren, TreeParent, TreeLevelColumn} from "typeorm";

@ClosureEntity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @TreeChildren()
    children: Category[];

    @TreeParent()
    parent: Category;

    @TreeLevelColumn()
    level: number;
}
```
