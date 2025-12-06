import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"
import { IndexMetadata } from "../../../src/metadata/IndexMetadata"
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

describe("github issues > #750 Need option for Mysql's full text search", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mysql"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(connections))

    it("should correctly create SPATIAL and FULLTEXT indices", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                let table = await queryRunner.getTable("post")
                table!.indices.length.should.be.equal(2)
                const spatialIndex = table!.indices.find(
                    (index) => !!index.isSpatial,
                )
                spatialIndex!.should.be.exist
                const fulltextIndex = table!.indices.find(
                    (index) => !!index.isFulltext,
                )
                fulltextIndex!.should.be.exist

                const metadata = connection.getMetadata(Post)
                const polygonColumn =
                    metadata.findColumnWithPropertyName("polygon")
                const indexMetadata = new IndexMetadata({
                    entityMetadata: metadata,
                    columns: [polygonColumn!],
                    args: {
                        target: Post,
                        spatial: true,
                    },
                })
                indexMetadata.build(connection.namingStrategy)
                metadata.indices.push(indexMetadata)

                const fulltextIndexMetadata = metadata.indices.find(
                    (index) => index.isFulltext,
                )
                fulltextIndexMetadata!.isFulltext = false

                await connection.synchronize()
                table = await queryRunner.getTable("post")
                table!.indices.length.should.be.equal(3)
                const spatialIndices = table!.indices.filter(
                    (index) => !!index.isSpatial,
                )
                spatialIndices.length.should.be.equal(2)
                const fulltextIndex2 = table!.indices.find(
                    (index) => !!index.isFulltext,
                )
                expect(fulltextIndex2).to.be.undefined

                await queryRunner.release()
            }),
        ))
})
