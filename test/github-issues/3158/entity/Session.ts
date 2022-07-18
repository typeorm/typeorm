import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
} from "typeorm"
import { SessionSettings } from "./SessionSettings"

@Entity({
    name: "Sessions",
})
export class Session {
    @PrimaryGeneratedColumn()
    id?: number

    @Column()
    title: string

    @Column({
        nullable: true,
    })
    description?: string

    @OneToOne(
        (type) => SessionSettings,
        (sessionSettings) => sessionSettings.session,
    )
    settings: SessionSettings
}
