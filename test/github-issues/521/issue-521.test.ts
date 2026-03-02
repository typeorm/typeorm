import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src/data-source/DataSource"
import { Car } from "./entity/Car"

describe("github issues > #521 Attributes in UPDATE in QB arent getting replaced", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should replace parameters", () => {
        dataSources.forEach((connection) => {
            const qb = connection.getRepository(Car).createQueryBuilder("car")
            const [query, parameters] = qb
                .update({
                    name: "Honda",
                })
                .where("name = :name", {
                    name: "Toyota",
                })
                .getQueryAndParameters()
            query.should.not.be.undefined
            query.should.not.be.eql("")
            return parameters.length.should.eql(2)
        })
    })
})
