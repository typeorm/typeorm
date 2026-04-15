import { expect } from "chai"
import dedent from "dedent"
import "reflect-metadata"
import type {
    DataSource,
    FindManyOptions,
    FindOneOptions,
} from "../../../../src"
import { MoreThan } from "../../../../src"
import { DriverUtils } from "../../../../src/driver/DriverUtils"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"
import { Activity } from "./entity/Activity"
import { Company } from "./entity/Company"
import { Employee } from "./entity/Employee"
import { TimeSheet } from "./entity/TimeSheet"
import { User } from "./entity/User"

describe("column > virtual columns", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            schemaCreate: true,
            dropSchema: true,
            entities: [Company, Employee, TimeSheet, Activity],
        })

        for (const dataSource of dataSources) {
            // By default, MySQL uses backticks instead of quotes for identifiers
            if (DriverUtils.isMySQLFamily(dataSource.driver)) {
                const totalEmployeesCountMetadata = dataSource
                    .getMetadata(Company)
                    .columns.find(
                        (columnMetadata) =>
                            columnMetadata.propertyName ===
                            "totalEmployeesCount",
                    )!
                totalEmployeesCountMetadata.query = (alias) =>
                    `SELECT COUNT(\`name\`) FROM \`employees\` WHERE \`companyName\` = ${alias}.\`name\``

                const totalReportedHoursMetadata = dataSource
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

                const totalActivityHoursMetadata = dataSource
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
    after(() => closeTestingConnections(dataSources))

    it("should generate expected sub-select & select statement", () =>
        dataSources.map((dataSource) => {
            const options1: FindManyOptions<Company> = {
                select: {
                    name: true,
                    totalEmployeesCount: true,
                },
            }

            const query1 = dataSource
                .createQueryBuilder(Company, "Company")
                .setFindOptions(options1)
                .getSql()

            let expectedQuery = `SELECT "Company"."name" AS "Company_name", (SELECT COUNT("name") FROM "employees" WHERE "companyName" = "Company"."name") AS "Company_totalEmployeesCount" FROM "companies" "Company"`
            if (DriverUtils.isMySQLFamily(dataSource.driver)) {
                expectedQuery = expectedQuery.replaceAll('"', "`")
            }
            expect(query1).to.equal(expectedQuery)
        }))

    it("should generate expected sub-select & nested-subselect statement", () =>
        dataSources.map((dataSource) => {
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

            const query = dataSource
                .createQueryBuilder(Company, "Company")
                .setFindOptions(findOptions)
                .getSql()

            let expectedQuery1 = `SELECT "Company"."name" AS "Company_name"`
            let expectedQuery2 = `(SELECT COUNT("name") FROM "employees" WHERE "companyName" = "Company"."name") AS "Company_totalEmployeesCount", (SELECT SUM("hours") FROM "activities" WHERE "timesheetId" =`
            if (DriverUtils.isMySQLFamily(dataSource.driver)) {
                expectedQuery1 = expectedQuery1.replaceAll('"', "`")
                expectedQuery2 = expectedQuery2.replaceAll('"', "`")
            }
            expect(query).to.include(expectedQuery1)
            expect(query).to.include(expectedQuery2)
        }))

    it("should not generate sub-select if column is not selected", () =>
        dataSources.map((dataSource) => {
            const options: FindManyOptions<Company> = {
                select: {
                    name: true,
                    totalEmployeesCount: false,
                },
            }
            const query = dataSource
                .createQueryBuilder(Company, "Company")
                .setFindOptions(options)
                .getSql()

            let expectedQuery = `SELECT "Company"."name" AS "Company_name" FROM "companies" "Company"`
            if (DriverUtils.isMySQLFamily(dataSource.driver)) {
                expectedQuery = expectedQuery.replaceAll('"', "`")
            }
            expect(query).to.equal(expectedQuery)
        }))

    it("should be able to save and find sub-select data in the database", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const companyRepository = dataSource.getRepository(Company)

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
                    await companyRepository.findOneOrFail(findOneOptions)
                expect(foundCompany.totalEmployeesCount).to.equal(4)

                let [foundTimesheet] = foundCompany.employees.find(
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
            dataSources.map(async (dataSource) => {
                const companyRepository = dataSource.getRepository(Company)

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

                const companyQueryData = await dataSource
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
                    .getOneOrFail()

                const foundEmployee = companyQueryData.employees.find(
                    (e) => e.name === company.employees[0].name,
                )!
                const [foundEmployeeTimeSheet] = foundEmployee.timesheets
                expect(foundEmployeeTimeSheet.totalActivityHours).to.equal(9)
            }),
        ))

    it("should be able to read non-selectable virtual columns (with query builder)", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const companyRepository = dataSource.getRepository(Company)

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

                const foundCompany = await dataSource
                    .createQueryBuilder(Company, "company")
                    .where("company.name = :name", { name: companyName })
                    .getOne()
                expect(foundCompany).not.to.haveOwnProperty(
                    "totalReportedHours",
                )

                const foundCompanyWithHours = await dataSource
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

describe("column > virtual columns > WHERE and ORDER BY expression expansion", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            schemaCreate: true,
            dropSchema: true,
            entities: [User],
        })

        for (const dataSource of dataSources) {
            // MySQL uses backticks instead of double-quotes for identifiers
            if (DriverUtils.isMySQLFamily(dataSource.driver)) {
                const fullNameMetadata = dataSource
                    .getMetadata(User)
                    .columns.find((col) => col.propertyName === "fullName")!
                fullNameMetadata.query = (alias) =>
                    `CONCAT(${alias}.\`firstName\`, ' ', ${alias}.\`lastName\`)`
            }
        }
    })
    after(() => closeTestingConnections(dataSources))

    it("should expand VirtualColumn expression in WHERE clause (issue #11616)", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const userRepository = dataSource.getRepository(User)

                await userRepository.save(
                    userRepository.create({
                        firstName: "John",
                        lastName: "Doe",
                    }),
                )
                await userRepository.save(
                    userRepository.create({
                        firstName: "Jane",
                        lastName: "Smith",
                    }),
                )

                // findOne with WHERE on a VirtualColumn must not throw and must return the correct row
                const found = await userRepository.findOne({
                    where: { fullName: "John Doe" },
                })

                expect(found).to.not.be.null
                expect(found!.firstName).to.equal("John")
                expect(found!.lastName).to.equal("Doe")
            }),
        ))

    it("should expand VirtualColumn expression in ORDER BY clause", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const userRepository = dataSource.getRepository(User)

                // Seed rows independently so this test does not depend on execution order
                await userRepository.save([
                    userRepository.create({ firstName: "Zara", lastName: "Allen" }),
                    userRepository.create({ firstName: "Alice", lastName: "Brown" }),
                    userRepository.create({ firstName: "Mike", lastName: "Chen" }),
                ])

                // ORDER BY on a VirtualColumn must use the expression, not the non-existent column alias
                const users = await userRepository.find({
                    select: { firstName: true, lastName: true, fullName: true },
                    order: { fullName: "ASC" },
                })

                expect(users.length).to.be.greaterThan(0)
                // Verify the results are sorted by fullName (expression) ascending
                const fullNames = users
                    .map((u) => u.fullName)
                    .filter((n): n is string => n !== undefined)
                expect(fullNames).to.deep.equal([...fullNames].sort())
            }),
        ))

    it("should generate correct SQL with VirtualColumn expression in WHERE", () =>
        dataSources.map((dataSource) => {
            const qb = dataSource
                .createQueryBuilder(User, "User")
                .setFindOptions({
                    where: { fullName: "John Doe" },
                })

            const sql = qb.getSql()

            // The WHERE clause must inline the virtual column expression,
            // not reference the non-existent column alias.
            if (DriverUtils.isMySQLFamily(dataSource.driver)) {
                expect(sql).to.include("CONCAT(")
                expect(sql).to.not.include("`User`.`fullName`")
            } else {
                // PostgreSQL / SQLite: default expression uses || concatenation
                expect(sql).to.include("firstName")
                expect(sql).to.not.include('"User"."fullName"')
            }
        }))
})
