# 树实体

TypeORM支持用于存储树结构的Adjacency列表和Closure表模式。
要了解有关层次结构表的更多信息，请查看[this awesome presentation by Bill Karwin](https://www.slideshare.net/billkarwin/models-for-hierarchical-data)。

* [邻接清单](#邻接清单)
* [嵌套集](#嵌套集)
* [物化路径(又名路径枚举)](#物化路径(又名路径枚举))
* [闭合表](#闭合表)
* [使用树实体](#使用树实体)

## 邻接清单

邻接列表是一个具有自引用的简单模型。
这种方法的好处是简单，缺点是由于连接限制，您无法一次性加载整个树结构。
要了解有关邻接列表的好处和用途的更多信息，请参阅 [this article by Matthew Schinckel](http://schinckel.net/2014/09/13/long-live-adjacency-lists/).

例如：:

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

## 嵌套集

嵌套集是在数据库中存储树结构的另一种模式。
它对读取非常有效，但对写入不利。
且不能在嵌套集中有多个根。
例如：

```typescript
import {Entity, Tree, Column, PrimaryGeneratedColumn, TreeChildren, TreeParent, TreeLevelColumn} from "typeorm";

@Entity()
@Tree("nested-set")
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @TreeChildren()
    children: Category[];

    @TreeParent()
    parent: Category;
}
```

## 物化路径(又名路径枚举)

物化路径（也称为路径枚举）是在数据库中存储树结构的另一种模式。
它简单有效。
例如：

```typescript
import {Entity, Tree, Column, PrimaryGeneratedColumn, TreeChildren, TreeParent, TreeLevelColumn} from "typeorm";

@Entity()
@Tree("materialized-path")
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @TreeChildren()
    children: Category[];

    @TreeParent()
    parent: Category;
}
```

## 闭合表

闭合表以特殊方式在单独的表中存储父和子之间的关系。
它在读取和写入方面都很有效。
例如：

```typescript
import {Entity, Tree, Column, PrimaryGeneratedColumn, TreeChildren, TreeParent, TreeLevelColumn} from "typeorm";

@Entity()
@Tree("closure-table")
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @TreeChildren()
    children: Category[];

    @TreeParent()
    parent: Category;
}
```

## 使用树实体

要使绑定树实体彼此关系，将其父项设置为子实体并保存它们很重要
例如：

```typescript
const manager = getManager();

const a1 = new Category("a1");
a1.name = "a1";
await manager.save(a1);

const a11 = new Category();
a11.name = "a11";
a11.parent = a1;
await manager.save(a11);

const a12 = new Category();
a12.name = "a12";
a12.parent = a1;
await manager.save(a12);

const a111 = new Category();
a111.name = "a111";
a111.parent = a11;
await manager.save(a111);

const a112 = new Category();
a112.name = "a112";
a112.parent = a11;
await manager.save(a112);
```

加载树时使用`TreeRepository`:

```typescript
const manager = getManager();
const trees = await manager.getTreeRepository(Category).findTrees();
```

`trees` 如下:

```json
[{
    "id": 1,
    "name": "a1",
    "children": [{
        "id": 2,
        "name": "a11",
        "children": [{
            "id": 4,
            "name": "a111"
        }, {
            "id": 5,
            "name": "a112"
        }]
    }, {
        "id": 3,
        "name": "a12"
    }]
}]
```

还有其他一些特殊的方法可以处理树形实体，比如`TreeRepository`：

* `findTrees` - 返回数据库中所有树，包括所有子项，子项的子项等。

```typescript
const treeCategories = await repository.findTrees();
// 返回包含子类别的根类别
```

* `findRoots` - 根节点是没有祖先的实体。 找到所有根节点但不加载子节点。

```typescript
const rootCategories = await repository.findRoots();
// 返回没有子类别的根类别
```

* `findDescendants` - 获取给定实体的所有子项（后代）。 将它们全部返回到数组中。

```typescript
const childrens = await repository.findDescendants(parentCategory);
// 返回parentCategory的所有直接子类别（没有其嵌套类别）
```

* `findDescendantsTree` - 获取给定实体的所有子项（后代）。

```typescript
const childrensTree = await repository.findDescendantsTree(parentCategory);
// 返回parentCategory的所有直接子类别（及其嵌套类别）
```

* `createDescendantsQueryBuilder` - 创建用于获取树中实体的后代的查询构建器。

```typescript
const childrens = await repository
    .createDescendantsQueryBuilder("category", "categoryClosure", parentCategory)
    .andWhere("category.type = 'secondary'")
    .getMany();
```

* `countDescendants` - 获取实体的后代数。

```typescript
const childrenCount = await repository.countDescendants(parentCategory);
```

* `findAncestors` - 获取给定实体的所有父（祖先）。 将它们全部返回到数组中。

```typescript
const parents = await repository.findAncestors(childCategory);
// 返回所有直接childCategory的父类别（和"parent 的 parents"）
```

* `findAncestorsTree` - Gets all parent (ancestors) of the given entity. Returns them in a tree - nested into each other.

```typescript
const parentsTree = await repository.findAncestorsTree(childCategory);
// 返回所有直接childCategory的父类别 (和 "parent 的 parents")
```

* `createAncestorsQueryBuilder` - 创建用于获取树中实体的祖先的查询构建器。

```typescript
const parents = await repository
    .createAncestorsQueryBuilder("category", "categoryClosure", childCategory)
    .andWhere("category.type = 'secondary'")
    .getMany();
```

* `countAncestors` - 获取实体的祖先数。

```typescript
const parentsCount = await repository.countAncestors(childCategory);
```
