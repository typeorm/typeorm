import {Column, Entity, ObjectID, ObjectIdColumn} from "../../../../src";
import {Meal} from "./Meal";

@Entity("days")
export class Day {

    @ObjectIdColumn()
    _id: ObjectID;

    @Column(type => Meal)
    meals: Array<Meal>;
}
