import "reflect-metadata"
import { DataSource } from "../../../../src"
import { Post } from "./entity/Post"

describe("github issues > #3357 Migration generation drops and creates columns instead of altering", () => {
    let dataSource: DataSource

    before(async () => {
        dataSource = new DataSource({
            type: "postgres",
            host: "localhost",
            port: 5432,
            username: "test",
            password: "test",
            database: "test",
            entities: [Post],
            synchronize: false,
            dropSchema: true,
        })
        await dataSource.initialize()
        await dataSource.synchronize()
    })

    after(async () => {
        await dataSource.destroy()
    })

    it("should use ALTER COLUMN TYPE instead of DROP+ADD when only length changes", async () => {
        // Insert test data
        const post = new Post()
        post.title = "Test Post with exactly 50 characters in the title"
        post.content = "This is test content"
        await dataSource.manager.save(post)

        // Get the original data
        const originalPost = await dataSource.manager.findOne(Post, {
            where: { id: post.id },
        })
        
        // Simulate schema change: increase varchar length from 50 to 100
        const queryRunner = dataSource.createQueryRunner()
        await queryRunner.connect()

        // This should use ALTER COLUMN TYPE, not DROP+ADD
        const table = await queryRunner.getTable("post")
        const oldColumn = table!.findColumnByName("title")!
        const newColumn = oldColumn.clone()
        newColumn.length = "100"

        await queryRunner.changeColumn(table!, oldColumn, newColumn)
        await queryRunner.release()

        // Verify data is preserved
        const postAfterMigration = await dataSource.manager.findOne(Post, {
            where: { id: post.id },
        })

        postAfterMigration!.should.be.exist
        postAfterMigration!.title.should.be.equal(originalPost!.title)
        postAfterMigration!.content.should.be.equal(originalPost!.content)
    })
})
