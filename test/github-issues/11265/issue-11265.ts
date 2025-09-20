import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { RelationNestedEntity } from "./entity/relationNestedEntity"
import { RelationEntity } from "./entity/relationEntity"
import { ParentEntity } from "./entity/parent"

describe("github issues > #11265 Eager Relations with DeleteDateColumn Overwrite Manual Relations During Query Loading", () => {
    let dataSources: DataSource[]

    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should preserve manually requested nested relations", async () => {
        return Promise.all(
            dataSources.map(async (dataSource) => {
                // Prepare test data
                const relationNestedRepository =
                    dataSource.getRepository(RelationNestedEntity)
                const relationEntityRepository =
                    dataSource.getRepository(RelationEntity)
                const parentRepository = dataSource.getRepository(ParentEntity)

                const relationNested = new RelationNestedEntity()
                await relationNestedRepository.save(relationNested)

                const relationEntity = new RelationEntity()
                relationEntity.nested = relationNested
                await relationEntityRepository.save(relationEntity)

                const parent = new ParentEntity()
                parent.relationEntity = relationEntity
                await parentRepository.save(parent)

                // Retrieve user with manually specified nested relation
                const retrievedParent = await parentRepository.findOne({
                    where: { id: parent.id },
                    relations: {
                        relationEntity: {
                            nested: {},
                        },
                    },
                })

                // Assertions
                expect(retrievedParent).to.exist
                expect(retrievedParent!.relationEntity).to.exist
                expect(retrievedParent!.relationEntity.nested).to.exist
            }),
        )
    })
})
