import {
    Column,
    VersionColumn,
    Entity,
    PrimaryGeneratedColumn,
} from "../../../../../src"

@Entity()
export class Human {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column({ unique: true })
    email: string

    @VersionColumn()
    version: number
}
