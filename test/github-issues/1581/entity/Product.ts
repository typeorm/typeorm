import { Column, Entity } from "@typeorm/core";

@Entity()
export class Product {

    @Column({primary: true})
    id: number;

    @Column()
    name: string;

}
