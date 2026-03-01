import "reflect-metadata"
import "../../../utils/test-setup"
import { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { MainEntity } from "./entity/MainEntity"
import { RelatedEntity } from "./entity/RelatedEntity"
import { expect } from "chai"

describe("find options > select > lazy relations", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                __dirname,
                enabledDrivers: ["postgres"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should works when relations are not eagerly loaded", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const related = new RelatedEntity()
                related.status = false
                await dataSource.manager.save(related)
                const entity = new MainEntity()
                entity.optionId = null
                entity.relatedId = related.id
                await dataSource.manager.save(entity)

                await entity.updateRelatedStatus(dataSource.manager)
                const reloaded = await dataSource.manager.findOneByOrFail(
                    MainEntity,
                    { id: entity.id },
                )

                expect((await reloaded.related).status).to.be.true
            }),
        ))

    it("should update related entity when relation is eagerly loaded", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const related = new RelatedEntity()
                related.status = false
                await dataSource.manager.save(related)
                const entity = new MainEntity()
                entity.optionId = null
                entity.relatedId = related.id
                await dataSource.manager.save(entity)
                const reloaded = await dataSource.manager.findOneOrFail(
                    MainEntity,
                    {
                        where: { id: entity.id },
                        relations: {
                            optionA: true,
                            optionB: true,
                            related: true,
                        },
                    },
                )

                await reloaded.updateRelatedStatus(dataSource.manager)
                const reReloaded = await dataSource.manager.findOneOrFail(
                    MainEntity,
                    {
                        where: { id: entity.id },
                        relations: {
                            optionA: true,
                            optionB: true,
                            related: true,
                        },
                    },
                )

                expect((await reReloaded.related).status).to.be.true
            }),
        ))
})
