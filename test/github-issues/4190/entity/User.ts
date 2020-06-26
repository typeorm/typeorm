import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { Photo } from "./Photo";
import { Profile } from "./Profile";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany("Photo", "user")
    photos: Photo[];

    @OneToOne("Profile")
    @JoinColumn()
    profile: Profile;

}
