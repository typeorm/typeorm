import "reflect-metadata"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Teacher } from "./entity/Teacher"
import { Post } from "./entity/Post"
import { ExclusionMetadata } from "../../../src/metadata/ExclusionMetadata"

describe("schema builder > change exclusion constraint", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres"], // Only PostgreSQL supports exclusion constraints.
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should correctly add new exclusion constraint", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const teacherMetadata = dataSource.getMetadata(Teacher)
                const exclusionMetadata = new ExclusionMetadata({
                    entityMetadata: teacherMetadata,
                    args: {
                        target: Teacher,
                        expression: `USING gist ("name" WITH =)`,
                    },
                })
                exclusionMetadata.build(dataSource.namingStrategy)
                teacherMetadata.exclusions.push(exclusionMetadata)

                await dataSource.synchronize()

                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("teacher")
                await queryRunner.release()

                table!.exclusions.length.should.be.equal(1)
            }),
        ))

    it("should correctly change exclusion", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postMetadata = dataSource.getMetadata(Post)
                postMetadata.exclusions[0].expression = `USING gist ("tag" WITH =)`
                postMetadata.exclusions[0].build(dataSource.namingStrategy)

                await dataSource.synchronize()

                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                table!.exclusions[0]
                    .expression!.indexOf("tag")
                    .should.be.not.equal(-1)
            }),
        ))

    it("should correctly drop removed exclusion", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postMetadata = dataSource.getMetadata(Post)
                postMetadata.exclusions = []

                await dataSource.synchronize()

                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                table!.exclusions.length.should.be.equal(0)
            }),
        ))
})
