import "reflect-metadata"
import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"
import { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Question } from "./entity/Question"
import { Post } from "./entity/Post"

describe("uuid-mssql", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mssql"],
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should persist uuid correctly when it is generated non primary column", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)
                const questionRepository = connection.getRepository(Question)
                const queryRunner = connection.createQueryRunner()
                const postTable = await queryRunner.getTable("post")
                const questionTable = await queryRunner.getTable("question")
                await queryRunner.release()

                const post = new Post()
                await postRepository.save(post)
                const loadedPost = await postRepository.findOne({
                    where: {
                        id: 1,
                    },
                })
                expect(loadedPost!.uuid).to.be.exist
                postTable!
                    .findColumnByName("uuid")!
                    .type.should.be.equal("uniqueidentifier")

                const post2 = new Post()
                post2.uuid = "FD357B8F-8838-42F6-B7A2-AE027444E895"
                await postRepository.save(post2)
                const loadedPost2 = await postRepository.findOne({
                    where: {
                        id: 2,
                    },
                })
                expect(loadedPost2!.uuid).to.equal(
                    "FD357B8F-8838-42F6-B7A2-AE027444E895",
                )

                const question = new Question()
                const savedQuestion = await questionRepository.save(question)
                const loadedQuestion = await questionRepository.findOne({
                    where: {
                        id: savedQuestion.id,
                    },
                })
                expect(loadedQuestion!.id).to.be.exist
                expect(loadedQuestion!.uuid).to.be.exist
                expect(loadedQuestion!.uuid2).to.be.null
                expect(loadedQuestion!.uuid3).to.be.exist
                questionTable!
                    .findColumnByName("id")!
                    .type.should.be.equal("uniqueidentifier")
                questionTable!
                    .findColumnByName("uuid")!
                    .type.should.be.equal("uniqueidentifier")
                questionTable!
                    .findColumnByName("uuid2")!
                    .type.should.be.equal("uniqueidentifier")
                questionTable!
                    .findColumnByName("uuid3")!
                    .type.should.be.equal("uniqueidentifier")

                const question2 = new Question()
                question2.id = "1ECAD7F6-23EE-453E-BB44-16ECA26D5189"
                question2.uuid = "35B44650-B2CD-44EC-AA54-137FBDF1C373"
                question2.uuid2 = null
                question2.uuid3 = null
                await questionRepository.save(question2)
                const loadedQuestion2 = await questionRepository.findOne({
                    where: {
                        id: "1ECAD7F6-23EE-453E-BB44-16ECA26D5189",
                    },
                })
                expect(loadedQuestion2!.id).to.equal(
                    "1ECAD7F6-23EE-453E-BB44-16ECA26D5189",
                )
                expect(loadedQuestion2!.uuid).to.equal(
                    "35B44650-B2CD-44EC-AA54-137FBDF1C373",
                )
                expect(loadedQuestion2!.uuid2).to.be.null
                expect(loadedQuestion2!.uuid3).to.be.null
            }),
        ))
})
