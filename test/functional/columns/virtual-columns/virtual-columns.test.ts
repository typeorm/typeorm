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
import dedent from "dedent"
import "reflect-metadata"
import {
    DataSource,
    FindManyOptions,
    FindOneOptions,
    MoreThan,
} from "../../../../src"
import { DriverUtils } from "../../../../src/driver/DriverUtils"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"
import { Activity } from "./entity/Activity"
import { Company } from "./entity/Company"
import { Employee } from "./entity/Employee"
import { TimeSheet } from "./entity/TimeSheet"

describe("column > virtual columns", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            schemaCreate: true,
            dropSchema: true,
            entities: [Company, Employee, TimeSheet, Activity],
        })

        for (const connection of connections) {
            // By default, MySQL uses backticks instead of quotes for identifiers
            if (DriverUtils.isMySQLFamily(connection.driver)) {
                const totalEmployeesCountMetadata = connection
                    .getMetadata(Company)
                    .columns.find(
                        (columnMetadata) =>
                            columnMetadata.propertyName ===
                            "totalEmployeesCount",
                    )!
                totalEmployeesCountMetadata.query = (alias) =>
                    `SELECT COUNT(\`name\`) FROM \`employees\` WHERE \`companyName\` = ${alias}.\`name\``

                const totalReportedHoursMetadata = connection
                    .getMetadata(Company)
                    .columns.find(
                        (columnMetadata) =>
                            columnMetadata.propertyName ===
                            "totalReportedHours",
                    )!
                totalReportedHoursMetadata.query = (alias) => dedent`
                    SELECT SUM(\`activities\`.\`hours\`)
                    FROM \`activities\`
                    INNER JOIN \`timesheets\` ON \`activities\`.\`timesheetId\` = \`timesheets\`.\`id\`
                    INNER JOIN \`employees\` ON \`timesheets\`.\`employeeName\` = \`employees\`.\`name\`
                    WHERE \`employees\`.\`companyName\` = ${alias}.\`name\``

                const totalActivityHoursMetadata = connection
                    .getMetadata(TimeSheet)
                    .columns.find(
                        (columnMetadata) =>
                            columnMetadata.propertyName ===
                            "totalActivityHours",
                    )!
                totalActivityHoursMetadata.query = (alias) =>
                    `SELECT SUM(\`hours\`) FROM \`activities\` WHERE \`timesheetId\` = ${alias}.\`id\``
            }
        }
    })
    after(() => closeTestingConnections(connections))

    it("should generate expected sub-select & select statement", () =>
        connections.map((connection) => {
            const options1: FindManyOptions<Company> = {
                select: {
                    name: true,
                    totalEmployeesCount: true,
                },
            }

            const query1 = connection
                .createQueryBuilder(Company, "Company")
                .setFindOptions(options1)
                .getSql()

            let expectedQuery = `SELECT "Company"."name" AS "Company_name", (SELECT COUNT("name") FROM "employees" WHERE "companyName" = "Company"."name") AS "Company_totalEmployeesCount" FROM "companies" "Company"`
            if (DriverUtils.isMySQLFamily(connection.driver)) {
                expectedQuery = expectedQuery.replaceAll('"', "`")
            }
            expect(query1).to.equal(expectedQuery)
        }))

    it("should generate expected sub-select & nested-subselect statement", () =>
        connections.map((connection) => {
            const findOptions: FindManyOptions<Company> = {
                select: {
                    name: true,
                    totalEmployeesCount: true,
                    employees: {
                        timesheets: {
                            totalActivityHours: true,
                        },
                    },
                },
                relations: {
                    employees: {
                        timesheets: true,
                    },
                },
            }

            const query = connection
                .createQueryBuilder(Company, "Company")
                .setFindOptions(findOptions)
                .getSql()

            let expectedQuery1 = `SELECT "Company"."name" AS "Company_name"`
            let expectedQuery2 = `(SELECT COUNT("name") FROM "employees" WHERE "companyName" = "Company"."name") AS "Company_totalEmployeesCount", (SELECT SUM("hours") FROM "activities" WHERE "timesheetId" =`
            if (DriverUtils.isMySQLFamily(connection.driver)) {
                expectedQuery1 = expectedQuery1.replaceAll('"', "`")
                expectedQuery2 = expectedQuery2.replaceAll('"', "`")
            }
            expect(query).to.include(expectedQuery1)
            expect(query).to.include(expectedQuery2)
        }))

    it("should not generate sub-select if column is not selected", () =>
        connections.map((connection) => {
            const options: FindManyOptions<Company> = {
                select: {
                    name: true,
                    totalEmployeesCount: false,
                },
            }
            const query = connection
                .createQueryBuilder(Company, "Company")
                .setFindOptions(options)
                .getSql()

            let expectedQuery = `SELECT "Company"."name" AS "Company_name" FROM "companies" "Company"`
            if (DriverUtils.isMySQLFamily(connection.driver)) {
                expectedQuery = expectedQuery.replaceAll('"', "`")
            }
            expect(query).to.equal(expectedQuery)
        }))

    it("should be able to save and find sub-select data in the database", () =>
        Promise.all(
            connections.map(async (connection) => {
                const companyRepository = connection.getRepository(Company)

                const companyName = "My Company 1"
                const company = companyRepository.create({
                    name: companyName,
                    employees: [
                        {
                            name: "Collin 1",
                            timesheets: [
                                {
                                    activities: [
                                        { hours: 2 },
                                        { hours: 3 },
                                        { hours: 4 },
                                    ],
                                },
                            ],
                        },
                        { name: "John 1" },
                        { name: "Cory 1" },
                        { name: "Kevin 1" },
                    ],
                })
                await companyRepository.save(company)

                const findOneOptions: FindOneOptions<Company> = {
                    select: {
                        name: true,
                        totalEmployeesCount: true,
                        employees: {
                            name: true,
                            timesheets: {
                                id: true,
                                totalActivityHours: true,
                            },
                        },
                    },
                    relations: {
                        employees: {
                            timesheets: true,
                        },
                    },
                    where: {
                        name: companyName,
                        totalEmployeesCount: MoreThan(2),
                        employees: {
                            timesheets: {
                                totalActivityHours: MoreThan(0),
                            },
                        },
                    },
                    order: {
                        employees: {
                            timesheets: {
                                id: "DESC",
                                totalActivityHours: "ASC",
                            },
                        },
                    },
                }

                // find one
                let foundCompany =
                    await companyRepository.findOne(findOneOptions)
                expect(foundCompany!.totalEmployeesCount).to.equal(4)

                let [foundTimesheet] = foundCompany!.employees.find(
                    (e) => e.name === company.employees[0].name,
                )!.timesheets
                expect(foundTimesheet.totalActivityHours).to.equal(9)

                // find many
                const foundCompanies =
                    await companyRepository.find(findOneOptions)
                expect(foundCompanies).to.have.lengthOf(1)

                foundCompany = foundCompanies[0]
                expect(foundCompany.totalEmployeesCount).to.equal(4)
                foundTimesheet = foundCompany.employees.find(
                    (e) => e.name === company.employees[0].name,
                )!.timesheets[0]
                expect(foundTimesheet.totalActivityHours).to.equal(9)
            }),
        ))

    it("should be able to save and find sub-select data in the database (with query builder)", () =>
        Promise.all(
            connections.map(async (connection) => {
                const companyRepository = connection.getRepository(Company)

                const companyName = "My Company 2"
                const company = companyRepository.create({
                    name: companyName,
                    employees: [
                        {
                            name: "Collin 2",
                            timesheets: [
                                {
                                    activities: [
                                        { hours: 2 },
                                        { hours: 3 },
                                        { hours: 4 },
                                    ],
                                },
                            ],
                        },
                        {
                            name: "John 2",
                            timesheets: [{ activities: [{ hours: 5 }] }],
                        },
                        {
                            name: "Cory 2",
                            timesheets: [{ activities: [{ hours: 6 }] }],
                        },
                    ],
                })
                await companyRepository.save(company)

                const companyQueryData = await connection
                    .createQueryBuilder(Company, "company")
                    .select([
                        "company.name",
                        "company.totalEmployeesCount",
                        "employee.name",
                        "timesheet.id",
                        "timesheet.totalActivityHours",
                    ])
                    .leftJoin("company.employees", "employee")
                    .leftJoin("employee.timesheets", "timesheet")
                    .where("company.name = :name", { name: companyName })
                    // we won't be supporting where & order bys with VirtualColumns (you will have to make your subquery a function that gets added to the query builder)
                    //.andWhere("company.totalEmployeesCount > 2")
                    //.orderBy({
                    //    "employees.timesheets.id": "DESC",
                    //    //"employees.timesheets.totalActivityHours": "ASC",
                    //})
                    .getOne()

                const foundEmployee = companyQueryData!.employees.find(
                    (e) => e.name === company.employees[0].name,
                )!
                const [foundEmployeeTimeSheet] = foundEmployee.timesheets
                expect(foundEmployeeTimeSheet.totalActivityHours).to.equal(9)
            }),
        ))

    it("should be able to read non-selectable virtual columns (with query builder)", () =>
        Promise.all(
            connections.map(async (connection) => {
                const companyRepository = connection.getRepository(Company)

                const companyName = "My Company 3"
                const company = companyRepository.create({
                    name: companyName,
                    employees: [
                        {
                            name: "Collin 3",
                            timesheets: [
                                {
                                    activities: [
                                        { hours: 2 },
                                        { hours: 3 },
                                        { hours: 4 },
                                    ],
                                },
                            ],
                        },
                        {
                            name: "John 3",
                            timesheets: [{ activities: [{ hours: 5 }] }],
                        },
                        {
                            name: "Cory 3",
                            timesheets: [{ activities: [{ hours: 6 }] }],
                        },
                    ],
                })
                await companyRepository.save(company)

                const foundCompany = await connection
                    .createQueryBuilder(Company, "company")
                    .where("company.name = :name", { name: companyName })
                    .getOne()
                expect(foundCompany).to.haveOwnProperty(
                    "totalReportedHours",
                ).undefined

                const foundCompanyWithHours = await connection
                    .createQueryBuilder(Company, "company")
                    .addSelect("company.totalReportedHours")
                    .where("company.name = :name", { name: companyName })
                    .getOne()

                expect(foundCompanyWithHours).to.include({
                    name: companyName,
                    totalEmployeesCount: 3,
                    totalReportedHours: 20,
                })
            }),
        ))
})
