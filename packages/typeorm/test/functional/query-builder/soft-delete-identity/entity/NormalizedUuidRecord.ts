import {
    Entity,
    PrimaryColumn,
    DeleteDateColumn,
    VersionColumn,
} from "../../../../../src"
import { normalizeId } from "./NormalizedRecord"

@Entity()
export class NormalizedUuidRecord {
    @PrimaryColumn({ type: "uuid", transformer: normalizeId })
    id: string

    @VersionColumn()
    version: number

    @DeleteDateColumn()
    deletedAt: Date | null
}
