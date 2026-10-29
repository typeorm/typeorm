import {
    Entity,
    PrimaryGeneratedColumn,
    DeleteDateColumn,
    VersionColumn,
} from "../../../../../src"

@Entity()
export class Record {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id: string | number

    @VersionColumn()
    version: number

    @DeleteDateColumn()
    deletedAt: Date | null
}
