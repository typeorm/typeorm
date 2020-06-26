import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity("sample30_category")
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    constructor(name: string) {
        this.name = name;
    }

}
