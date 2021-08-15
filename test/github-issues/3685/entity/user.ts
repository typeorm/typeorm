import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src";

@Entity({
  name: "USERS"
})
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

}
