import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"

describe("github issues > #485 If I set the datatype of PrimaryGeneratedColumn to uuid then it is not giving the uuid to the column.", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should persist uuid correctly when it used as PrimaryGeneratedColumn type", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const postRepository = connection.getRepository(Post)
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                const post = new Post()
                const savedPost = await postRepository.save(post)
                const loadedPost = await postRepository.findOneBy({
                    id: savedPost.id,
                })

                expect(loadedPost).to.be.not.undefined
                expect(loadedPost!.id).to.equal(savedPost.id)
                table!.findColumnByName("id")!.type.should.be.equal("uuid")
            }),
        ))
})
