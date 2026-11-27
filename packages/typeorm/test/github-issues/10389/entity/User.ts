import {
    Column,
    DeleteDateColumn,
    Entity,
    PrimaryColumn,
    UpdateDateColumn,
    VersionColumn,
} from "../../../../src"

@Entity()
export class User {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @Column()
    company: string

    @DeleteDateColumn()
    deletedAt: Date

    @UpdateDateColumn()
    updatedAt: Date

    @VersionColumn()
    version: number
}
