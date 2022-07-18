import { DataSource } from "typeorm"
import { ViewColumn } from "typeorm/decorator/columns/ViewColumn"
import { ViewEntity } from "typeorm/decorator/entity-view/ViewEntity"
import { Category } from "./Category"
import { Post } from "./Post"

@ViewEntity({
    expression: (connection: DataSource) =>
        connection
            .createQueryBuilder()
            .select("post.id", "id")
            .addSelect("post.name", "name")
            .addSelect("category.name", "categoryName")
            .from(Post, "post")
            .leftJoin(Category, "category", "category.id = post.categoryId"),
})
export class PostCategory {
    @ViewColumn()
    id: number

    @ViewColumn()
    name: string

    @ViewColumn()
    categoryName: string
}
