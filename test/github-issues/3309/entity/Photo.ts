import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "../../../../src";
import {Member} from "./Member";

@Entity("photo")
export class Photo {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    type: string;

    @ManyToOne(_ => Member, member => member.photos)
    member: Member;

}
