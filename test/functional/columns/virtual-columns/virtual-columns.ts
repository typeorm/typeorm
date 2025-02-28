import { expect } from "chai"
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
        Promise.all(
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
                expect(query1).to.eq(expectedQuery)
            }),
        ))

    it("should generate expected sub-select & nested-subselect statement", () =>
        Promise.all(
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
            }),
        ))

    it("should not generate sub-select if column is not selected", () =>
        Promise.all(
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
                expect(query).to.eq(expectedQuery)
            }),
        ))

    it("should be able to save and find sub-select data in the database", () =>
        Promise.all(
            connections.map(async (connection) => {
                const activityRepository = connection.getRepository(Activity)
                const companyRepository = connection.getRepository(Company)
                const employeeRepository = connection.getRepository(Employee)
                const timesheetRepository = connection.getRepository(TimeSheet)

                const companyName = "My Company 1"
                const company = companyRepository.create({ name: companyName })
                await companyRepository.save(company)

                const employee1 = employeeRepository.create({
                    name: "Collin 1",
                    company: company,
                })
                const employee2 = employeeRepository.create({
                    name: "John 1",
                    company: company,
                })
                const employee3 = employeeRepository.create({
                    name: "Cory 1",
                    company: company,
                })
                const employee4 = employeeRepository.create({
                    name: "Kevin 1",
                    company: company,
                })
                await employeeRepository.save([
                    employee1,
                    employee2,
                    employee3,
                    employee4,
                ])

                const employee1TimeSheet = timesheetRepository.create({
                    employee: employee1,
                })
                await timesheetRepository.save(employee1TimeSheet)

                const employee1Activities = activityRepository.create([
                    {
                        hours: 2,
                        timesheet: employee1TimeSheet,
                    },
                    {
                        hours: 2,
                        timesheet: employee1TimeSheet,
                    },
                    {
                        hours: 2,
                        timesheet: employee1TimeSheet,
                    },
                ])
                await activityRepository.save(employee1Activities)

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

                const usersUnderCompany = await companyRepository.findOne(
                    findOneOptions,
                )
                expect(usersUnderCompany?.totalEmployeesCount).to.eq(4)
                const employee1TimesheetFound = usersUnderCompany?.employees
                    .find((e) => e.name === employee1.name)
                    ?.timesheets.find((ts) => ts.id === employee1TimeSheet.id)
                expect(employee1TimesheetFound?.totalActivityHours).to.eq(6)

                const usersUnderCompanyList = await companyRepository.find(
                    findOneOptions,
                )
                const usersUnderCompanyListOne = usersUnderCompanyList[0]
                expect(usersUnderCompanyListOne?.totalEmployeesCount).to.eq(4)
                const employee1TimesheetListOneFound =
                    usersUnderCompanyListOne?.employees
                        .find((e) => e.name === employee1.name)
                        ?.timesheets.find(
                            (ts) => ts.id === employee1TimeSheet.id,
                        )
                expect(
                    employee1TimesheetListOneFound?.totalActivityHours,
                ).to.eq(6)
            }),
        ))

    it("should be able to save and find sub-select data in the database (with query builder)", () =>
        Promise.all(
            connections.map(async (connection) => {
                const activityRepository = connection.getRepository(Activity)
                const companyRepository = connection.getRepository(Company)
                const employeeRepository = connection.getRepository(Employee)
                const timesheetRepository = connection.getRepository(TimeSheet)

                const companyName = "My Company 2"
                const company = companyRepository.create({ name: companyName })
                await companyRepository.save(company)

                const employee1 = employeeRepository.create({
                    name: "Collin 2",
                    company: company,
                })
                const employee2 = employeeRepository.create({
                    name: "John 2",
                    company: company,
                })
                const employee3 = employeeRepository.create({
                    name: "Cory 2",
                    company: company,
                })
                await employeeRepository.save([employee1, employee2, employee3])

                const employee1TimeSheet = timesheetRepository.create({
                    employee: employee1,
                })
                await timesheetRepository.save(employee1TimeSheet)
                const employee1Activities = activityRepository.create([
                    {
                        hours: 2,
                        timesheet: employee1TimeSheet,
                    },
                    {
                        hours: 2,
                        timesheet: employee1TimeSheet,
                    },
                    {
                        hours: 2,
                        timesheet: employee1TimeSheet,
                    },
                ])
                await activityRepository.save(employee1Activities)

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

                const foundEmployee = companyQueryData?.employees.find(
                    (e) => e.name === employee1.name,
                )
                const foundEmployeeTimeSheet = foundEmployee?.timesheets.find(
                    (t) => t.id === employee1TimeSheet.id,
                )

                expect(foundEmployeeTimeSheet?.totalActivityHours).to.eq(6)
            }),
        ))
})
