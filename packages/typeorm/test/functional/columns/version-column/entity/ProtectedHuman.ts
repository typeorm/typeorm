import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    VersionColumn,
} from "../../../../../src"

@Entity()
export class ProtectedHuman {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column({ unique: true })
    email: string

    @VersionColumn({ update: false })
    version: number
}
