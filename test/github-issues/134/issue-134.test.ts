import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { expect } from "chai"

describe("github issues > #134 Error TIME is converted to 'HH-mm' instead of 'HH:mm", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: [
                    "mysql",
                    "mariadb",
                    "sqlite",
                    "better-sqlite3",
                    "mssql",
                    "postgres",
                ], // Oracle does not support TIME data type.
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should successfully persist the post with creationDate in HH:mm and return persisted entity", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const postRepository = connection.getRepository(Post)
                const post = new Post()
                const currentDate = new Date()
                post.title = "Hello Post #1"
                post.creationDate = currentDate

                const savedPost = await postRepository.save(post)
                const loadedPost = await connection.manager
                    .createQueryBuilder(Post, "post")
                    .where("post.id=:id", { id: savedPost.id })
                    .getOne()

                // create a correct minutes:hours:seconds string
                let hours = String(currentDate.getHours())
                let minutes = String(currentDate.getMinutes())
                let seconds = String(currentDate.getSeconds())
                hours = hours.length === 1 ? "0" + hours : hours
                minutes = minutes.length === 1 ? "0" + minutes : minutes
                seconds = seconds.length === 1 ? "0" + seconds : seconds

                expect(loadedPost).not.to.be.null
                loadedPost!.creationDate.should.be.equal(
                    hours + ":" + minutes + ":" + seconds,
                )
            }),
        ))
})
