import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { Car } from "./entity/Car"

describe("github issues > #521 Attributes in UPDATE in QB arent getting replaced", () => {
    let connections: DataSource[]
    beforeAll(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    afterAll(() => closeTestingConnections(connections))

    it("should replace parameters", () => {
        connections.forEach((connection) => {
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
