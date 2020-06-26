import { ChildEntity, OneToMany } from "@typeorm/core";
import { Employee } from "./Employee";
import { Department } from "./Department";

@ChildEntity()
export class Accountant extends Employee {

    @OneToMany(type => Department, department => department.accountant)
    departments: Department[];

}
