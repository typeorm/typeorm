import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "../../../../src"
import { ConfigurationEntity } from "./configuration"

@Entity("locations")
export class LocationEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string

    @Column({ type: "varchar", length: 255 })
    name!: string

    @Column({ type: "boolean", default: true })
    active!: boolean

    @CreateDateColumn()
    created_at!: Date

    @UpdateDateColumn()
    updated_at!: Date

    @OneToMany(
        () => ConfigurationEntity,
        (configuration) => configuration.location,
        { cascade: true },
    )
    configurations!: ConfigurationEntity[]
}
