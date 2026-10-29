import {
    Entity,
    PrimaryColumn,
    DeleteDateColumn,
    VersionColumn,
} from "../../../../../src"

@Entity()
export class CaseInsensitiveRecord {
    @PrimaryColumn({ type: "citext", name: "__typeorm_entity_index" })
    id: string

    @VersionColumn()
    version: number

    @DeleteDateColumn()
    deletedAt: Date | null
}
