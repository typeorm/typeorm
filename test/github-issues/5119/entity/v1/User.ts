import {
    Column,
    Entity,
    PrimaryGeneratedColumn
} from "../../../../../src/index";

@Entity({
  name: "USERS"
})
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;
}
