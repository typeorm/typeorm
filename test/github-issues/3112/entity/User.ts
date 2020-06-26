import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: "varchar", length: 100, nullable: true, default: null})
    first: string;

    @Column({type: "varchar", length: 100, nullable: true, default: () => "null"})
    second: string;

}
