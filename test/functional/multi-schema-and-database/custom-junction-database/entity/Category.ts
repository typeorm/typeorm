import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity({
    database: "yoman"
})
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}
