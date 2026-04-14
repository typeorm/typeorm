import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../../utils/test-utils"
import { DataSource } from "../../../../../../src/data-source/DataSource"
import { Person } from "./entity/Person"
import { Employee } from "./entity/Employee"
import { Teacher } from "./entity/Teacher"
import { Student } from "./entity/Student"
import { EmployeeBadge } from "./entity/EmployeeBadge"
import { TeacherCertificate } from "./entity/TeacherCertificate"
import { StudentCard } from "./entity/StudentCard"

/**
 * Tests multi-level STI eager relation scoping:
 *   Person (parent)
 *     ├── Employee (child, has eager badge)
 *     │     └── Teacher (grandchild, has eager certificate)
 *     └── Student (sibling child, has eager card)
 *
 * Covers:
 *  - #2: Teacher should inherit Employee's eager relations (ancestor chain)
 *  - #4: Querying Employee should include Teacher's eager relations (descendant rows)
 *  - Sibling isolation: Student should not get Employee/Teacher relations
 */
describe("table-inheritance > single-table > relations > eager-scoping-multi-level", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should load ancestor eager relations for grandchild (Teacher gets Employee.badge)", () =>
        Promise.all(
            connections.map(async (connection) => {
                const badge = new EmployeeBadge()
                badge.badgeNumber = "EMP-001"
                await connection.getRepository(EmployeeBadge).save(badge)

                const cert = new TeacherCertificate()
                cert.certName = "Math Level 3"
                await connection.getRepository(TeacherCertificate).save(cert)

                const teacher = new Teacher()
                teacher.name = "Ms. Smith"
                teacher.salary = 55000
                teacher.subject = "Math"
                teacher.badge = badge
                teacher.certificate = cert
                await connection.getRepository(Teacher).save(teacher)

                // Loading Teacher should get BOTH badge (from Employee ancestor)
                // AND certificate (from Teacher itself)
                const loaded = await connection
                    .getRepository(Teacher)
                    .findOne({ where: { name: "Ms. Smith" } })

                expect(loaded).to.not.be.null
                expect(loaded!.name).to.equal("Ms. Smith")
                expect(loaded!.subject).to.equal("Math")
                expect(loaded!.badge).to.not.be.undefined
                expect(loaded!.badge).to.not.be.null
                expect(loaded!.badge.badgeNumber).to.equal("EMP-001")
                expect(loaded!.certificate).to.not.be.undefined
                expect(loaded!.certificate).to.not.be.null
                expect(loaded!.certificate.certName).to.equal("Math Level 3")
            }),
        ))

    it("should load descendant eager relations when querying intermediate child (Employee query returns Teacher rows)", () =>
        Promise.all(
            connections.map(async (connection) => {
                // Create a plain Employee
                const empBadge = new EmployeeBadge()
                empBadge.badgeNumber = "EMP-002"
                await connection.getRepository(EmployeeBadge).save(empBadge)

                const employee = new Employee()
                employee.name = "Bob"
                employee.salary = 50000
                employee.badge = empBadge
                await connection.getRepository(Employee).save(employee)

                // Create a Teacher (subclass of Employee)
                const teachBadge = new EmployeeBadge()
                teachBadge.badgeNumber = "EMP-003"
                await connection.getRepository(EmployeeBadge).save(teachBadge)

                const cert = new TeacherCertificate()
                cert.certName = "Science Level 2"
                await connection.getRepository(TeacherCertificate).save(cert)

                const teacher = new Teacher()
                teacher.name = "Alice"
                teacher.salary = 60000
                teacher.subject = "Science"
                teacher.badge = teachBadge
                teacher.certificate = cert
                await connection.getRepository(Teacher).save(teacher)

                // Querying Employee repository returns both Employee and Teacher rows
                const employees = await connection
                    .getRepository(Employee)
                    .find({ order: { name: "ASC" } })

                expect(employees).to.have.length(2)

                // Alice is a Teacher — should have both badge and certificate
                const alice = employees[0]
                expect(alice).to.be.instanceof(Teacher)
                expect(alice.name).to.equal("Alice")
                expect(alice.badge).to.not.be.null
                expect(alice.badge.badgeNumber).to.equal("EMP-003")
                expect((alice as Teacher).certificate).to.not.be.null
                expect((alice as Teacher).certificate.certName).to.equal(
                    "Science Level 2",
                )

                // Bob is a plain Employee — should have badge.
                // certificate JOIN exists (for potential Teacher rows) but is null for Bob.
                const bob = employees[1]
                expect(bob.name).to.equal("Bob")
                expect(bob.badge).to.not.be.null
                expect(bob.badge.badgeNumber).to.equal("EMP-002")
            }),
        ))

    it("should NOT load sibling branch relations (Student should not get Employee/Teacher relations)", () =>
        Promise.all(
            connections.map(async (connection) => {
                const card = new StudentCard()
                card.cardNumber = "STU-001"
                await connection.getRepository(StudentCard).save(card)

                const student = new Student()
                student.name = "Carol"
                student.grade = 10
                student.card = card
                await connection.getRepository(Student).save(student)

                const badge = new EmployeeBadge()
                badge.badgeNumber = "EMP-004"
                await connection.getRepository(EmployeeBadge).save(badge)

                const employee = new Employee()
                employee.name = "Dave"
                employee.salary = 45000
                employee.badge = badge
                await connection.getRepository(Employee).save(employee)

                // Student should have card, but NOT badge or certificate
                const loadedStudent = await connection
                    .getRepository(Student)
                    .findOne({ where: { name: "Carol" } })

                expect(loadedStudent).to.not.be.null
                expect(loadedStudent!.card).to.not.be.null
                expect(loadedStudent!.card.cardNumber).to.equal("STU-001")
                expect("badge" in loadedStudent!).to.equal(false)
                expect("certificate" in loadedStudent!).to.equal(false)

                // Employee should have badge, but NOT card.
                // certificate JOIN exists (for potential Teacher descendant rows)
                // but its value is null for plain Employees.
                const loadedEmployee = await connection
                    .getRepository(Employee)
                    .findOne({ where: { name: "Dave" } })

                expect(loadedEmployee).to.not.be.null
                expect(loadedEmployee!.badge).to.not.be.null
                expect(loadedEmployee!.badge.badgeNumber).to.equal("EMP-004")
                expect("card" in loadedEmployee!).to.equal(false)
            }),
        ))

    it("should load ALL eager relations when querying parent entity", () =>
        Promise.all(
            connections.map(async (connection) => {
                const card = new StudentCard()
                card.cardNumber = "STU-002"
                await connection.getRepository(StudentCard).save(card)

                const student = new Student()
                student.name = "Eve"
                student.grade = 11
                student.card = card
                await connection.getRepository(Student).save(student)

                const badge = new EmployeeBadge()
                badge.badgeNumber = "EMP-005"
                await connection.getRepository(EmployeeBadge).save(badge)

                const cert = new TeacherCertificate()
                cert.certName = "History Level 1"
                await connection.getRepository(TeacherCertificate).save(cert)

                const teacher = new Teacher()
                teacher.name = "Frank"
                teacher.salary = 52000
                teacher.subject = "History"
                teacher.badge = badge
                teacher.certificate = cert
                await connection.getRepository(Teacher).save(teacher)

                // Querying Person returns all types
                const persons = await connection
                    .getRepository(Person)
                    .find({ order: { name: "ASC" } })

                expect(persons).to.have.length(2)

                // Eve is a Student
                const eve = persons[0]
                expect(eve).to.be.instanceof(Student)
                expect((eve as Student).card).to.not.be.null
                expect((eve as Student).card.cardNumber).to.equal("STU-002")

                // Frank is a Teacher
                const frank = persons[1]
                expect(frank).to.be.instanceof(Teacher)
                expect((frank as Teacher).badge).to.not.be.null
                expect((frank as Teacher).badge.badgeNumber).to.equal("EMP-005")
                expect((frank as Teacher).certificate).to.not.be.null
                expect((frank as Teacher).certificate.certName).to.equal(
                    "History Level 1",
                )
            }),
        ))
})
