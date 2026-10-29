import {
    Entity,
    PrimaryColumn,
    DeleteDateColumn,
    VersionColumn,
} from "../../../../../src"

export const normalizeId = {
    to: (value: string) => value.toLowerCase(),
    from: (value: string) => value,
}

@Entity()
export class NormalizedRecord {
    @PrimaryColumn({ type: "text", transformer: normalizeId })
    id: string

    @VersionColumn()
    version: number

    @DeleteDateColumn()
    deletedAt: Date | null
}
