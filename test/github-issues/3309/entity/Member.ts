import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from "../../../../src";
import {Photo} from "./Photo";

@Entity("member")
export class Member {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(_ => Photo, photo => photo.member)
    photos: Photo[];

}
