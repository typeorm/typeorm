import { expect } from "chai"
import "reflect-metadata"
import {
    CannotConnectAlreadyConnectedError,
    CannotExecuteNotConnectedError,
} from "../../../src"
import { DataSource } from "../../../src/data-source/DataSource"
import { PostgresConnectionOptions } from "../../../src/driver/postgres/PostgresConnectionOptions"
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

describe("Connection", () => {
    // const resourceDir = __dirname + "/../../../../../test/functional/connection/";

    describe("before connection is established", () => {
        let dataSource: DataSource
        before(async () => {
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

        it("connection.isConnected should be false", () => {
            if (!dataSource) return

            expect(dataSource.isInitialized).to.equal(false)
        })

        it.skip("entity manager and reactive entity manager should not be accessible", () => {
            expect(() => dataSource.manager).to.throw(
                CannotGetEntityManagerNotConnectedError,
            )
            // expect(() => connection.reactiveEntityManager).to.throw(CannotGetEntityManagerNotConnectedError);
        })

        // todo: they aren't promises anymore
        /*it("import entities, entity schemas, subscribers and naming strategies should work", () => {
         return Promise.all([
         connection.importEntities([Post]).should.be.fulfilled,
         connection.importEntitySchemas([]).should.be.fulfilled,
         connection.importSubscribers([]).should.be.fulfilled,
         connection.importNamingStrategies([]).should.be.fulfilled,
         connection.importEntitiesFromDirectories([]).should.be.fulfilled,
         connection.importEntitySchemaFromDirectories([]).should.be.fulfilled,
         connection.importSubscribersFromDirectories([]).should.be.fulfilled,
         connection.importNamingStrategiesFromDirectories([]).should.be.fulfilled
         ]);
         });*/

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
            // expect(() => connection.getReactiveRepository(Post)).to.throw(NoConnectionForRepositoryError);
            // expect(() => connection.getReactiveTreeRepository(Category)).to.throw(NoConnectionForRepositoryError);
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
        let connections: DataSource[]
        beforeEach(() =>
            createTestingConnections({
                entities: [Post, Category],
                schemaCreate: true,
                dropSchema: true,
            }).then((all) => (connections = all)),
        )
        afterEach(() => closeTestingConnections(connections))

        it("connection.isConnected should be true", () =>
            connections.forEach((connection) => {
                expect(connection.isInitialized).to.equal(true)
            }))

        it("entity manager and reactive entity manager should be accessible", () =>
            connections.forEach((connection) => {
                expect(connection.manager).to.be.instanceOf(EntityManager)
                // expect(connection.reactiveEntityManager).to.be.instanceOf(ReactiveEntityManager);
            }))

        it("should not be able to connect again", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await expect(
                        connection.initialize(),
                    ).to.eventually.be.rejectedWith(
                        CannotConnectAlreadyConnectedError,
                    )
                }),
            ))

        it("should be able to close a connection", async () =>
            Promise.all(
                connections.map(async (connection) => {
                    await expect(connection.destroy()).to.eventually.be
                        .fulfilled
                }),
            ))
    })

    describe("working with repositories after connection is established successfully", () => {
        let connections: DataSource[]
        before(() =>
            createTestingConnections({
                entities: [Post, Category],
                schemaCreate: true,
                dropSchema: true,
            }).then((all) => (connections = all)),
        )
        after(() => closeTestingConnections(connections))

        it("should be able to get simple entity repository", () =>
            connections.forEach((connection) => {
                connection.getRepository(Post).should.be.instanceOf(Repository)
                connection
                    .getRepository(Post)
                    .should.not.be.instanceOf(TreeRepository)
                connection.getRepository(Post).target.should.be.eql(Post)
            }))

        it("should be able to get tree entity repository", () =>
            connections.forEach((connection) => {
                connection
                    .getTreeRepository(Category)
                    .should.be.instanceOf(TreeRepository)
                connection
                    .getTreeRepository(Category)
                    .target.should.be.eql(Category)
            }))

        // it("should be able to get simple entity reactive repository", () => connections.forEach(connection => {
        //     connection.getReactiveRepository(Post).should.be.instanceOf(ReactiveRepository);
        //     connection.getReactiveRepository(Post).should.not.be.instanceOf(TreeReactiveRepository);
        //     connection.getReactiveRepository(Post).target.should.be.eql(Post);
        // }));

        // it("should be able to get tree entity reactive repository", () => connections.forEach(connection => {
        //     connection.getReactiveTreeRepository(Category).should.be.instanceOf(TreeReactiveRepository);
        //     connection.getReactiveTreeRepository(Category).target.should.be.eql(Category);
        // }));

        // it("should not be able to get tree entity repository of the non-tree entities", () => connections.forEach(connection => {
        //     expect(() => connection.getTreeRepository(Post)).to.throw(Error); // RepositoryNotTreeError
        //     // expect(() => connection.getReactiveTreeRepository(Post)).to.throw(RepositoryNotTreeError);
        // }));

        // it("should not be able to get repositories that are not registered", () => connections.forEach(connection => {
        //     expect(() => connection.getRepository("SomeEntity")).to.throw(Error); // RepositoryNotTreeError
        //     expect(() => connection.getTreeRepository("SomeEntity")).to.throw(Error); // RepositoryNotTreeError
        //     // expect(() => connection.getReactiveRepository("SomeEntity")).to.throw(RepositoryNotFoundError);
        //     // expect(() => connection.getReactiveTreeRepository("SomeEntity")).to.throw(RepositoryNotFoundError);
        // }));
    })

    describe("generate a schema when connection.synchronize is called", () => {
        let connections: DataSource[]
        before(() =>
            createTestingConnections({
                entities: [Post],
                schemaCreate: true,
                dropSchema: true,
            }).then((all) => (connections = all)),
        )
        after(() => closeTestingConnections(connections))

        it("database should be empty after schema is synced with dropDatabase flag", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const postRepository = connection.getRepository(Post)
                    const post = new Post()
                    post.title = "new post"
                    await postRepository.save(post)
                    const loadedPost = await postRepository.findOneBy({
                        id: post.id,
                    })
                    expect(loadedPost).to.be.eql(post)
                    await connection.synchronize(true)
                    const againLoadedPost = await postRepository.findOneBy({
                        id: post.id,
                    })
                    expect(againLoadedPost).to.equal(null)
                }),
            ))
    })

    describe("log a schema when connection.logSyncSchema is called", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [Post],
                })),
        )
        after(() => closeTestingConnections(connections))

        it("should return sql log properly", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection.driver.createSchemaBuilder().log()
                    // console.log(sql);
                }),
            ))
    })

    describe("after connection is closed successfully", () => {
        // open a close connections
        let connections: DataSource[] = []
        before(async () => {
            connections = await createTestingConnections({
                entities: [Post],
                schemaCreate: true,
                dropSchema: true,
            })
            await Promise.all(
                connections.map(async (connection) => {
                    await connection.destroy()
                }),
            )
        })

        it("should not be able to close already closed connection", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await expect(
                        connection.destroy(),
                    ).to.eventually.be.rejectedWith(
                        CannotExecuteNotConnectedError,
                    )
                }),
            ))

        it("connection.isInitialized should be false", () =>
            connections.forEach((connection) => {
                expect(connection.isInitialized).to.equal(false)
            }))
    })

    describe("skip schema generation when synchronize option is set to false", () => {
        let connections: DataSource[]
        beforeEach(() =>
            createTestingConnections({
                entities: [View],
                dropSchema: true,
            }).then((all) => (connections = all)),
        )
        afterEach(() => closeTestingConnections(connections))

        it("database should be empty after schema sync", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection.synchronize(true)
                    const queryRunner = connection.createQueryRunner()
                    const tables = await queryRunner.getTables(["view"])
                    const tableNames = tables.map((table) => table.name)
                    await queryRunner.release()
                    expect(tableNames).to.have.length(0)
                }),
            ))
    })

    describe("different names of the same content of the schema", () => {
        let connections: DataSource[]
        beforeEach(async () => {
            const connections1 = await createTestingConnections({
                name: "test",
                enabledDrivers: ["postgres"],
                entities: [CommentV1, GuestV1],
                schema: "test-schema",
                dropSchema: true,
            })
            const connections2 = await createTestingConnections({
                name: "another",
                enabledDrivers: ["postgres"],
                entities: [CommentV1, GuestV1],
                schema: "another-schema",
                dropSchema: true,
            })
            connections = [...connections1, ...connections2]
        })
        after(() => closeTestingConnections(connections))

        it("should not interfere with each other", async () => {
            await Promise.all(connections.map((c) => c.synchronize()))
            await closeTestingConnections(connections)
            const connections1 = await createTestingConnections({
                name: "test",
                enabledDrivers: ["postgres"],
                entities: [CommentV2, GuestV2],
                schema: "test-schema",
                dropSchema: false,
                schemaCreate: true,
            })
            const connections2 = await createTestingConnections({
                name: "another",
                enabledDrivers: ["postgres"],
                entities: [CommentV2, GuestV2],
                schema: "another-schema",
                dropSchema: false,
                schemaCreate: true,
            })
            connections = [...connections1, ...connections2]
        })
    })

    describe("can change postgres default schema name", () => {
        let connections: DataSource[]
        beforeEach(async () => {
            const connections1 = await createTestingConnections({
                name: "test",
                enabledDrivers: ["postgres"],
                entities: [CommentV1, GuestV1],
                schema: "test-schema",
                dropSchema: true,
            })
            const connections2 = await createTestingConnections({
                name: "another",
                enabledDrivers: ["postgres"],
                entities: [CommentV1, GuestV1],
                schema: "another-schema",
                dropSchema: true,
            })
            connections = [...connections1, ...connections2]
        })
        afterEach(() => closeTestingConnections(connections))

        it("schema name can be set", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection.synchronize(true)
                    const schemaName = (
                        connection.options as PostgresConnectionOptions
                    ).schema
                    const comment = new CommentV1()
                    comment.title = "Change SchemaName"
                    comment.context = `To ${schemaName}`

                    const commentRepo = connection.getRepository(CommentV1)
                    await commentRepo.save(comment)

                    const queryRunner = connection.createQueryRunner()
                    const rows = await queryRunner.query(
                        `select * from "${schemaName}"."comment" where id = $1`,
                        [comment.id],
                    )
                    await queryRunner.release()
                    expect(rows[0]["context"]).to.be.eq(comment.context)
                }),
            ))
    })
})
