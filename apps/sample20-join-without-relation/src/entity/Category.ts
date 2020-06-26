import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity("sample20_category")
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}
