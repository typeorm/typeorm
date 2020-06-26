import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Product {

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    liked: boolean;

}
