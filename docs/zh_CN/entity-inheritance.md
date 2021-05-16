# 实体继承

* [具体表继承](#concrete-table-inheritance)
* [单表继承](#single-table-inheritance)
* [使用嵌入式](#using-embeddeds)

## 具体表继承

你可以使用实体继承模式减少代码中的重复。
最简单和最有效的是具体的表继承。

例如，你有`Photo`，`Question`，`Post`三个实体：
  
```typescript
@Entity()
export class Photo {
    
    @PrimaryGeneratedColumn()
    id: number;
 
    @Column()
    title: string;
    
    @Column()
    description: string;
    
    @Column()
    size: string;
    
}
```

```typescript
@Entity()
export class Question {
    
    @PrimaryGeneratedColumn()
    id: number;
 
    @Column()
    title: string;
    
    @Column()
    description: string;
    
    @Column()
    answersCount: number;
    
}
```

```typescript
@Entity()
export class Post {
    
    @PrimaryGeneratedColumn()
    id: number;
 
    @Column()
    title: string;
    
    @Column()
    description: string;
    
    @Column()
    viewCount: number;
    
}
```

正如你所看到的，所有这些实体都有共同的列：`id`，`title`，`description`。
为了减少重复并产生更好的抽象，我们可以为它们创建一个名为`Content`的基类：

```typescript
export abstract class Content {
    
    @PrimaryGeneratedColumn()
    id: number;
 
    @Column()
    title: string;
    
    @Column()
    description: string;
    
}
```

```typescript
@Entity()
export class Photo extends Content {
    
    @Column()
    size: string;
    
}
```

```typescript
@Entity()
export class Question extends Content {
    
    @Column()
    answersCount: number;
    
}
```

```typescript
@Entity()
export class Post extends Content {
    
    @Column()
    viewCount: number;
    
}
```

来自父实体的所有列（关系，嵌入等）（父级也可以扩展其他实体）将在最终实体中继承和创建。

这个例子将创建3个表  - `photo`, `question` 和 `post`.

## 单表继承

TypeORM还支持单表继承。
当您有多个具有自己属性的类时，单表继承是一种模式，但是在数据库中，它们存储在同一个表中。

```typescript
@Entity()
@TableInheritance({ column: { type: "varchar", name: "type" } })
export class Content {
    
    @PrimaryGeneratedColumn()
    id: number;
 
    @Column()
    title: string;
    
    @Column()
    description: string;
    
}
```

```typescript
@ChildEntity()
export class Photo extends Content {
    
    @Column()
    size: string;
    
}
```

```typescript
@ChildEntity()
export class Question extends Content {
    
    @Column()
    answersCount: number;
    
}
```

```typescript
@ChildEntity()
export class Post extends Content {
    
    @Column()
    viewCount: number;
    
}
```

这将创建一个名为`content`的表，所有photos，questions和posts的实例都将保存到此表中。

## 使用嵌入式

通过使用`embedded columns`，可以减少应用程序中的重复（使用组合而不是继承）。
阅读有关嵌入实体的[更多信息](./embedded-entities.md)
