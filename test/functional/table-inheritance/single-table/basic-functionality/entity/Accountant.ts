import { ChildEntity, Column } from "@typeorm/core";
import { Employee } from "./Employee";

@ChildEntity()
export class Accountant extends Employee {

    @Column()
    department: string;

}
