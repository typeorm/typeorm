# Separating entity definition

You can define an entity and its columns right in the model, using decorators. 
But some people prefer to define an entity and its columns inside separate files
which are called "entity schemas" in TypeORM.

Simple definition example:

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

Example with relations:

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

Complex example:

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

If you want to make your entity typesafe, you can define a model and specify it in schema definition:

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

