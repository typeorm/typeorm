# 分离实体定义

- [定义Schemas](#定义Schemas)
- [扩展Schemas](#扩展Schemas)
- [使用Schemas](#使用Schemas查询/插入数据)

## 定义架构

你可以使用装饰器在模型中定义实体及其列。
但有些人更喜欢在单独的文件中定义一个实体及其列，这些文件在TypeORM中称为"entity schemas"。

简单定义示例：

```ts
import {EntitySchema} from "typeorm";

export const CategoryEntity = new EntitySchema({
    name: "category",
    columns: {
        id: {
            type: Number,
            primary: true,
            generated: true
        },
        name: {
            type: String
        }
    }
});
```

关系示例：

```ts
import {EntitySchema} from "typeorm";

export const PostEntity = new EntitySchema({
    name: "post",
    columns: {
        id: {
            type: Number,
            primary: true,
            generated: true
        },
        title: {
            type: String
        },
        text: {
            type: String
        }
    },
    relations: {
        categories: {
            type: "many-to-many",
            target: "category" // CategoryEntity
        }
    }
});
```

复杂示例：

```ts
import {EntitySchema} from "typeorm";

export const PersonSchema = new EntitySchema({
    name: "person",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: "increment"
        },
        firstName: {
            type: String,
            length: 30
        },
        lastName: {
            type: String,
            length: 50,
            nullable: false
        },
        age: {
            type: Number,
            nullable: false
        }
    },
    checks: [
        { expression: `"firstName" <> 'John' AND "lastName" <> 'Doe'` },
        { expression: `"age" > 18` }
    ],
    indices: [
        {
            name: "IDX_TEST",
            unique: true,
            columns: [
                "firstName",
                "lastName"
            ]
        }
    ],
    uniques: [
        {
            name: "UNIQUE_TEST",
            columns: [
                "firstName",
                "lastName"
            ]
        }
    ]
});
```

如果要使实体类型安全，可以定义模型并在模式定义中指定它：

```ts
import {EntitySchema} from "typeorm";

export interface Category {
    id: number;
    name: string;
}

export const CategoryEntity = new EntitySchema<Category>({
    name: "category",
    columns: {
        id: {
            type: Number,
            primary: true,
            generated: true
        },
        name: {
            type: String
        }
    }
});
```

## 扩展架构

当使用`Decorator`方法时，很容易将基本列`extend`为抽象类并简单地扩展它。
例如，在`BaseEntity`中这样定义`id`，`createdAt`和`updatedAt`列。 有关更多详细信息，请参阅[具体表继承](entity-inheritance.md#concrete-table-inheritance)的文档

当使用 `EntitySchema` 方法时该方法便不可行。 但是，你可以使用`Spread Operator`（...）来改善。

重新审视上面的 `Category` 示例。 你可能希望 `extract` 基本列描述并在其他模式中复用它，则可以通过以下方式完成：

```ts
import {EntitySchemaColumnOptions} from "typeorm";

export const BaseColumnSchemaPart = {
  id: {
    type: Number,
    primary: true,
    generated: true,
  } as EntitySchemaColumnOptions,
  createdAt: {
    name: 'created_at',
    type: 'timestamp with time zone',
    createDate: true,
  } as EntitySchemaColumnOptions,
  updatedAt: {
    name: 'updated_at',
    type: 'timestamp with time zone',
    updateDate: true,
  } as EntitySchemaColumnOptions,
};
```

现在你可以在其他模式模型中使用`BaseColumnSchemaPart`，如下所示：

```ts
export const CategoryEntity = new EntitySchema<Category>({
    name: "category",
    columns: {
        ...BaseColumnSchemaPart,    
        // CategoryEntity现在具有已定义的id，createdAt，updatedAt列！
        // 此外，还定义了以下新字段
        name: {
            type: String
        }
    }
});
```

一定要将`extended`列添加到`Category`接口（例如，通过`export interface Category extend Base Entity`）。

## 使用Schemas查询/插入数据

当然，你可以像使用装饰器一样在存储库或实体管理器中使用已定义的模式。
回顾先前定义的`Category`示例（带有`Interface`和`CategoryEntity`模式）以获取一些数据或操纵数据库。

```ts
// 请求数据
const categoryRepository = getRepository<Category>(CategoryEntity);
const category = await categoryRepository.findOne(1); // category is properly typed!

// 插入一条新category到数据库
const categoryDTO = {
  // 注意id是自动生成的，请参考上面的架构定义。
  name: 'new category',
};
const newCategory = await categoryRepository.save(categoryDTO);
```
