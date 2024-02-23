import { expect } from "chai"
import "reflect-metadata"
import { DataSource, FindManyOptions, FindOptionsUtils } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import Company from "./entity/Company"
import Employee from "./entity/Employee"

describe("github issues > #10734 Pass context into @VirtualColumn query", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                enabledDrivers: ["postgres"],
                schemaCreate: true,
                dropSchema: true,
                entities: [Company, Employee],
            })),
    )
    after(() => closeTestingConnections(connections))

    it("should generate expected sub-select & select statement", () =>
        Promise.all(
            connections.map((connection) => {
                const metadata = connection.getMetadata(Company)
                const options1: FindManyOptions<Company> = {
                    select: {
                        name: true,
                        totalEmployeesCount: true,
                    },
                }

                const queryBuilder = connection
                    .createQueryBuilder(
                        Company,
                        FindOptionsUtils.extractFindManyOptionsAlias(
                            options1,
                        ) || metadata.name,
                    )
                    .setFindOptions(options1 || {})
                queryBuilder.context = { minimumAge: 30 }

                const query1 = queryBuilder.getSql()

                expect(query1).to.eq(
                    `SELECT "Company"."name" AS "Company_name", (SELECT COUNT("name") FROM "employees" WHERE "companyName" = "Company".name AND age > 30) AS "Company_totalEmployeesCount" FROM "companies" "Company"`,
                )
            }),
        ))
})
