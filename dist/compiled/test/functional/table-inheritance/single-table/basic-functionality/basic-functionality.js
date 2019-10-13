"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../../utils/test-utils");
var Student_1 = require("./entity/Student");
var Teacher_1 = require("./entity/Teacher");
var Accountant_1 = require("./entity/Accountant");
var Employee_1 = require("./entity/Employee");
var Person_1 = require("./entity/Person");
var chai_1 = require("chai");
describe("table-inheritance > single-table > basic-functionality", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should correctly insert, update and delete data with single-table-inheritance pattern", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var student1, student2, teacher1, teacher2, accountant1, accountant2, loadedStudents, loadedTeachers, loadedAccountants, loadedStudent, loadedTeacher, loadedAccountant, loadedEmployees, loadedPersons;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    student1 = new Student_1.Student();
                    student1.name = "Alice";
                    student1.faculty = "Economics";
                    return [4 /*yield*/, connection.getRepository(Student_1.Student).save(student1)];
                case 1:
                    _a.sent();
                    student2 = new Student_1.Student();
                    student2.name = "Bob";
                    student2.faculty = "Programming";
                    return [4 /*yield*/, connection.getRepository(Student_1.Student).save(student2)];
                case 2:
                    _a.sent();
                    teacher1 = new Teacher_1.Teacher();
                    teacher1.name = "Mr. Garrison";
                    teacher1.specialization = "Geography";
                    teacher1.salary = 2000;
                    return [4 /*yield*/, connection.getRepository(Teacher_1.Teacher).save(teacher1)];
                case 3:
                    _a.sent();
                    teacher2 = new Teacher_1.Teacher();
                    teacher2.name = "Mr. Adler";
                    teacher2.specialization = "Mathematics";
                    teacher2.salary = 4000;
                    return [4 /*yield*/, connection.getRepository(Teacher_1.Teacher).save(teacher2)];
                case 4:
                    _a.sent();
                    accountant1 = new Accountant_1.Accountant();
                    accountant1.name = "Mr. Burns";
                    accountant1.department = "Bookkeeping";
                    accountant1.salary = 3000;
                    return [4 /*yield*/, connection.getRepository(Accountant_1.Accountant).save(accountant1)];
                case 5:
                    _a.sent();
                    accountant2 = new Accountant_1.Accountant();
                    accountant2.name = "Mr. Trump";
                    accountant2.department = "Director";
                    accountant2.salary = 5000;
                    return [4 /*yield*/, connection.getRepository(Accountant_1.Accountant).save(accountant2)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Student_1.Student, "students")
                            .orderBy("students.id")
                            .getMany()];
                case 7:
                    loadedStudents = _a.sent();
                    loadedStudents[0].should.have.all.keys("id", "name", "faculty");
                    loadedStudents[0].id.should.equal(1);
                    loadedStudents[0].name.should.equal("Alice");
                    loadedStudents[0].faculty.should.equal("Economics");
                    loadedStudents[1].should.have.all.keys("id", "name", "faculty");
                    loadedStudents[1].id.should.equal(2);
                    loadedStudents[1].name.should.equal("Bob");
                    loadedStudents[1].faculty.should.equal("Programming");
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Teacher_1.Teacher, "teachers")
                            .orderBy("teachers.id")
                            .getMany()];
                case 8:
                    loadedTeachers = _a.sent();
                    loadedTeachers[0].should.have.all.keys("id", "name", "specialization", "salary");
                    loadedTeachers[0].id.should.equal(3);
                    loadedTeachers[0].name.should.equal("Mr. Garrison");
                    loadedTeachers[0].specialization.should.equal("Geography");
                    loadedTeachers[0].salary.should.equal(2000);
                    loadedTeachers[1].should.have.all.keys("id", "name", "specialization", "salary");
                    loadedTeachers[1].id.should.equal(4);
                    loadedTeachers[1].name.should.equal("Mr. Adler");
                    loadedTeachers[1].specialization.should.equal("Mathematics");
                    loadedTeachers[1].salary.should.equal(4000);
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Accountant_1.Accountant, "accountants")
                            .orderBy("accountants.id")
                            .getMany()];
                case 9:
                    loadedAccountants = _a.sent();
                    loadedAccountants[0].should.have.all.keys("id", "name", "department", "salary");
                    loadedAccountants[0].id.should.equal(5);
                    loadedAccountants[0].name.should.equal("Mr. Burns");
                    loadedAccountants[0].department.should.equal("Bookkeeping");
                    loadedAccountants[0].salary.should.equal(3000);
                    loadedAccountants[1].should.have.all.keys("id", "name", "department", "salary");
                    loadedAccountants[1].id.should.equal(6);
                    loadedAccountants[1].name.should.equal("Mr. Trump");
                    loadedAccountants[1].department.should.equal("Director");
                    loadedAccountants[1].salary.should.equal(5000);
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Student_1.Student, "student")
                            .where("student.name = :name", { name: "Bob" })
                            .getOne()];
                case 10:
                    loadedStudent = _a.sent();
                    loadedStudent.faculty = "Chemistry";
                    return [4 /*yield*/, connection.getRepository(Student_1.Student).save(loadedStudent)];
                case 11:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Student_1.Student, "student")
                            .where("student.name = :name", { name: "Bob" })
                            .getOne()];
                case 12:
                    loadedStudent = _a.sent();
                    loadedStudent.should.have.all.keys("id", "name", "faculty");
                    loadedStudent.id.should.equal(2);
                    loadedStudent.name.should.equal("Bob");
                    loadedStudent.faculty.should.equal("Chemistry");
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Teacher_1.Teacher, "teacher")
                            .where("teacher.name = :name", { name: "Mr. Adler" })
                            .getOne()];
                case 13:
                    loadedTeacher = _a.sent();
                    loadedTeacher.salary = 1000;
                    return [4 /*yield*/, connection.getRepository(Teacher_1.Teacher).save(loadedTeacher)];
                case 14:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Teacher_1.Teacher, "teacher")
                            .where("teacher.name = :name", { name: "Mr. Adler" })
                            .getOne()];
                case 15:
                    loadedTeacher = _a.sent();
                    loadedTeacher.should.have.all.keys("id", "name", "specialization", "salary");
                    loadedTeacher.id.should.equal(4);
                    loadedTeacher.name.should.equal("Mr. Adler");
                    loadedTeacher.specialization.should.equal("Mathematics");
                    loadedTeacher.salary.should.equal(1000);
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Accountant_1.Accountant, "accountant")
                            .where("accountant.name = :name", { name: "Mr. Trump" })
                            .getOne()];
                case 16:
                    loadedAccountant = _a.sent();
                    loadedAccountant.salary = 1000;
                    return [4 /*yield*/, connection.getRepository(Accountant_1.Accountant).save(loadedAccountant)];
                case 17:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Accountant_1.Accountant, "accountant")
                            .where("accountant.name = :name", { name: "Mr. Trump" })
                            .getOne()];
                case 18:
                    loadedAccountant = _a.sent();
                    loadedAccountant.should.have.all.keys("id", "name", "department", "salary");
                    loadedAccountant.id.should.equal(6);
                    loadedAccountant.name.should.equal("Mr. Trump");
                    loadedAccountant.department.should.equal("Director");
                    loadedAccountant.salary.should.equal(1000);
                    // -------------------------------------------------------------------------
                    // Delete
                    // -------------------------------------------------------------------------
                    return [4 /*yield*/, connection.getRepository(Student_1.Student).remove(loadedStudent)];
                case 19:
                    // -------------------------------------------------------------------------
                    // Delete
                    // -------------------------------------------------------------------------
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Student_1.Student, "students")
                            .orderBy("students.id")
                            .getMany()];
                case 20:
                    loadedStudents = _a.sent();
                    loadedStudents.length.should.equal(1);
                    loadedStudents[0].should.have.all.keys("id", "name", "faculty");
                    loadedStudents[0].id.should.equal(1);
                    loadedStudents[0].name.should.equal("Alice");
                    loadedStudents[0].faculty.should.equal("Economics");
                    return [4 /*yield*/, connection.getRepository(Teacher_1.Teacher).remove(loadedTeacher)];
                case 21:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Teacher_1.Teacher, "teachers")
                            .orderBy("teachers.id")
                            .getMany()];
                case 22:
                    loadedTeachers = _a.sent();
                    loadedTeachers.length.should.equal(1);
                    loadedTeachers[0].should.have.all.keys("id", "name", "specialization", "salary");
                    loadedTeachers[0].id.should.equal(3);
                    loadedTeachers[0].name.should.equal("Mr. Garrison");
                    loadedTeachers[0].specialization.should.equal("Geography");
                    loadedTeachers[0].salary.should.equal(2000);
                    return [4 /*yield*/, connection.getRepository(Accountant_1.Accountant).remove(loadedAccountant)];
                case 23:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Accountant_1.Accountant, "accountants")
                            .orderBy("accountants.id")
                            .getMany()];
                case 24:
                    loadedAccountants = _a.sent();
                    loadedAccountants.length.should.equal(1);
                    loadedAccountants[0].should.have.all.keys("id", "name", "department", "salary");
                    loadedAccountants[0].id.should.equal(5);
                    loadedAccountants[0].name.should.equal("Mr. Burns");
                    loadedAccountants[0].department.should.equal("Bookkeeping");
                    loadedAccountants[0].salary.should.equal(3000);
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Employee_1.Employee, "employees")
                            .orderBy("employees.id")
                            .getMany()];
                case 25:
                    loadedEmployees = _a.sent();
                    loadedEmployees[0].should.have.all.keys("id", "name", "salary", "specialization");
                    loadedEmployees[0].should.be.instanceof(Teacher_1.Teacher);
                    loadedEmployees[0].id.should.equal(3);
                    loadedEmployees[0].name.should.equal("Mr. Garrison");
                    loadedEmployees[0].specialization = "Geography";
                    loadedEmployees[0].salary.should.equal(2000);
                    loadedEmployees[1].should.have.all.keys("id", "name", "salary", "department");
                    loadedEmployees[1].should.be.instanceof(Accountant_1.Accountant);
                    loadedEmployees[1].id.should.equal(5);
                    loadedEmployees[1].name.should.equal("Mr. Burns");
                    loadedEmployees[1].department = "Bookkeeping";
                    loadedEmployees[1].salary.should.equal(3000);
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Person_1.Person, "persons")
                            .orderBy("persons.id")
                            .getMany()];
                case 26:
                    loadedPersons = _a.sent();
                    loadedPersons[0].should.have.all.keys("id", "name", "faculty");
                    loadedPersons[0].should.be.instanceof(Student_1.Student);
                    loadedPersons[0].id.should.equal(1);
                    loadedPersons[0].name.should.equal("Alice");
                    loadedPersons[0].faculty = "Economics";
                    loadedPersons[1].should.have.all.keys("id", "name", "salary", "specialization");
                    loadedPersons[1].should.be.instanceof(Teacher_1.Teacher);
                    loadedPersons[1].id.should.equal(3);
                    loadedPersons[1].name.should.equal("Mr. Garrison");
                    loadedPersons[1].specialization = "Geography";
                    loadedPersons[1].salary.should.equal(2000);
                    loadedPersons[2].should.have.all.keys("id", "name", "salary", "department");
                    loadedPersons[2].should.be.instanceof(Accountant_1.Accountant);
                    loadedPersons[2].id.should.equal(5);
                    loadedPersons[2].name.should.equal("Mr. Burns");
                    loadedPersons[2].department = "Bookkeeping";
                    loadedPersons[2].salary.should.equal(3000);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should be able to save different child entities in bulk", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var student, employee;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    student = new Student_1.Student();
                    student.name = "Alice";
                    student.faculty = "Economics";
                    employee = new Employee_1.Employee();
                    employee.name = "John";
                    employee.salary = 1000;
                    return [4 /*yield*/, connection.manager.save([student, employee])];
                case 1:
                    _a.sent();
                    student.name.should.be.eql("Alice");
                    student.faculty.should.be.eql("Economics");
                    student.should.not.haveOwnProperty("department");
                    student.should.not.haveOwnProperty("specialization");
                    student.should.not.haveOwnProperty("salary");
                    employee.name.should.be.eql("John");
                    employee.salary.should.be.eql(1000);
                    employee.should.not.haveOwnProperty("department");
                    employee.should.not.haveOwnProperty("specialization");
                    employee.should.not.haveOwnProperty("faculty");
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should be able to find correct child entities when base class is used as entity metadata", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var student, employee, loadedEmployee1, loadedEmployee2, loadedStudent1, loadedStudent2, loadedPerson1, loadedPerson2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    student = new Student_1.Student();
                    student.name = "Alice";
                    student.faculty = "Economics";
                    return [4 /*yield*/, connection.manager.save(student)];
                case 1:
                    _a.sent();
                    employee = new Employee_1.Employee();
                    employee.name = "John";
                    employee.salary = 1000;
                    return [4 /*yield*/, connection.manager.save(employee)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Employee_1.Employee, 1)];
                case 3:
                    loadedEmployee1 = _a.sent();
                    chai_1.expect(loadedEmployee1).to.be.undefined;
                    return [4 /*yield*/, connection.manager.findOne(Employee_1.Employee, 2)];
                case 4:
                    loadedEmployee2 = _a.sent();
                    loadedEmployee2.should.be.instanceof(Employee_1.Employee);
                    chai_1.expect(loadedEmployee2).not.to.be.undefined;
                    loadedEmployee2.id.should.be.eql(2);
                    loadedEmployee2.name.should.be.eql("John");
                    loadedEmployee2.salary.should.be.eql(1000);
                    loadedEmployee2.should.not.haveOwnProperty("department");
                    loadedEmployee2.should.not.haveOwnProperty("specialization");
                    loadedEmployee2.should.not.haveOwnProperty("faculty");
                    return [4 /*yield*/, connection.manager.findOne(Student_1.Student, 1)];
                case 5:
                    loadedStudent1 = _a.sent();
                    loadedStudent1.should.be.instanceof(Student_1.Student);
                    loadedStudent1.id.should.be.eql(1);
                    loadedStudent1.name.should.be.eql("Alice");
                    loadedStudent1.faculty.should.be.eql("Economics");
                    loadedStudent1.should.not.haveOwnProperty("department");
                    loadedStudent1.should.not.haveOwnProperty("specialization");
                    loadedStudent1.should.not.haveOwnProperty("salary");
                    return [4 /*yield*/, connection.manager.findOne(Student_1.Student, 2)];
                case 6:
                    loadedStudent2 = _a.sent();
                    chai_1.expect(loadedStudent2).to.be.undefined;
                    return [4 /*yield*/, connection.manager.findOne(Person_1.Person, 1)];
                case 7:
                    loadedPerson1 = _a.sent();
                    loadedPerson1.should.be.instanceof(Student_1.Student);
                    loadedPerson1.id.should.be.eql(1);
                    loadedPerson1.name.should.be.eql("Alice");
                    loadedPerson1.faculty.should.be.eql("Economics");
                    loadedPerson1.should.not.haveOwnProperty("department");
                    loadedPerson1.should.not.haveOwnProperty("specialization");
                    loadedPerson1.should.not.haveOwnProperty("salary");
                    return [4 /*yield*/, connection.manager.findOne(Person_1.Person, 2)];
                case 8:
                    loadedPerson2 = _a.sent();
                    loadedPerson2.should.be.instanceof(Employee_1.Employee);
                    loadedPerson2.id.should.be.eql(2);
                    loadedPerson2.name.should.be.eql("John");
                    loadedPerson2.salary.should.be.eql(1000);
                    loadedPerson2.should.not.haveOwnProperty("department");
                    loadedPerson2.should.not.haveOwnProperty("specialization");
                    loadedPerson2.should.not.haveOwnProperty("faculty");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=basic-functionality.js.map