"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var index_1 = require("../../src/index");
var Employee_1 = require("./entity/Employee");
var Homesitter_1 = require("./entity/Homesitter");
var Student_1 = require("./entity/Student");
var Person_1 = require("./entity/Person");
var options = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    logging: ["query", "error"],
    synchronize: true,
    entities: [
        Person_1.Person,
        Employee_1.Employee,
        Homesitter_1.Homesitter,
        Student_1.Student
    ]
};
index_1.createConnection(options).then(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var employeeRepository, employee, loadedEmployee, homesitterRepository, homesitter, loadedHomesitter, studentRepository, student, loadedStudent, secondEmployee, thirdEmployee, secondHomesitter, thirdHomesitter, secondStudent, thirdStudent;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                employeeRepository = connection.getRepository(Employee_1.Employee);
                employee = new Employee_1.Employee();
                employee.id = 1;
                employee.firstName = "umed";
                employee.lastName = "khudoiberdiev";
                employee.salary = 200000;
                console.log("saving the employee: ");
                return [4 /*yield*/, employeeRepository.save(employee)];
            case 1:
                _a.sent();
                console.log("employee has been saved: ", employee);
                console.log("now loading the employee: ");
                return [4 /*yield*/, employeeRepository.findOne(1)];
            case 2:
                loadedEmployee = _a.sent();
                console.log("loaded employee: ", loadedEmployee);
                console.log("-----------------");
                homesitterRepository = connection.getRepository(Homesitter_1.Homesitter);
                homesitter = new Homesitter_1.Homesitter();
                homesitter.id = 2;
                homesitter.firstName = "umed";
                homesitter.lastName = "khudoiberdiev";
                homesitter.numberOfKids = 5;
                console.log("saving the homesitter: ");
                return [4 /*yield*/, homesitterRepository.save(homesitter)];
            case 3:
                _a.sent();
                console.log("homesitter has been saved: ", homesitter);
                console.log("now loading the homesitter: ");
                return [4 /*yield*/, homesitterRepository.findOne(2)];
            case 4:
                loadedHomesitter = _a.sent();
                console.log("loaded homesitter: ", loadedHomesitter);
                console.log("-----------------");
                studentRepository = connection.getRepository(Student_1.Student);
                student = new Student_1.Student();
                student.id = 3;
                student.firstName = "umed";
                student.lastName = "khudoiberdiev";
                student.faculty = "computer science";
                console.log("saving the student: ");
                return [4 /*yield*/, studentRepository.save(student)];
            case 5:
                _a.sent();
                console.log("student has been saved: ", student);
                console.log("now loading the student: ");
                return [4 /*yield*/, studentRepository.findOne(3)];
            case 6:
                loadedStudent = _a.sent();
                console.log("loaded student: ", loadedStudent);
                console.log("-----------------");
                return [4 /*yield*/, employeeRepository.findOne(2)];
            case 7:
                secondEmployee = _a.sent();
                console.log("Non exist employee: ", secondEmployee);
                return [4 /*yield*/, employeeRepository.findOne(3)];
            case 8:
                thirdEmployee = _a.sent();
                console.log("Non exist employee: ", thirdEmployee);
                console.log("-----------------");
                return [4 /*yield*/, homesitterRepository.findOne(1)];
            case 9:
                secondHomesitter = _a.sent();
                console.log("Non exist homesitter: ", secondHomesitter);
                return [4 /*yield*/, homesitterRepository.findOne(3)];
            case 10:
                thirdHomesitter = _a.sent();
                console.log("Non exist homesitter: ", thirdHomesitter);
                console.log("-----------------");
                return [4 /*yield*/, studentRepository.findOne(1)];
            case 11:
                secondStudent = _a.sent();
                console.log("Non exist student: ", secondStudent);
                return [4 /*yield*/, studentRepository.findOne(2)];
            case 12:
                thirdStudent = _a.sent();
                console.log("Non exist student: ", thirdStudent);
                return [2 /*return*/];
        }
    });
}); }, function (error) { return console.log("Error: ", error); });
//# sourceMappingURL=app.js.map