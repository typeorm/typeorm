import {
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from "../../../../../src"
import { MainEntity } from "./MainEntity"

@Entity()
export class RelatedEntity {
    @PrimaryGeneratedColumn("increment")
    id: number

    @OneToMany(() => MainEntity, (m) => m.related, { lazy: true })
    mains: Promise<MainEntity[]>

    @Column("boolean", { default: false })
    status: boolean
}
