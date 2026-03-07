import { expect } from "chai"
import "reflect-metadata"
import {
    CannotConnectAlreadyConnectedError,
    CannotExecuteNotConnectedError,
} from "../../../src"
import { DataSource } from "../../../src/data-source/DataSource"
import type { PostgresDataSourceOptions } from "../../../src/driver/postgres/PostgresDataSourceOptions"
import { EntityManager } from "../../../src/entity-manager/EntityManager"
import { CannotGetEntityManagerNotConnectedError } from "../../../src/error/CannotGetEntityManagerNotConnectedError"
import { NoConnectionForRepositoryError } from "../../../src/error/NoConnectionForRepositoryError"
import { Repository } from "../../../src/repository/Repository"
import { TreeRepository } from "../../../src/repository/TreeRepository"
import "../../utils/test-setup"
import {
    closeTestingConnections,
    createTestingConnections,
    setupSingleTestingConnection,
} from "../../utils/test-utils"
import { Category } from "./entity/Category"
import { Post } from "./entity/Post"
import { Comment as CommentV1 } from "./entity/v1/Comment"
import { Guest as GuestV1 } from "./entity/v1/Guest"
import { Comment as CommentV2 } from "./entity/v2/Comment"
import { Guest as GuestV2 } from "./entity/v2/Guest"
import { View } from "./entity/View"
import { Professor } from "./entity/Professor"
import { Subject } from "./entity/Subject"
import { SiteLocation } from "./entity/SiteLocation"
import { Site } from "./entity/Site"

describe("DataSource", () => {
    describe("before connection is established", () => {
        let dataSource: DataSource
        before(() => {
            const options = setupSingleTestingConnection("mysql", {
                name: "default",
                entities: [],
            })
            if (!options) return

            dataSource = new DataSource(options)
        })
        after(() => {
            if (dataSource?.isInitialized) {
                return dataSource.destroy()
            }

            return Promise.resolve()
        })

        it("dataSource.isInitialized should be false", () => {
            if (!dataSource) return

            expect(dataSource.isInitialized).to.equal(false)
        })

        it.skip("entity manager should not be accessible", () => {
            expect(() => dataSource.manager).to.throw(
                CannotGetEntityManagerNotConnectedError,
            )
        })

        it("should not be able to close", async () => {
            if (!dataSource) return

            await expect(dataSource.destroy()).to.eventually.be.rejectedWith(
                CannotExecuteNotConnectedError,
            )
        })

        it("should not be able to sync a schema", async () => {
            if (!dataSource) return

            await expect(
                dataSource.synchronize(),
            ).to.eventually.be.rejectedWith(CannotExecuteNotConnectedError) // CannotCloseNotConnectedError
        })

        it.skip("should not be able to use repositories", () => {
            if (!dataSource) return

            expect(() => dataSource.getRepository(Post)).to.throw(
                NoConnectionForRepositoryError,
            )
            expect(() => dataSource.getTreeRepository(Category)).to.throw(
                NoConnectionForRepositoryError,
            )
            // expect(() => dataSource.getReactiveRepository(Post)).to.throw(NoConnectionForRepositoryError);
            // expect(() => dataSource.getReactiveTreeRepository(Category)).to.throw(NoConnectionForRepositoryError);
        })

        it("should be able to connect", async () => {
            if (!dataSource) return

            await expect(dataSource.initialize()).to.eventually.be.fulfilled
        })
    })

    describe.skip("establishing connection", () => {
        it("should throw DriverOptionNotSetError when extra.socketPath and host is missing", () => {
            expect(() => {
                new DataSource({
                    type: "mysql",
                    username: "test",
                    password: "test",
                    database: "test",
                    entities: [],
                    dropSchema: false,
                })
            }).to.throw(Error)
        })
    })

    describe("after connection is established successfully", () => {
        let dataSources: DataSource[]
        beforeEach(async () => {
            dataSources = await createTestingConnections({
                entities: [Post, Category],
                schemaCreate: true,
                dropSchema: true,
            })
        })
        afterEach(() => closeTestingConnections(dataSources))

        it("dataSource.isInitialized should be true", () =>
            dataSources.forEach((dataSource) => {
                expect(dataSource.isInitialized).to.equal(true)
            }))

        it("entity manager should be accessible", () =>
            dataSources.forEach((dataSource) => {
                expect(dataSource.manager).to.be.instanceOf(EntityManager)
            }))

        it("should not be able to connect again", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await expect(
                        dataSource.initialize(),
                    ).to.eventually.be.rejectedWith(
                        CannotConnectAlreadyConnectedError,
                    )
                }),
            ))

        it("should be able to close a connection", async () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await expect(dataSource.destroy()).to.eventually.be
                        .fulfilled
                }),
            ))
    })

    describe("working with repositories after connection is established successfully", () => {
        let dataSources: DataSource[]
        beforeEach(async () => {
            dataSources = await createTestingConnections({
                entities: [Post, Category],
                schemaCreate: true,
                dropSchema: true,
            })
        })
        after(() => closeTestingConnections(dataSources))

        it("should be able to get simple entity repository", () =>
            dataSources.forEach((dataSource) => {
                dataSource.getRepository(Post).should.be.instanceOf(Repository)
                dataSource
                    .getRepository(Post)
                    .should.not.be.instanceOf(TreeRepository)
                dataSource.getRepository(Post).target.should.be.eql(Post)
            }))

        it("should be able to get tree entity repository", () =>
            dataSources.forEach((dataSource) => {
                dataSource
                    .getTreeRepository(Category)
                    .should.be.instanceOf(TreeRepository)
                dataSource
                    .getTreeRepository(Category)
                    .target.should.be.eql(Category)
            }))

        // it("should not be able to get tree entity repository of the non-tree entities", () => dataSources.forEach(dataSource => {
        //     expect(() => dataSource.getTreeRepository(Post)).to.throw(Error); // RepositoryNotTreeError
        // }));

        // it("should not be able to get repositories that are not registered", () => dataSources.forEach(dataSource => {
        //     expect(() => dataSource.getRepository("SomeEntity")).to.throw(Error); // RepositoryNotTreeError
        //     expect(() => dataSource.getTreeRepository("SomeEntity")).to.throw(Error); // RepositoryNotTreeError
        // }));
    })

    describe("generate a schema when dataSource.synchronize is called", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [Post],
                schemaCreate: true,
                dropSchema: true,
            })
        })
        after(() => closeTestingConnections(dataSources))

        it("database should be empty after schema is synced with dropDatabase flag", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const postRepository = dataSource.getRepository(Post)
                    const post = new Post()
                    post.title = "new post"
                    await postRepository.save(post)
                    const loadedPost = await postRepository.findOneBy({
                        id: post.id,
                    })
                    expect(loadedPost).to.be.eql(post)
                    await dataSource.synchronize(true)
                    const againLoadedPost = await postRepository.findOneBy({
                        id: post.id,
                    })
                    expect(againLoadedPost).to.equal(null)
                }),
            ))
    })

    describe("log a schema when dataSource.logSyncSchema is called", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [Post],
            })
        })
        after(() => closeTestingConnections(dataSources))

        it("should return sql log properly", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await dataSource.driver.createSchemaBuilder().log()
                    // console.log(sql);
                }),
            ))
    })

    describe("after connection is closed successfully", () => {
        // open and close connections
        let dataSources: DataSource[] = []
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [Post],
                schemaCreate: true,
                dropSchema: true,
            })
            await Promise.all(
                dataSources.map((dataSource) => dataSource.destroy()),
            )
        })

        it("should not be able to close already closed connection", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await expect(
                        dataSource.destroy(),
                    ).to.eventually.be.rejectedWith(
                        CannotExecuteNotConnectedError,
                    )
                }),
            ))

        it("dataSource.isInitialized should be false", () =>
            dataSources.forEach((dataSource) => {
                expect(dataSource.isInitialized).to.equal(false)
            }))
    })

    describe("skip schema generation when synchronize option is set to false", () => {
        let dataSources: DataSource[]
        beforeEach(async () => {
            dataSources = await createTestingConnections({
                entities: [View],
                dropSchema: true,
            })
        })
        afterEach(() => closeTestingConnections(dataSources))

        it("database should be empty after schema sync", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await dataSource.synchronize(true)
                    const queryRunner = dataSource.createQueryRunner()
                    const tables = await queryRunner.getTables(["view"])
                    const tableNames = tables.map((table) => table.name)
                    await queryRunner.release()
                    expect(tableNames).to.have.length(0)
                }),
            ))
    })

    describe("different names of the same content of the schema", () => {
        let dataSources: DataSource[]
        beforeEach(async () => {
            const dataSources1 = await createTestingConnections({
                name: "test",
                enabledDrivers: ["postgres"],
                entities: [CommentV1, GuestV1],
                schema: "test-schema",
                dropSchema: true,
            })
            const dataSources2 = await createTestingConnections({
                name: "another",
                enabledDrivers: ["postgres"],
                entities: [CommentV1, GuestV1],
                schema: "another-schema",
                dropSchema: true,
            })
            dataSources = [...dataSources1, ...dataSources2]
        })
        after(() => closeTestingConnections(dataSources))

        it("should not interfere with each other", async () => {
            await Promise.all(dataSources.map((c) => c.synchronize()))
            await closeTestingConnections(dataSources)
            const dataSources1 = await createTestingConnections({
                name: "test",
                enabledDrivers: ["postgres"],
                entities: [CommentV2, GuestV2],
                schema: "test-schema",
                dropSchema: false,
                schemaCreate: true,
            })
            const dataSources2 = await createTestingConnections({
                name: "another",
                enabledDrivers: ["postgres"],
                entities: [CommentV2, GuestV2],
                schema: "another-schema",
                dropSchema: false,
                schemaCreate: true,
            })
            dataSources = [...dataSources1, ...dataSources2]
        })
    })

    describe("can change postgres default schema name", () => {
        let dataSources: DataSource[]
        beforeEach(async () => {
            const dataSources1 = await createTestingConnections({
                name: "test",
                enabledDrivers: ["postgres"],
                entities: [CommentV1, GuestV1],
                schema: "test-schema",
                dropSchema: true,
            })
            const dataSources2 = await createTestingConnections({
                name: "another",
                enabledDrivers: ["postgres"],
                entities: [CommentV1, GuestV1],
                schema: "another-schema",
                dropSchema: true,
            })
            dataSources = [...dataSources1, ...dataSources2]
        })
        afterEach(() => closeTestingConnections(dataSources))

        it("schema name can be set", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await dataSource.synchronize(true)
                    const schemaName = (
                        dataSource.options as PostgresDataSourceOptions
                    ).schema
                    const comment = new CommentV1()
                    comment.title = "Change SchemaName"
                    comment.context = `To ${schemaName}`

                    const commentRepo = dataSource.getRepository(CommentV1)
                    await commentRepo.save(comment)

                    const queryRunner = dataSource.createQueryRunner()
                    const rows = await queryRunner.query(
                        `select * from "${schemaName}"."comment" where id = $1`,
                        [comment.id],
                    )
                    await queryRunner.release()
                    expect(rows[0]["context"]).to.be.eq(comment.context)
                }),
            ))
    })

    // GitHub issue #7738
    describe("synchronize with multiple foreign keys to same table", () => {
        let dataSources: DataSource[]
        beforeEach(async () => {
            dataSources = await createTestingConnections({
                enabledDrivers: ["postgres"],
                entities: [Professor, Subject, Site, SiteLocation],
                dropSchema: true,
            })
        })
        afterEach(() => closeTestingConnections(dataSources))

        it("should not fail with constraint already exists error when synchronizing multiple times", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    // First synchronization
                    await dataSource.synchronize()

                    // Second synchronization should not fail with constraint error
                    await expect(dataSource.synchronize()).to.not.be.rejected

                    const professorRepo = dataSource.getRepository(Professor)
                    const subjectRepo = dataSource.getRepository(Subject)
                    const siteRepo = dataSource.getRepository(Site)
                    const siteLocationRepo =
                        dataSource.getRepository(SiteLocation)

                    // Create and save entities to test foreign key relationships
                    const professor = professorRepo.create({
                        name: "Dr. Smith",
                    })
                    await professorRepo.save(professor)

                    const assistant = professorRepo.create({
                        name: "Dr. Jones",
                    })
                    await professorRepo.save(assistant)

                    const subject = subjectRepo.create({
                        name: "Mathematics",
                        professor: professor,
                        assistant: assistant,
                    })
                    await subjectRepo.save(subject)

                    const loadedSubject = await subjectRepo.findOne({
                        where: { id: subject.id },
                        relations: ["professor", "assistant"],
                    })

                    const site = siteRepo.create({ name: "Main Campus" })
                    await siteRepo.save(site)

                    const siteLocation = siteLocationRepo.create({
                        address: "123 Main St",
                        site: site,
                    })
                    await siteLocationRepo.save(siteLocation)

                    const loadedSiteLocation = await siteLocationRepo.findOne({
                        where: { id: siteLocation.id },
                        relations: ["site"],
                    })

                    expect(loadedSiteLocation).to.not.be.null
                    expect(loadedSiteLocation!.site.name).to.equal(
                        "Main Campus",
                    )

                    expect(loadedSubject).to.not.be.null
                    expect(loadedSubject!.professor.name).to.equal("Dr. Smith")
                    expect(loadedSubject!.assistant.name).to.equal("Dr. Jones")
                }),
            ))
    })
})
