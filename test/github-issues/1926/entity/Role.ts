import { Column, Entity, PrimaryGeneratedColumn } from "typeorm/index"
import { EventRole } from "./EventRole"
import { OneToMany } from "typeorm"

@Entity()
export class Role {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    title: string

    @OneToMany((type) => EventRole, (role) => role.role)
    roles: EventRole[]
}
