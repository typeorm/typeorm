import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    name2: string;

}
