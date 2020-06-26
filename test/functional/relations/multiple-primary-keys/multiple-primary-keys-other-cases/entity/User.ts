import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { EventMember } from "./EventMember";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => EventMember, member => member.user)
    members: EventMember[];

}
