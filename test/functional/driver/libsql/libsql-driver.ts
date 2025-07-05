import { expect } from "chai"
import { DataSource } from "../../../../src/data-source/DataSource"
import { LibsqlDriver } from "../../../../src/driver/libsql/LibsqlDriver"
import { LibsqlConnectionOptions } from "../../../../src/driver/libsql/LibsqlConnectionOptions"
import { Entity, PrimaryGeneratedColumn, Column } from "../../../../src/index"
import { QueryResult } from "../../../../src/query-runner/QueryResult"

@Entity("test_post")
class TestPost {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    content: string

    @Column()
    views: number = 0
}

describe("libsql driver", () => {
    let dataSource: DataSource

    afterEach(async () => {
        if (dataSource && dataSource.isInitialized) {
            await dataSource.destroy()
        }
    })

    describe("basic functionality", () => {
        it("should create driver successfully", () => {
            const dataSource = new DataSource({
                type: "libsql",
                url: "file:test.db",
                entities: [],
                synchronize: true,
                logging: false,
            })

            expect(dataSource.driver).to.be.instanceOf(LibsqlDriver)
        })

        it("should handle connection options correctly", () => {
            const dataSource = new DataSource({
                type: "libsql",
                url: "file:test.db",
                entities: [],
                synchronize: true,
                logging: false,
            })

            const driver = dataSource.driver as LibsqlDriver
            expect(driver.options.type).to.equal("libsql")
            expect(driver.options.url).to.equal("file:test.db")
        })

        it("should connect and disconnect successfully", async () => {
            dataSource = new DataSource({
                type: "libsql",
                url: "file:test_connect.db",
                entities: [TestPost],
                synchronize: true,
                logging: false,
            })

            await dataSource.initialize()
            expect(dataSource.isInitialized).to.be.true

            await dataSource.destroy()
            expect(dataSource.isInitialized).to.be.false
        })

        it("should perform basic CRUD operations", async () => {
            dataSource = new DataSource({
                type: "libsql",
                url: "file:test_crud.db",
                entities: [TestPost],
                synchronize: true,
                logging: false,
            })

            await dataSource.initialize()

            const postRepository = dataSource.getRepository(TestPost)

            // Create
            const newPost = new TestPost()
            newPost.title = "Test Post"
            newPost.content = "This is a test post"
            newPost.views = 10

            const savedPost = await postRepository.save(newPost)
            expect(savedPost.id).to.be.a("number")
            expect(savedPost.title).to.equal("Test Post")

            // Read
            const foundPost = await postRepository.findOne({
                where: { id: savedPost.id },
            })
            expect(foundPost).to.not.be.null
            expect(foundPost!.title).to.equal("Test Post")

            // Update
            foundPost!.title = "Updated Post"
            await postRepository.save(foundPost!)

            const updatedPost = await postRepository.findOne({
                where: { id: savedPost.id },
            })
            expect(updatedPost!.title).to.equal("Updated Post")

            // Delete
            await postRepository.remove(updatedPost!)
            const deletedPost = await postRepository.findOne({
                where: { id: savedPost.id },
            })
            expect(deletedPost).to.be.null
        })

        it("should handle queries with parameters", async () => {
            dataSource = new DataSource({
                type: "libsql",
                url: "file:test_params.db",
                entities: [TestPost],
                synchronize: true,
                logging: false,
            })

            await dataSource.initialize()

            const queryRunner = dataSource.createQueryRunner()
            await queryRunner.query(
                "INSERT INTO test_post (title, content, views) VALUES (?, ?, ?)",
                ["Query Test", "Testing parameters", 5],
            )

            const result = await queryRunner.query(
                "SELECT * FROM test_post WHERE views = ?",
                [5],
            )

            expect(result).to.be.an("array")
            expect(result[0]).to.have.property("title", "Query Test")

            await queryRunner.release()
        })

        it("should handle structured query results", async () => {
            dataSource = new DataSource({
                type: "libsql",
                url: "file:test_structured.db",
                entities: [TestPost],
                synchronize: true,
                logging: false,
            })

            await dataSource.initialize()

            const queryRunner = dataSource.createQueryRunner()
            await queryRunner.query(
                "INSERT INTO test_post (title, content, views) VALUES (?, ?, ?)",
                ["Structured Test", "Testing structured results", 15],
            )

            const structuredResult = await queryRunner.query(
                "SELECT * FROM test_post WHERE views = ?",
                [15],
                true, // useStructuredResult
            )

            expect(structuredResult).to.be.instanceOf(QueryResult)
            expect(structuredResult.records).to.be.an("array")
            expect(structuredResult.records[0]).to.have.property(
                "title",
                "Structured Test",
            )

            await queryRunner.release()
        })
    })

    describe("connection options", () => {
        it("should support WAL mode", () => {
            const options: LibsqlConnectionOptions = {
                type: "libsql",
                url: "file:wal_test.db",
                enableWAL: true,
                entities: [],
                synchronize: true,
                logging: false,
            }

            const dataSource = new DataSource(options)
            const driver = dataSource.driver as LibsqlDriver
            expect(driver.options.enableWAL).to.be.true
        })

        it("should support custom database name", () => {
            const options: LibsqlConnectionOptions = {
                type: "libsql",
                url: "file:custom.db",
                database: "custom_name",
                entities: [],
                synchronize: true,
                logging: false,
            }

            const dataSource = new DataSource(options)
            const driver = dataSource.driver as LibsqlDriver
            expect(driver.options.database).to.equal("custom_name")
        })

        it("should support auth token for remote connections", () => {
            const options: LibsqlConnectionOptions = {
                type: "libsql",
                url: "https://example.turso.io",
                authToken: "test_token",
                entities: [],
                synchronize: true,
                logging: false,
            }

            const dataSource = new DataSource(options)
            const driver = dataSource.driver as LibsqlDriver
            expect(driver.options.authToken).to.equal("test_token")
        })

        it("should support embedded replica options", () => {
            const options: LibsqlConnectionOptions = {
                type: "libsql",
                url: "file:replica.db",
                syncUrl: "https://example.turso.io",
                authToken: "test_token",
                syncPeriod: 30,
                readYourWrites: true,
                entities: [],
                synchronize: true,
                logging: false,
            }

            const dataSource = new DataSource(options)
            const driver = dataSource.driver as LibsqlDriver
            expect(driver.options.syncUrl).to.equal("https://example.turso.io")
            expect(driver.options.syncPeriod).to.equal(30)
            expect(driver.options.readYourWrites).to.be.true
        })

        it("should support custom driver instance", () => {
            const mockDriver = { createClient: () => {} }
            const options: LibsqlConnectionOptions = {
                type: "libsql",
                url: "file:custom_driver.db",
                driver: mockDriver,
                entities: [],
                synchronize: true,
                logging: false,
            }

            const dataSource = new DataSource(options)
            const driver = dataSource.driver as LibsqlDriver
            expect(driver.options.driver).to.equal(mockDriver)
        })

        it("should support encryption key", () => {
            const options: LibsqlConnectionOptions = {
                type: "libsql",
                url: "file:encrypted.db",
                key: "encryption_key",
                entities: [],
                synchronize: true,
                logging: false,
            }

            const dataSource = new DataSource(options)
            const driver = dataSource.driver as LibsqlDriver
            expect(driver.options.key).to.equal("encryption_key")
        })

        it("should support prepareDatabase function", () => {
            const prepareFn = async (db: any) => {
                // Mock prepare function
            }
            const options: LibsqlConnectionOptions = {
                type: "libsql",
                url: "file:prepared.db",
                prepareDatabase: prepareFn,
                entities: [],
                synchronize: true,
                logging: false,
            }

            const dataSource = new DataSource(options)
            const driver = dataSource.driver as LibsqlDriver
            expect(driver.options.prepareDatabase).to.equal(prepareFn)
        })
    })

    describe("error handling", () => {
        it("should handle connection errors gracefully", async () => {
            const dataSource = new DataSource({
                type: "libsql",
                url: "file:/invalid/path/test.db",
                entities: [TestPost],
                synchronize: true,
                logging: false,
            })

            try {
                await dataSource.initialize()
                expect.fail("Should have thrown an error")
            } catch (error) {
                expect(error).to.be.an("error")
            }
        })

        it("should handle query errors gracefully", async () => {
            dataSource = new DataSource({
                type: "libsql",
                url: "file:error_test.db",
                entities: [TestPost],
                synchronize: true,
                logging: false,
            })

            await dataSource.initialize()

            const queryRunner = dataSource.createQueryRunner()

            try {
                await queryRunner.query("INVALID SQL QUERY")
                expect.fail("Should have thrown an error")
            } catch (error) {
                expect(error).to.be.an("error")
            }

            await queryRunner.release()
        })
    })
})
