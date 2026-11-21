import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import type { OracleDriver } from "../../../../src/driver/oracle/OracleDriver"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"

// Regression for #13077.
describe("query builder > Oracle update returning", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
            enabledDrivers: ["oracle"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    for (const useBatch of [false, true]) {
        it(`preserves custom output binds without assigning them to ${useBatch ? "a batch of entities" : "a single entity"}`, () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const repository = dataSource.getRepository(Post)
                    const [first, second] = await repository.save([
                        { title: "first", version: 1 },
                        { title: "second", version: 5 },
                    ])
                    const originalDates = [first.updateDate, second.updateDate]
                    const oracle = (dataSource.driver as OracleDriver).oracle
                    const query = repository
                        .createQueryBuilder()
                        .update()
                        .set({ title: "after" })
                        .whereEntity(useBatch ? [second, first] : first)
                        .returning('"version" INTO :version')
                        .setParameter("version", {
                            type: oracle.NUMBER,
                            dir: oracle.BIND_OUT,
                        })

                    if (!useBatch) query.where({ id: second.id })
                    const result = await query.execute()

                    expect(result.raw).to.have.length(1)
                    expect(result.raw[0]).to.have.members(
                        useBatch ? [2, 6] : [6],
                    )
                    expect(result.generatedMaps).to.deep.equal([])
                    expect([first.version, second.version]).to.deep.equal([
                        1, 5,
                    ])
                    expect([first.updateDate, second.updateDate]).to.deep.equal(
                        originalDates,
                    )
                    expect(
                        (await repository.findOneByOrFail({ id: second.id }))
                            .version,
                    ).to.equal(6)
                }),
            ))
    }
})
