import {
    DeleteDateColumn,
    Entity,
    PrimaryColumn,
    VersionColumn,
} from "../../../../../src"

@Entity()
export class Record {
    @PrimaryColumn("int4")
    id: number

    @VersionColumn()
    version: number

    @DeleteDateColumn()
    deletedAt: Date | null
}
