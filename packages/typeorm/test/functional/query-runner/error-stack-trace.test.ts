import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource, Repository } from "../../../src"
import { expect } from "chai"
import { Human } from "./entity/Human"

describe("query runner > error stack trace", () => {
    let dataSources: DataSource[]

    before(async function () {
        dataSources = await createTestingConnections({
            entities: [Human],
        })
        if (!dataSources.length) this.skip()
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should include call site stack trace on query error", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                async function myNamedFunction123() {
                    const queryRunner = dataSource.createQueryRunner()
                    try {
                        await queryRunner.query(
                            "SELECT invalid_name FROM non_existent_table",
                        )
                    } finally {
                        await queryRunner.release()
                    }
                }

                await expect(myNamedFunction123())
                    .to.be.rejected.and.eventually.have.property("stack")
                    .that.include("myNamedFunction123")
            }),
        ))

    it("should include call site stack trace on entity operation error", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                async function myNamedFunction1234() {
                    const repository: Repository<Human> =
                        dataSource.getRepository(Human)

                    const human = repository.create()
                    human.id = 1
                    human.name = "Incubus"
                    await repository.insert(human)

                    const human2 = repository.create()
                    human2.id = 1 // Id collision.
                    human2.name = "Lucifer"
                    await repository.insert(human2)
                }

                await expect(myNamedFunction1234())
                    .to.be.rejected.and.eventually.have.property("stack")
                    .that.include("myNamedFunction1234")
            }),
        ))
})
