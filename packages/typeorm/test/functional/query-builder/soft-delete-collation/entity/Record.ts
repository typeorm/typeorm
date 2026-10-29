import {
    Entity,
    PrimaryColumn,
    DeleteDateColumn,
    VersionColumn,
} from "../../../../../src"

@Entity("TYPEORM_RETURNED_ROWS")
export class Record {
    @PrimaryColumn({ type: String, length: 30, name: "__TYPEORM_ENTITY_INDEX" })
    id: string

    @VersionColumn()
    version: number

    @DeleteDateColumn()
    deletedAt: Date | null
}
