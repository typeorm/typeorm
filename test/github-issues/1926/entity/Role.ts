import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { EventRole } from "./EventRole";

@Entity()
export class Role {

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    title: string;

    @OneToMany(type => EventRole, role => role.role)
    roles: EventRole[];

}
