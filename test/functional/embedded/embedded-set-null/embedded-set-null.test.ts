import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Employee } from "./entity/Employee"
import { Salary } from "./entity/Salary"

describe("embedded > set embedded to null", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should set all embedded columns to null when embedded is set to null", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const employeeRepository =
                    dataSource.getRepository(Employee)

                // create and save employee with salary
                const salary = new Salary()
                salary.amount = 120
                const employee = new Employee()
                employee.name = "John"
                employee.salary = salary
                await employeeRepository.save(employee)

                // verify salary was saved
                const loadedEmployee = await employeeRepository.findOneBy({
                    id: employee.id,
                })
                expect(loadedEmployee).to.be.not.null
                expect(loadedEmployee!.salary).to.be.not.null
                expect(loadedEmployee!.salary!.amount).to.be.equal("120")

                // set salary to null and save
                employee.salary = null
                await employeeRepository.save(employee)

                // verify salary columns are now null
                const updatedEmployee = await employeeRepository.findOneBy({
                    id: employee.id,
                })
                expect(updatedEmployee).to.be.not.null
                expect(updatedEmployee!.salary!.amount).to.be.null
            }),
        ))

    it("should not throw when inserting entity with null embedded", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const employeeRepository =
                    dataSource.getRepository(Employee)

                const employee = new Employee()
                employee.name = "Jane"
                employee.salary = null

                // should not throw
                await employeeRepository.save(employee)

                const loadedEmployee = await employeeRepository.findOneBy({
                    id: employee.id,
                })
                expect(loadedEmployee).to.be.not.null
                expect(loadedEmployee!.salary!.amount).to.be.null
            }),
        ))
})
