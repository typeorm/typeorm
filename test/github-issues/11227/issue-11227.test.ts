import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { SomeEntity } from "./entity/SomeEntity"
import { SuperLongRelatedEntityNameDontAskWhy } from "./entity/SuperLongRelatedEntityNameDontAskWhy"

describe("github issues > #11227 RelationIdLoader is not consistently respecting maxAliasLength", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["postgres"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should fetch related entities properly", async () => {
        for (const connection of dataSources) {
            const related = await connection
                .getRepository(SuperLongRelatedEntityNameDontAskWhy)
                .save({ name: "test" })

            const entity = await connection.getRepository(SomeEntity).save({
                superLongRelatedEntityNameDontAskWhy_id: related.id,
            })

            const result = await connection.getRepository(SomeEntity).findOne({
                where: { id: entity.id },
                relations: { superLongRelatedEntityNameDontAskWhy: true },
                relationLoadStrategy: "query",
            })

            expect(result?.superLongRelatedEntityNameDontAskWhy?.name).to.eq(
                "test",
            )
        }
    })
})
