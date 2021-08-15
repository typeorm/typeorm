import { Entity, Column, PrimaryGeneratedColumn } from "../../../../src";

@Entity({
  name: "USERS"
})
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;
}
