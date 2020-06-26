import { Column, Entity, PrimaryColumn } from "@typeorm/core";

@Entity()
export class User {
    @PrimaryColumn()
    name: string;

    @PrimaryColumn()
    email: string;

    @Column()
    age: number;
}
