import { expect } from "chai"
import { DataSource } from "../../../../src/data-source/DataSource"
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from "../../../../src/index"

@Entity("libsql_features_test")
@Index("idx_title_content", ["title", "content"])
class LibsqlFeaturesTest {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column("text")
    content: string

    @Column("integer", { default: 0 })
    views: number

    @Column("blob", { nullable: true })
    data: Buffer

    @Column("real", { nullable: true })
    rating: number

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date

    @Column("boolean", { default: true })
    isActive: boolean
}

describe("libsql advanced features", () => {
    let dataSource: DataSource
    let testDbCounter = 0

    beforeEach(async () => {
        testDbCounter++
        dataSource = new DataSource({
            type: "libsql",
            url: `file:./temp/libsql_features_test_${testDbCounter}.db`,
            entities: [LibsqlFeaturesTest],
            synchronize: true,
            logging: false,
            dropSchema: true, // Ensure clean slate for each test
        })
        await dataSource.initialize()
    })

    afterEach(async () => {
        if (dataSource && dataSource.isInitialized) {
            await dataSource.destroy()
        }
    })

    it("should handle various SQLite data types", async () => {
        const repository = dataSource.getRepository(LibsqlFeaturesTest)

        const entity = new LibsqlFeaturesTest()
        entity.title = "Test Title"
        entity.content = "Long text content for testing"
        entity.views = 100
        entity.data = Buffer.from("binary data")
        entity.rating = 4.5
        entity.isActive = true

        const saved = await repository.save(entity)

        expect(saved.id).to.be.a("number")
        expect(saved.title).to.equal("Test Title")
        expect(saved.content).to.equal("Long text content for testing")
        expect(saved.views).to.equal(100)
        expect(saved.data).to.be.instanceOf(Buffer)
        expect(saved.rating).to.equal(4.5)
        expect(saved.isActive).to.be.true
        expect(saved.createdAt).to.be.instanceOf(Date)
        expect(saved.updatedAt).to.be.instanceOf(Date)
    })

    it("should handle complex queries with joins and aggregations", async () => {
        const repository = dataSource.getRepository(LibsqlFeaturesTest)

        // Insert test data
        const entities = [
            { title: "Post 1", content: "Content 1", views: 10, rating: 4.0 },
            { title: "Post 2", content: "Content 2", views: 20, rating: 4.5 },
            { title: "Post 3", content: "Content 3", views: 30, rating: 5.0 },
        ]

        for (const entityData of entities) {
            const entity = new LibsqlFeaturesTest()
            Object.assign(entity, entityData)
            await repository.save(entity)
        }

        // Test aggregation queries
        const totalViews = await repository
            .createQueryBuilder("post")
            .select("SUM(post.views)", "total")
            .getRawOne()

        expect(totalViews.total).to.equal(60)

        // Test average rating
        const avgRating = await repository
            .createQueryBuilder("post")
            .select("AVG(post.rating)", "average")
            .getRawOne()

        expect(parseFloat(avgRating.average)).to.be.closeTo(4.5, 0.1)

        // Test filtered aggregation
        const highRatingCount = await repository
            .createQueryBuilder("post")
            .where("post.rating >= :rating", { rating: 4.5 })
            .getCount()

        expect(highRatingCount).to.equal(2)
    })

    it("should handle transactions", async () => {
        const queryRunner = dataSource.createQueryRunner()
        await queryRunner.connect()
        await queryRunner.startTransaction()

        try {
            const entity1 = new LibsqlFeaturesTest()
            entity1.title = "Transaction Test 1"
            entity1.content = "Content 1"
            entity1.views = 1
            await queryRunner.manager.save(entity1)

            const entity2 = new LibsqlFeaturesTest()
            entity2.title = "Transaction Test 2"
            entity2.content = "Content 2"
            entity2.views = 2
            await queryRunner.manager.save(entity2)

            await queryRunner.commitTransaction()

            // Verify both entities were saved
            const repository = dataSource.getRepository(LibsqlFeaturesTest)
            const count = await repository.count()
            expect(count).to.equal(2)
        } catch (error) {
            await queryRunner.rollbackTransaction()
            throw error
        } finally {
            await queryRunner.release()
        }
    })

    it("should handle rollback transactions", async () => {
        const queryRunner = dataSource.createQueryRunner()
        await queryRunner.connect()
        await queryRunner.startTransaction()

        try {
            const entity1 = new LibsqlFeaturesTest()
            entity1.title = "Rollback Test 1"
            entity1.content = "Content 1"
            entity1.views = 1
            await queryRunner.manager.save(entity1)

            // Rollback the transaction
            await queryRunner.rollbackTransaction()

            // Verify entity was not saved
            const repository = dataSource.getRepository(LibsqlFeaturesTest)
            const count = await repository.count()
            expect(count).to.equal(0)
        } finally {
            await queryRunner.release()
        }
    })

    it("should handle PRAGMA statements", async () => {
        const queryRunner = dataSource.createQueryRunner()

        // Test foreign key pragma
        const fkResult = await queryRunner.query("PRAGMA foreign_keys")
        expect(fkResult[0].foreign_keys).to.equal(1)

        // Test journal mode
        const journalResult = await queryRunner.query("PRAGMA journal_mode")
        expect(journalResult[0].journal_mode).to.be.a("string")

        await queryRunner.release()
    })

    it("should handle bulk operations", async () => {
        const repository = dataSource.getRepository(LibsqlFeaturesTest)

        // Bulk insert
        const entities = []
        for (let i = 0; i < 100; i++) {
            const entity = new LibsqlFeaturesTest()
            entity.title = `Bulk Test ${i}`
            entity.content = `Content ${i}`
            entity.views = i
            entity.rating = Math.random() * 5
            entities.push(entity)
        }

        await repository.save(entities)

        // Verify bulk insert
        const count = await repository.count()
        expect(count).to.equal(100)

        // Bulk update
        await repository
            .createQueryBuilder()
            .update(LibsqlFeaturesTest)
            .set({ isActive: false })
            .where("views > :views", { views: 50 })
            .execute()

        // Verify bulk update
        const inactiveCount = await repository.count({
            where: { isActive: false },
        })
        expect(inactiveCount).to.equal(49) // 51-99 (49 entities)

        // Bulk delete
        await repository
            .createQueryBuilder()
            .delete()
            .from(LibsqlFeaturesTest)
            .where("views < :views", { views: 10 })
            .execute()

        // Verify bulk delete
        const remainingCount = await repository.count()
        expect(remainingCount).to.equal(90) // 100 - 10 deleted
    })

    it("should handle text search and pattern matching", async () => {
        const repository = dataSource.getRepository(LibsqlFeaturesTest)

        // Insert test data
        const entities = [
            {
                title: "JavaScript Guide",
                content: "Learn JavaScript programming",
            },
            {
                title: "TypeScript Manual",
                content: "Advanced TypeScript features",
            },
            { title: "Python Tutorial", content: "Python for beginners" },
            {
                title: "React Documentation",
                content: "JavaScript library for UI",
            },
        ]

        for (const entityData of entities) {
            const entity = new LibsqlFeaturesTest()
            Object.assign(entity, entityData)
            await repository.save(entity)
        }

        // Test LIKE pattern matching
        const jsResults = await repository
            .createQueryBuilder("post")
            .where("post.title LIKE :pattern", { pattern: "%Script%" })
            .getMany()

        expect(jsResults).to.have.length(2)

        // Test case-insensitive search
        const searchResults = await repository
            .createQueryBuilder("post")
            .where("LOWER(post.content) LIKE LOWER(:pattern)", {
                pattern: "%javascript%",
            })
            .getMany()

        expect(searchResults).to.have.length(2)
    })

    it("should handle date and time operations", async () => {
        const repository = dataSource.getRepository(LibsqlFeaturesTest)

        const entity = new LibsqlFeaturesTest()
        entity.title = "Date Test"
        entity.content = "Testing date operations"
        entity.views = 1

        const saved = await repository.save(entity)

        // Test date queries
        const today = new Date()
        const recentPosts = await repository
            .createQueryBuilder("post")
            .where("date(post.createdAt) = date(:today)", { today })
            .getMany()

        expect(recentPosts).to.have.length(1)
        expect(recentPosts[0].id).to.equal(saved.id)
    })
})
