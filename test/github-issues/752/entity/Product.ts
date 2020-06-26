import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Product {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    productVersionId: number;

}
