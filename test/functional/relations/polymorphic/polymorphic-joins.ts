import { expect } from "chai"
import { DataSource } from "../../../../src"
import { Comment } from "./entity/Comment"
import { Article } from "./entity/Article"
import { Video } from "./entity/Video"

describe("polymorphic joins", () => {
    let dataSource: DataSource

    before(async () => {
        dataSource = new DataSource({
            type: "sqlite",
            database: ":memory:",
            synchronize: true,
            entities: [Comment, Article, Video],
        })
        await dataSource.initialize()
    })

    after(() => dataSource.destroy())

    it("should generate scoped joins", () => {
        const qb = dataSource
            .getRepository(Comment)
            .createQueryBuilder("comment")
            .leftJoinAndSelect("comment.article", "article")
            .leftJoinAndSelect("comment.video", "video")

        const sql = qb.getSql()

        expect(sql).to.contain(
            '"article"."id" = "comment"."targetId" AND "comment"."targetType" =',
        )
        expect(sql).to.contain(
            '"video"."id" = "comment"."targetId" AND "comment"."targetType" =',
        )
    })
})
