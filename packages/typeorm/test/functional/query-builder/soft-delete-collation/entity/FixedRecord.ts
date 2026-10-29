import {
    Entity,
    PrimaryColumn,
    DeleteDateColumn,
    VersionColumn,
} from "../../../../../src"

@Entity()
export class FixedRecord {
    @PrimaryColumn({ type: "char", length: 5 })
    id: string

    @VersionColumn()
    version: number

    @DeleteDateColumn()
    deletedAt: Date | null
}
