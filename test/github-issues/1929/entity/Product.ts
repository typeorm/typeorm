import { Column, Entity, ObjectIdColumn } from "@typeorm/core";
import { ObjectID } from "mongodb";

@Entity()
export class Product {


    @ObjectIdColumn()
    id: ObjectID;
    @Column()
    name: string;
    @Column()
    label: string;
    @Column()
    price: number;

    constructor(name: string, label: string, price: number) {
        this.name = name;
        this.label = label;
        this.price = price;
    }

}
