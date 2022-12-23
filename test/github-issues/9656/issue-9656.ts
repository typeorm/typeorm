import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { ReferencedEntityOne } from "./entity/ReferencedEntityOne"
import { ReferencedEntityTwo } from "./entity/ReferencedEntityTwo"
import { CompositeEntity } from "./entity/CompositeEntity"

describe("github issues > #9656 Cascading OneToMany with composite key fails on update", () => {
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

    function makeReferencedEntityOne() {
        const one = new ReferencedEntityOne()
        one.composites = []
        one.name = "the default name"
        return one
    }

    function makeReferencedEntityTwo() {
        const two = new ReferencedEntityTwo()
        two.composites = []
        two.num = Math.floor(Math.random() * 10000)
        return two
    }

    function makeComposite(oneId: string, twoId: string) {
        const composite = new CompositeEntity()

        composite.referencedEntityOne = new ReferencedEntityOne()
        composite.referencedEntityOne.id = oneId
        composite.referencedEntityOneId = oneId

        composite.referencedEntityTwo = new ReferencedEntityTwo()
        composite.referencedEntityTwo.id = twoId
        composite.referencedEntityTwoId = twoId

        composite.description = `The description: ${oneId} ${twoId}`

        return composite
    }

    function getReferencedEntityOne(dataSource: DataSource, id: string) {
        return dataSource.getRepository(ReferencedEntityOne).findOneOrFail({
            where: { id },
            relations: {
                composites: {
                    referencedEntityTwo: true,
                },
            },
        })
    }

    it("should allow inserting records one by one", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const oneRepo = dataSource.getRepository(ReferencedEntityOne)
                const twoRepo = dataSource.getRepository(ReferencedEntityTwo)
                // const compositeRepo = dataSource.getRepository(CompositeEntity);

                const ones = [
                    makeReferencedEntityOne(),
                    makeReferencedEntityOne(),
                    makeReferencedEntityOne(),
                    makeReferencedEntityOne(),
                ]

                for (const one of ones) {
                    await oneRepo.save(one)
                }

                const twos = [
                    makeReferencedEntityTwo(),
                    makeReferencedEntityTwo(),
                    makeReferencedEntityTwo(),
                    makeReferencedEntityTwo(),
                ]

                for (const two of twos) {
                    await twoRepo.save(two)
                }

                let loadedOne = await getReferencedEntityOne(
                    dataSource,
                    ones[0].id,
                )

                expect(loadedOne.composites).length(0)

                loadedOne.composites.push(
                    makeComposite(loadedOne.id, twos[0].id),
                )

                await oneRepo.save(loadedOne)

                loadedOne = await getReferencedEntityOne(
                    dataSource,
                    loadedOne.id,
                )

                expect(loadedOne.composites).length(1)
                expect(loadedOne.composites[0].referencedEntityTwo.id).equals(
                    twos[0].id,
                )
                expect(loadedOne.composites[0].referencedEntityTwo.num).equals(
                    twos[0].num,
                )

                loadedOne.composites.push(
                    makeComposite(loadedOne.id, twos[1].id),
                )

                await oneRepo.save(loadedOne)

                loadedOne = await getReferencedEntityOne(
                    dataSource,
                    loadedOne.id,
                )

                expect(loadedOne.composites).length(2)
            }),
        ))

    // you can add additional tests if needed
})
