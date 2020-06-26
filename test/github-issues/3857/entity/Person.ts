import { Column, Entity, PrimaryGeneratedColumn, TableInheritance } from "@typeorm/core";

@Entity({schema: "custom"})
@TableInheritance({column: {type: "varchar", name: "type"}})
export abstract class Person {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("varchar")
    name: string;
}
