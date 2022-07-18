import {
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from "typeorm/index"
import { EventRole } from "./EventRole"

@Entity()
export class Event {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    title: string

    @OneToMany((type) => EventRole, (role) => role.event, {
        // eager: true,
        // persistence: true,
        cascade: true,
    })
    roles: EventRole[]
}
