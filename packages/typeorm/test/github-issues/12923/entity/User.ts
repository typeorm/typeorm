import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    VersionColumn,
} from "../../../../src"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "varchar", unique: true })
    externalId: string

    @Column({ type: "varchar" })
    name: string

    @VersionColumn()
    version: number
}
