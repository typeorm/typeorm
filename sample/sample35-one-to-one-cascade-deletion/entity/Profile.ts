import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from "../../../src/index";
import { User } from "./User";

@Entity()
export class Profile {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    gender: string;

    @Column()
    photo: string;

    @OneToOne(type => User, user => user.profile, { onDelete: "CASCADE" })
    user: User;
}
