import {Entity, ManyToOne} from "../../../../../../../src";
import {Teacher} from "./Teacher";
import {Data} from "./Data";

@Entity("data")
export class Specialization extends Data {

    @ManyToOne(() => Teacher, teacher => teacher.data)
    person: Teacher;

}
