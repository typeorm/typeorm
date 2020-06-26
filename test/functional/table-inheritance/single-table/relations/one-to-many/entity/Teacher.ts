import { ChildEntity, OneToMany } from "@typeorm/core";
import { Employee } from "./Employee";
import { Specialization } from "./Specialization";

@ChildEntity()
export class Teacher extends Employee {

    @OneToMany(type => Specialization, specialization => specialization.teacher)
    specializations: Specialization[];

}
