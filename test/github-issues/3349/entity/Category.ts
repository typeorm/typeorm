import { Column, Entity, PrimaryColumn } from "@typeorm/core";

@Entity()
export class Category {
    @PrimaryColumn()
    public id!: number;

    @Column()
    public myField!: number;
}
