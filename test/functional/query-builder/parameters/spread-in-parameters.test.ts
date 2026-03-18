import "reflect-metadata"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Person } from "./entity/Person"

describe("query builder > parameters > spread IN parameters", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [Person],
            schemaCreate: true,
            dropSchema: true,
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    it("should handle WHERE IN with spread parameter syntax", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const personRepository = dataSource.getRepository(Person)

                for (let i = 0; i < 10; i++) {
                    await personRepository.save({
                        firstName: `first-${i}`,
                        lastName: `last-${i}`,
                    })
                }

                const byIds = await dataSource.manager
                    .createQueryBuilder(Person, "person")
                    .where("person.id IN (:...ids)", { ids: [1, 2, 3] })
                    .getMany()

                byIds.length.should.be.equal(3)

                const byNames = await dataSource.manager
                    .createQueryBuilder(Person, "person")
                    .where("person.lastName = :lastName", {
                        lastName: "last-1",
                    })
                    .andWhere("person.firstName IN (:...firstNames)", {
                        firstNames: ["first-1", "first-2", "first-3"],
                    })
                    .getMany()

                byNames.length.should.be.equal(1)
            }),
        ))
})
