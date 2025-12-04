import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"
import "reflect-metadata"
import { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Person } from "./entity/Person"
import { DriverUtils } from "../../../../src/driver/DriverUtils"

describe("query builder > parameters > reused parameters", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [Person],
                schemaCreate: true,
                dropSchema: true,
            })),
    )

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should generate a valid query", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const personRepository = dataSource.getRepository(Person)
                await personRepository.save([
                    { firstName: "Jane", lastName: "Smith" },
                    { firstName: "Johanna", lastName: "Schmidt" },
                    { firstName: "Ioana", lastName: "Fieraru" },
                    { firstName: "Giovanna", lastName: "Ferrari" },
                ])

                const sqlSubstring =
                    dataSource.driver.options.type === "oracle"
                        ? "SUBSTR"
                        : "SUBSTRING"
                const firstNameTrimmed = `${sqlSubstring}(${dataSource.driver.escape(
                    "firstName",
                )}, 1, :charCount)`
                const lastNameTrimmed = `${sqlSubstring}(${dataSource.driver.escape(
                    "lastName",
                )}, 1, :charCount)`

                const queryBuilder = personRepository
                    .createQueryBuilder()
                    .select(firstNameTrimmed, "firstName")
                    .addSelect(lastNameTrimmed, "lastName")
                    .setParameters({ charCount: 5 })

                const [query, parameters] = queryBuilder.getQueryAndParameters()

                if (DriverUtils.isPostgresFamily(dataSource.driver)) {
                    expect(query).to.equal(
                        'SELECT SUBSTRING("firstName", 1, $1) AS "firstName", SUBSTRING("lastName", 1, $1) AS "lastName" FROM "person" "Person"',
                    )
                    expect(parameters).to.have.length(1)
                } else if (DriverUtils.isMySQLFamily(dataSource.driver)) {
                    expect(query).to.equal(
                        "SELECT SUBSTRING(`firstName`, 1, ?) AS `firstName`, SUBSTRING(`lastName`, 1, ?) AS `lastName` FROM `person` `Person`",
                    )
                    expect(parameters).to.have.length(2)
                } else if (DriverUtils.isSQLiteFamily(dataSource.driver)) {
                    expect(query).to.equal(
                        'SELECT SUBSTRING("firstName", 1, 5) AS "firstName", SUBSTRING("lastName", 1, 5) AS "lastName" FROM "person" "Person"',
                    )
                    expect(parameters).to.have.length(0)
                } else if (dataSource.driver.options.type === "spanner") {
                    expect(query).to.equal(
                        'SELECT SUBSTRING("firstName", 1, @param0) AS "firstName", SUBSTRING("lastName", 1, @param0) AS "lastName" FROM "person" "Person"',
                    )
                    expect(parameters).to.have.length(1)
                } else if (dataSource.driver.options.type === "oracle") {
                    expect(query).to.equal(
                        'SELECT SUBSTR("firstName", 1, :1) AS "firstName", SUBSTR("lastName", 1, :2) AS "lastName" FROM "person" "Person"',
                    )
                    expect(parameters).to.have.length(2)
                } else if (dataSource.driver.options.type === "mssql") {
                    expect(query).to.equal(
                        'SELECT SUBSTRING("firstName", 1, @0) AS "firstName", SUBSTRING("lastName", 1, @0) AS "lastName" FROM "person" "Person"',
                    )
                    expect(parameters).to.have.length(1)
                } else {
                    // e.g.: SAP
                    expect(query).to.equal(
                        'SELECT SUBSTRING("firstName", 1, ?) AS "firstName", SUBSTRING("lastName", 1, ?) AS "lastName" FROM "person" "Person"',
                    )
                    expect(parameters).to.have.length(2)
                }

                const statistics = await queryBuilder.getRawMany<unknown>()

                expect(statistics).to.deep.equal([
                    {
                        firstName: "Jane",
                        lastName: "Smith",
                    },
                    {
                        firstName: "Johan",
                        lastName: "Schmi",
                    },
                    {
                        firstName: "Ioana",
                        lastName: "Fiera",
                    },
                    {
                        firstName: "Giova",
                        lastName: "Ferra",
                    },
                ])
            }),
        ))
})
