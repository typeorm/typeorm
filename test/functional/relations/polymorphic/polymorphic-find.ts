import { expect } from "chai"
import { DataSource } from "../../../../src"
import { Article } from "./entity/Article"
import { Video } from "./entity/Video"
import { Comment } from "./entity/Comment"

describe("polymorphic find", () => {
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

    it("should load article and video together without N+1", async () => {
        const article = await dataSource.getRepository(Article).save({
            title: "Article 1",
        })

        const video = await dataSource.getRepository(Video).save({
            title: "Video 1",
        })

        await dataSource.getRepository(Comment).save([
            { targetId: article.id, targetType: "articles" },
            { targetId: video.id, targetType: "videos" },
        ])

        const comments = await dataSource.getRepository(Comment).find({
            relations: {
                article: true,
                video: true,
            },
            order: { id: "ASC" },
        })

        console.log(comments)

        expect(comments[0].article).to.exist
        expect(comments[0].video).to.be.null

        expect(comments[1].video).to.exist
        expect(comments[1].article).to.be.null
    })
})
