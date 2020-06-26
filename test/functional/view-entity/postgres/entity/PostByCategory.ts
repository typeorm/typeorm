import { Connection, ViewColumn, ViewEntity } from "@typeorm/core";
import { Category } from "./Category";
import { Post } from "./Post";

@ViewEntity({
    materialized: true,
    expression: (connection: Connection) => connection.createQueryBuilder()
        .select("category.name", "categoryName")
        .addSelect("COUNT(post.id)", "postCount")
        .from(Post, "post")
        .innerJoin(Category, "category", "category.id = post.categoryId")
        .groupBy("category.name")
})
export class PostByCategory {

    @ViewColumn()
    categoryName: string;

    @ViewColumn()
    postCount: number;

}
