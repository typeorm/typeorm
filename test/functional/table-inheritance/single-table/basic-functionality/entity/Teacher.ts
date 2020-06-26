import { ChildEntity, Column } from "@typeorm/core";
import { Employee } from "./Employee";

@ChildEntity()
export class Teacher extends Employee {

    @Column()
    specialization: string;

}
