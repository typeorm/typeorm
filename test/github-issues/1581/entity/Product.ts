import {Column, Entity} from "../../../../src";

@Entity()
export class Product {

    @Column({ primary: true })
    id: number;

    @Column()
    name: string;

}
