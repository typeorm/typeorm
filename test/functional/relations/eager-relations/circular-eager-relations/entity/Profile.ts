import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { User } from "./User";

@Entity()
export class Profile {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    about: string;

    @OneToOne(type => User, user => user.profile, {eager: true})
    user: User;

}
