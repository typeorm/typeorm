import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity({
    schema: "yoman"
})
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}
