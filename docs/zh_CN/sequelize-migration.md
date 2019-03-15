# 从 Sequelize 迁移到 TypeORM

  * [建立连接](#建立连接)
  * [架构同步](#架构同步)
  * [创建模型](#创建模型)
  * [其他模型设置](#其他模型设置)

## 建立连接

在 sequelize 中，可以通过以下方式创建连接：

```javascript
const sequelize = new Sequelize("database", "username", "password", {
  host: "localhost",
  dialect: "mysql"
});

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch(err => {
    console.error("Unable to connect to the database:", err);
  });
```

在 TypeORM 中，可以创建如下连接：

```typescript
import { createConnection } from "typeorm";

createConnection({
  type: "mysql",
  host: "localhost",
  username: "username",
  password: "password"
})
  .then(connection => {
    console.log("Connection has been established successfully.");
  })
  .catch(err => {
    console.error("Unable to connect to the database:", err);
  });
```

然后使用`getConnection`从应用程序的任何位置获取连接实例。

## 架构同步

在 sequelize 中，你可以通过以下方式进行架构同步：

```javascript
Project.sync({ force: true });
Task.sync({ force: true });
```

在 TypeORM 中，你只需在连接选项中添加`synchronize：true`：

```typescript
createConnection({
  type: "mysql",
  host: "localhost",
  username: "username",
  password: "password",
  synchronize: true
});
```

## 创建模型

以下是 sequelize 中定义模型的方式：

```javascript
module.exports = function(sequelize, DataTypes) {
  const Project = sequelize.define("project", {
    title: DataTypes.STRING,
    description: DataTypes.TEXT
  });

  return Project;
};
```

```javascript
module.exports = function(sequelize, DataTypes) {
  const Task = sequelize.define("task", {
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    deadline: DataTypes.DATE
  });

  return Task;
};
```

在 TypeORM 中，这些模型称为实体，你可以像这样定义它们：

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;
}
```

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column("text")
  description: string;

  @Column()
  deadline: Date;
}
```

强烈建议为每个文件定义一个实体类。
TypeORM 允许你将类用作数据库模型
并提供一种声明性方法来定义模型的哪个部分将成为数据库表的一部分。
TypeScript 的强大功能为你提供类型提示和其他可在类中使用的有用功能。

## 其他模型设置

在 sequelize 中:

```javascript
flag: { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: true },
```

可以在 TypeORM 中实现，如下所示：

```typescript
@Column({ nullable: true, default: true })
flag: boolean;
```

在 sequelize 中:

```javascript
flag: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
```

在 TypeORM 中这样写：

```typescript
@Column({ default: () => "NOW()" })
myDate: Date;
```

在 sequelize 中:

```javascript
someUnique: { type: Sequelize.STRING, unique: true },
```

可以在 TypeORM 中实现这种方式：

```typescript
@Column({ unique: true })
someUnique: string;
```

在 sequelize 中:

```javascript
fieldWithUnderscores: { type: Sequelize.STRING, field: "field_with_underscores" },
```

在 TypeORM 中可以这样：

```typescript
@Column({ name: "field_with_underscores" })
fieldWithUnderscores: string;
```

在 sequelize 中:

```javascript
incrementMe: { type: Sequelize.INTEGER, autoIncrement: true },
```

在 TypeORM 中可以这样：

```typescript
@Column()
@Generated()
incrementMe: number;
```

在 sequelize 中:

```javascript
identifier: { type: Sequelize.STRING, primaryKey: true },
```

在 TypeORM 中可以这样：

```typescript
@Column({ primary: true })
identifier: string;
```

要创建`createDate` 和 `updateDate`，就像定义其他列一样，在实体中定义两列，并将其命名：

```typescript
@CreateDateColumn();
createDate: Date;

@UpdateDateColumn();
updateDate: Date;
```

### 使用模型

要在 sequelize 中创建新模型：

```javascript
const employee = await Employee.create({ name: "John Doe", title: "senior engineer" });
```

在 TypeORM 中，有几种方法可以创建新模型：

```typescript
const employee = new Employee(); // 你也可以使用构造函数参数
employee.name = "John Doe";
employee.title = "senior engineer";
```

或者

```typescript
const employee = Employee.create({ name: "John Doe", title: "senior engineer" });
```

如果要从数据库加载现有实体并替换其某些属性，可以使用以下方法：

```typescript
const employee = await Employee.preload({ id: 1, name: "John Doe" });
```

在 sequelize 中访问属性，可执行以下操作：

```typescript
console.log(employee.get("name"));
```

在 TypeORM 中你只需：

```typescript
console.log(employee.name);
```

要在 sequelize 中创建索引，可使用：

```typescript
sequelize.define(
  "user",
  {},
  {
    indexes: [
      {
        unique: true,
        fields: ["firstName", "lastName"]
      }
    ]
  }
);
```

在 TypeORM 中你只需：

```typescript
@Entity()
@Index(["firstName", "lastName"], { unique: true })
export class User {}
```
