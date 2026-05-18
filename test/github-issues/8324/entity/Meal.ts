import {Food} from "./Food";
import {Column} from "../../../../src";

export class Meal {

    @Column()
    mealId: string;

    @Column(type => Food)
    foods: Array<Food>;
}
