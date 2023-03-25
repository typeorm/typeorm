# Safe-TypeORM

- [Outline](#outline)
- [Setup](#setup)
  - [NPM Package](#npm-package)
  - [Prerequisites](#prerequisites)
- [Features](#features)
  - [JoinQueryBuilder](#joinquerybuilder)
  - [JsonSelectBuilder](#jsonselectbuilder)
  - [InsertCollection](#insertcollection)
- [Guide Documents](#guide-documents)

## Outline

![JoinQueryBuilder](https://raw.githubusercontent.com/samchon/safe-typeorm/master/assets/demonstrations/join-query-builder.gif)

Enhance type safety, therefore make below things possible:

  - When writing **SQL query**,
    - Errors would be detected in the **compilation level**
    - **Auto Completion** would be provided
    - **Type Hint** would be supported
  - When **SELECT**ing for **JSON** transformation
    - **App-Join** with the related entities would be automatically done
    - Exact JSON **type** would be **automatically deduced**
    - The **performance** would be **automatically tuned**

I've published [safe-typeorm](https://github.com/samchon/safe-typeorm) to suggest TypeORM to adapt TMP concept, and demonstrate how it works (related issue: [typeorm#9868](https://github.com/typeorm/typeorm/issues/9868)). I hope [safe-typeorm](https://github.com/samchon/safe-typeorm) to be adpated by `TypeORM`, therefore become key features of next `v0.4` update.

However, this is a third party package and is not managed by the entirety of the `TypeORM` core team yet. Thus, until this [safe-typeorm](https://github.com/samchon/safe-typeorm) be accepted by `TypeORM` core team, please report any issues found with the library in the [appropriate repository](https://github.com/samchon/safe-typeorm).





## Setup

### NPM Package

```bash
npm install --save typeorm@0.2
npm install --save safe-typeorm
```

Just install through npm install command.

Note that, [safe-typeorm](https://github.com/samchon/safe-typeorm) supports only `typeorm@0.2` yet.

### Prerequisites

To take advantages of type safety, you've to change relationships like below.

About the new type of relationship definitions, please read [Guide Documents](https://github.com/samchon/safe-typeorm/wiki/Relationships) of [safe-typeorm](https://github.com/samchon/safe-typeorm):

  - [Preface](Relationships)
  - [Belongs.ManyToOne](https://github.com/samchon/safe-typeorm/wiki/Relationships#belongsmanytoone)
  - [Belongs.OneToOne](https://github.com/samchon/safe-typeorm/wiki/Relationships#belongsonetoone)
  - [Has.OneToOne](https://github.com/samchon/safe-typeorm/wiki/Relationships#hasonetoone)
  - [Has.OneToMany](https://github.com/samchon/safe-typeorm/wiki/Relationships#hasonetomany)
  - [Has.ManyToMany](https://github.com/samchon/safe-typeorm/wiki/Relationships#hasmanytomany)

```typescript
@orm.Entity()
export class BbsArticle {
    @safe.Belongs.ManyToOne(
        () => BbsGroup, // parent entity
        "uuid", // parent entity's PK type
        "bbs_group_id", // foreign key field name
        { index: true }
    )
    public readonly group!: safe.Belongs.ManyToOne<BbsGroup, "uuid">;

    @safe.Has.OneToMany(
        () => BbsArticleComment, // target entity
        (comment) => article, // accessor from children
    )
    public readonly comments!: safe.Has.OneToMany<BbsArticleComment>;

    @safe.Has.OneToMany(
        () => BbsArticleTag,
        (tag) => tag.article,
        (x, y) => x.sequence - y.sequence, // sorting option
    )
    public readonly tags!: safe.Has.OneToMany<BbsArticleTag>;
}
```



## Features

### JoinQueryBuilder

As you've seen from the top gif image, you can write SQL query much safely and conveniently.

If you take a mistake when writing an SQL query, the error would be occured in the compilation level. Therefore, you don't need to suffer by runtime error by mistaken SQL query. Also, if you're writing wrong SQL query, the IDE (like VSCode) will warn you with the red underlined emphasizing, to tell you there can be an SQL error.

Also, [safe-typeorm](https://github.com/samchon/safe-typeorm) supports type hinting with auto-completion when you're writing the SQL query. Therefore, you can write SQL query much faster than before. Of course, the fast-written SQL query would be ensured its safety by the compiler and IDE.

Below is entire code of above gif image:

```typescript
import * as orm from "typeorm";
import safe from "safe-typeorm";

export function demo_join_query_builder(
    group: BbsGroup,
    exclude: string[],
): orm.SelectQueryBuilder<BbsQuestionArticle> {
    const question = safe.createJoinQueryBuilder(BbsQuestionArticle);

    // JOIN
    const article = question.innerJoin("base");
    const content = article.innerJoin("__mv_last").innerJoin("content");
    const category = article.innerJoin("category");

    // SELECT
    article.addSelect("id").addSelect("writer").addSelect("created_at");
    content.addSelect("title").addSelect("created_at", "updated_at");
    article.leftJoin("answer").leftJoin("base", "AA", (answer) => {
        answer.addSelect("writer", "answer_writer");
        answer.addSelect("created_at", "answer_created_at");
        answer
            .leftJoin("__mv_last", "AL")
            .leftJoin("content", "AC")
            .addSelect(
                ["title", (str) => `COALESCE(${str}, 'NONE)`],
                "answer_title",
            );
    });
    content.addOrderBy("created_at", "DESC");

    // WHERE
    article.andWhere("group", group);
    category.andWhere("code", "NOT IN", exclude);
    return question.statement();
}
```

By the way, if you want to construct SQL query by only one statement, without defining any surplus variable, I can say that "It is is also possible, but a little bit unsafe". 

Below is the code constructing SQL query at once. As you can see, declaring `SELECT` and `WHERE` statements are not perfect type safe. It is possible to list up another tables' columns, which have never participated in the JOIN statement.

```typescript
import safe from "safe-typeorm";
import * as orm from "typeorm";

export function demo_join_query_builder_onetime(
    group: BbsGroup,
    exclude: string[],
): orm.SelectQueryBuilder<BbsQuestionArticle> {
    const builder = safe.createJoinQueryBuilder(
        BbsQuestionArticle,
        (question) => {
            question.innerJoin("base", (article) => {
                article.innerJoin("group");
                article.innerJoin("category");
                article.innerJoin("__mv_last").innerJoin("content");
            });
            question
                .leftJoin("answer")
                .leftJoin("base", "AA")
                .leftJoin("__mv_last", "AL")
                .leftJoin("content", "AC");
        },
    );
    return builder
        .statement()
        .andWhere(...BbsArticle.getWhereArguments("group", group))
        .andWhere(...BbsCategory.getWhereArguments("code", "NOT IN", exclude))
        .select([
            BbsArticle.getColumn("id"),
            BbsGroup.getColumn("name", "group"),
            BbsCategory.getColumn("name", "category"),
            BbsArticle.getColumn("writer"),
            BbsArticleContent.getColumn("title"),
            BbsArticle.getColumn("created_at"),
            BbsArticleContent.getColumn("created_at", "updated_at"),

            BbsArticle.getColumn("AA.writer", "answer_writer"),
            BbsArticleContent.getColumn(
                ["AA.title", str => `COALESCE(${str}, 'NONE')`], 
                "answer_title"
            ),
            BbsArticle.getColumn("AA.created_at", "answer_created_at"),
        ]);
}
```

### JsonSelectBuilder

![Class Diagram](https://raw.githubusercontent.com/samchon/safe-typeorm/master/assets/designs/class-diagram.png)

  - ORM Class Definitions: https://github.com/samchon/safe-typeorm/tree/master/src/test/models/bbs
  - JSON Interface Definitions: https://github.com/samchon/safe-typeorm/tree/master/src/test/structures

In [safe-typeorm](https://github.com/samchon/safe-typeorm), when you want to load DB records and convert them to a **JSON** data, you don't need to write any `SELECT` or `JOIN` query. You also do not need to consider any performance tuning. Just write down the `ORM -> JSON` transform plan, then [safe-typeorm](https://github.com/samchon/safe-typeorm) will do everything.

The `JsonSelectBuilder` is the class doing everything. It will analyze your **JSON** transform plan, and compose the **JSON** transform method automatically with the exact **JSON** type what you want. Furthermore, the `JsonSelectBuilder` finds the best (applicataion level) joining plan by itself, when being constructed.

Below code is an example converting ORM model class instances to JSON data with the `JsonSelectBuilder`. As you can see, there's no special script in the below code, but only the transform plan is. As I've mentioned, `JsonSelectBuilder` will construct the exact **JSON** type by analyzing your transform plan. Also, the performance tuning would be done automatically. 

Therefore, just enjoy the `JsonSelectBuilder` without any worry.

```typescript
import safe from "safe-typeorm";

export async function demo_app_join_builder(
    groups: BbsGroup[],
): Promise<IBbsGroup[]> {
    const builder = new safe.JsonSelectBuilder(BbsGroup, {
        articles: new safe.JsonSelectBuilder(BbsArticle, {
            group: safe.DEFAULT,
            category: new safe.JsonSelectBuilder(BbsCategory, {
                parent: "recursive" as const,
            }),
            tags: new safe.JsonSelectBuilder(
                BbsArticleTag,
                {},
                (tag) => tag.value, // CUSTOM TRANSFORMATION
            ),
            contents: new safe.JsonSelectBuilder(BbsArticleContent, {
                files: "join" as const,
            }),
        }),
    });
    return builder.getMany(groups);
}
```




### InsertCollection

```typescript
import * as orm from "typeorm";

export class InsertCollection {
    public execute(manager?: orm.EntityManager): Promise<void>;

    public push<T extends object>(record: T, ignore?: string | boolean): T;
    public push<T extends object>(records: T[], ignore?: string | boolean): T[];
    public before(process: InsertCollection.Process): void;
    public after(process: InsertCollection.Process): void;
}
export namespace InsertCollection {
    export interface Process {
        (manager: orm.EntityManager): Promise<any>;
    }
}
```

`InsertCollection` is an utility class supporting massive insertions.

Also, when multiple table records are prepared at the same time, `InsertCollection` analyzes the dependency relationships of each table and automatically sorts the insertion order, so that there would not be any error due to the foreign key constraint.

However, note that, `InsertCollection` does not support auto-increment (sequence) typed primary key. If you put any entity record that using the auto-increment typed primary key, `InsertCollection` would throw an error. Recommend to use only UUID (or string) typed primary key.

```typescript
async function insert(
    tags: BbsArticleTag[],
    articles: BbsArticle[],
    contents: BbsArticleContent[],
    groups: BbsGroup[],
    contentFiles: BbsArticleContentFile[],
    categories: BbsCategory[],
    files: AttachmentFile[],
): Promise<void> {
    // although you've pushed entity records 
    // without considering dependency relationships
    const collection: safe.InsertCollection = new safe.InsertCollection();
    collection.push(tags);
    collection.push(articles);
    collection.push(contents);
    collection.push(groups);
    collection.push(contentFiles);
    collection.push(categories);
    collection.push(files);

    // `InsertCollection` would automatically sort insertion order
    // just by analyzing dependency relationships by itself
    await collection.execute();
}
```

Also, you can add extra processes to be executed both before and after insertion.

Additionally, if you prepare insertion queries and pre/post processes and execute them all by calling `InsertCollection.execute()` method, those prepared queries and processes would be cleared. Therefore, you can reuse the same `InsertCollection` instance.

However, note that, it is not possible to run the `InsertCollection.execute()` methods multiple times in parallel. There would not be any runtime error, but `InsertCollection` would block your simultaneous calls until previous execution be completed through [Mutex](https://samchon.github.io/tstl/api/classes/std.mutex.html).

```typescript
async function insert(article: BbsArticle, ...): Promise<void> {
    const collection: safe.InsertCollection = new safe.InsertCollection();
    collection.push(article);

    // executed before insert query
    collection.before(async () => {
        await archive_article_insert_log(article);
    });

    // executed after insert query
    collection.after(async () => {
        await update_article_count(1); 
    });
    collection.after(async () => {
        await send_push_message_to_writer("article", article);
    });

    // do execute
    //  1. before process(es)
    //  2. insert query
    //  3. after process(es)
    await collection.execute();
}
```





## Guide Documents

If you want to know more about [safe-typeorm](https://github.com/samchon/safe-typeorm), please visit Guide Documents:

- [Relationships](https://github.com/samchon/safe-typeorm/wiki/Relationships)
  - [Belongs.ManyToOne](https://github.com/samchon/safe-typeorm/wiki/Relationships#belongsmanytoone)
  - [Belongs.OneToOne](https://github.com/samchon/safe-typeorm/wiki/Relationships#belongsonetoone)
  - [Has.OneToOne](https://github.com/samchon/safe-typeorm/wiki/Relationships#hasonetoone)
  - [Has.OneToMany](https://github.com/samchon/safe-typeorm/wiki/Relationships#hasonetomany)
  - [Has.ManyToMany](https://github.com/samchon/safe-typeorm/wiki/Relationships#hasmanytomany)
- [Builders](https://github.com/samchon/safe-typeorm/wiki/Builders)
  - [JoinQueryBuilder](https://github.com/samchon/safe-typeorm/wiki/Builders#joinquerybuilder)
  - [AppJoinBuilder](https://github.com/samchon/safe-typeorm/wiki/Builders#appjoinbuilder)
  - [JsonSelectBuilder](https://github.com/samchon/safe-typeorm/wiki/Builders#jsonselectbuilder)
- [Insertions](https://github.com/samchon/safe-typeorm/wiki/Insertions)
  - [initialize](https://github.com/samchon/safe-typeorm/wiki/Insertions#initialize)
  - [InsertCollection](https://github.com/samchon/safe-typeorm/wiki/Insertions#insertcollection)
  - [EntityUtil](https://github.com/samchon/safe-typeorm/wiki/Insertions#entityutil)
- [Utilities](https://github.com/samchon/safe-typeorm/wiki/Utilities)
  - [EncryptedColumn](https://github.com/samchon/safe-typeorm/wiki/Utilities#encryptedcolumn)
  - [Paginator](https://github.com/samchon/safe-typeorm/wiki/Utilities#paginator)
  - [Password](https://github.com/samchon/safe-typeorm/wiki/Utilities#password)
  - [SnakeCaseStrategy](https://github.com/samchon/safe-typeorm/wiki/Utilities#snakecasestrategy)