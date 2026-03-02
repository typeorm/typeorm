import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../../utils/test-utils"
import { DataSource } from "../../../../../../src/data-source/DataSource"
import { Student } from "./entity/Student"
import { Employee } from "./entity/Employee"
import { Person } from "./entity/Person"
import { StudentSettings } from "./entity/StudentSettings"
import { EmployeeVerification } from "./entity/EmployeeVerification"

describe("table-inheritance > single-table > relations > eager-scoping", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should NOT eagerly load a sibling child's relations when querying a specific child type", () =>
        Promise.all(
            connections.map(async (connection) => {
                // Create a StudentSettings
                const settings = new StudentSettings()
                settings.theme = "dark"
                await connection.getRepository(StudentSettings).save(settings)

                // Create a Student with settings
                const student = new Student()
                student.name = "Alice"
                student.settings = settings
                await connection.getRepository(Student).save(student)

                // Create an EmployeeVerification
                const verification = new EmployeeVerification()
                verification.verified = true
                await connection
                    .getRepository(EmployeeVerification)
                    .save(verification)

                // Create an Employee with verification
                const employee = new Employee()
                employee.name = "Bob"
                employee.salary = 50000
                employee.verification = verification
                await connection.getRepository(Employee).save(employee)

                // When loading a Student, its eager relation (settings) should load
                const loadedStudent = await connection
                    .getRepository(Student)
                    .findOne({ where: { name: "Alice" } })

                expect(loadedStudent).to.not.be.null
                expect(loadedStudent!.name).to.equal("Alice")
                expect(loadedStudent!.settings).to.not.be.undefined
                expect(loadedStudent!.settings).to.not.be.null
                expect(loadedStudent!.settings.theme).to.equal("dark")
                // Student should NOT have 'verification' from Employee
                expect("verification" in loadedStudent!).to.equal(false)

                // When loading an Employee, its eager relation (verification) should load
                const loadedEmployee = await connection
                    .getRepository(Employee)
                    .findOne({ where: { name: "Bob" } })

                expect(loadedEmployee).to.not.be.null
                expect(loadedEmployee!.name).to.equal("Bob")
                expect(loadedEmployee!.salary).to.equal(50000)
                expect(loadedEmployee!.verification).to.not.be.undefined
                expect(loadedEmployee!.verification).to.not.be.null
                expect(loadedEmployee!.verification.verified).to.equal(true)
                // Employee should NOT have 'settings' from Student
                expect("settings" in loadedEmployee!).to.equal(false)
            }),
        ))

    it("should load ALL eager relations when querying the parent entity", () =>
        Promise.all(
            connections.map(async (connection) => {
                // Create settings and verification
                const settings = new StudentSettings()
                settings.theme = "light"
                await connection.getRepository(StudentSettings).save(settings)

                const verification = new EmployeeVerification()
                verification.verified = false
                await connection
                    .getRepository(EmployeeVerification)
                    .save(verification)

                // Create Student and Employee
                const student = new Student()
                student.name = "Carol"
                student.settings = settings
                await connection.getRepository(Student).save(student)

                const employee = new Employee()
                employee.name = "Dave"
                employee.salary = 60000
                employee.verification = verification
                await connection.getRepository(Employee).save(employee)

                // When loading via the Person (parent) repository, eager relations
                // for each child type should be loaded on the correct instances
                const loadedPersons = await connection
                    .getRepository(Person)
                    .find({ order: { name: "ASC" } })

                expect(loadedPersons).to.have.length(2)

                // Carol is a Student
                const carol = loadedPersons[0]
                expect(carol).to.be.instanceof(Student)
                expect(carol.name).to.equal("Carol")
                expect((carol as Student).settings).to.not.be.undefined
                expect((carol as Student).settings).to.not.be.null
                expect((carol as Student).settings.theme).to.equal("light")

                // Dave is an Employee
                const dave = loadedPersons[1]
                expect(dave).to.be.instanceof(Employee)
                expect(dave.name).to.equal("Dave")
                expect((dave as Employee).verification).to.not.be.undefined
                expect((dave as Employee).verification).to.not.be.null
                expect((dave as Employee).verification.verified).to.equal(false)
            }),
        ))
})
