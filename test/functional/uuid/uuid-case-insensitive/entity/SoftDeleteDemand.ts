import {
    Entity,
    PrimaryColumn,
    Column,
    DeleteDateColumn,
} from "../../../../../src"

@Entity()
export class SoftDeleteDemand {
    @PrimaryColumn("uuid")
    id: string

    @Column()
    name: string

    @DeleteDateColumn()
    deletedAt?: Date
}
