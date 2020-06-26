import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { Profile } from "./Profile";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToOne(type => Profile, profile => profile.user, {cascade: ["insert"]})
    profile: Profile;

}
