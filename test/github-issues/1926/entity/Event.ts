import {
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from "../../../../src/index"
import { EventRole } from "./EventRole"

@Entity()
export class Event {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    title: string

    @OneToMany(() => EventRole, (role) => role.event, {
        // eager: true,
        // persistence: true,
        cascade: true,
    })
    roles: EventRole[]
}
