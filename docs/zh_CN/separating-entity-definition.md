# 实体定义分离

你可以使用装饰器在模型中定义实体及其列。
但有些人更喜欢在单独的文件中定义实体及其列
在TypeORM中称为"entity schemas"。

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

复杂的例子：

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

