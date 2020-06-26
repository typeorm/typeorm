import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: "decimal", precision: 10, scale: 6})
    qty: string;

}
