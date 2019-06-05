# 嵌入式实体
通过使用`embedded columns`，可以减少应用程序中的重复（使用组合而不是继承）。

嵌入列是一个列，它接受具有自己列的类，并将这些列合并到当前实体的数据库表中。

例如:

假设我们有`User`，`Employee`和`Student`实体。

这些属性都有少量的共同点，`first name` 和 `last name`属性。

```typescript
import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class User {
    
    @PrimaryGeneratedColumn()
    id: string;
    
    @Column()
    firstName: string;
    
    @Column()
    lastName: string;
    
    @Column()
    isActive: boolean;
    
}
```

```typescript
import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class Employee {
    
    @PrimaryGeneratedColumn()
    id: string;
    
    @Column()
    firstName: string;
    
    @Column()
    lastName: string;
    
    @Column()
    salary: string;
    
}
```

```typescript
import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class Student {
    
    @PrimaryGeneratedColumn()
    id: string;
    
    @Column()
    firstName: string;
    
    @Column()
    lastName: string;
    
    @Column()
    faculty: string;
    
}
```
我们可以做的是通过创建一个包含`firstName`和`lastName`的新类：

```typescript
import {Entity, Column} from "typeorm";

export class Name {
    
    @Column()
    first: string;
    
    @Column()
    last: string;
    
}
```

然后"connect"实体中的这些列：

```typescript
import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";
import {Name} from "./Name";

@Entity()
export class User {
    
    @PrimaryGeneratedColumn()
    id: string;
    
    @Column(type => Name)
    name: Name;
    
    @Column()
    isActive: boolean;
    
}
```

```typescript
import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";
import {Name} from "./Name";

@Entity()
export class Employee {
    
    @PrimaryGeneratedColumn()
    id: string;
    
    @Column(type => Name)
    name: Name;
    
    @Column()
    salary: number;
    
}
```

```typescript
import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";
import {Name} from "./Name";

@Entity()
export class Student {
    
    @PrimaryGeneratedColumn()
    id: string;
    
    @Column(type => Name)
    name: Name;
    
    @Column()
    faculty: string;
    
}
```
`Name`实体中定义的所有列将合并为`user`，`employee`和`student`：

```bash
+-------------+--------------+----------------------------+
|                          user                           |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| nameFirst   | varchar(255) |                            |
| nameLast    | varchar(255) |                            |
| isActive    | boolean      |                            |
+-------------+--------------+----------------------------+

+-------------+--------------+----------------------------+
|                        employee                         |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| nameFirst   | varchar(255) |                            |
| nameLast    | varchar(255) |                            |
| salary      | int(11)      |                            |
+-------------+--------------+----------------------------+

+-------------+--------------+----------------------------+
|                         student                         |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| nameFirst   | varchar(255) |                            |
| nameLast    | varchar(255) |                            |
| faculty     | varchar(255) |                            |
+-------------+--------------+----------------------------+
```

这种方式可以减少实体类中的代码重复。
你可以根据需要在嵌入式类中使用尽可能多的列（或关系）。
甚至可以在嵌入式类中嵌套嵌套列。
 
