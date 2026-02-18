import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    Unique,
} from "../../../../src"

@Entity({ strict: true })
@Unique(["firstName", "email"])
export class StrictUser {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column({ type: "varchar", length: 100, unique: true })
    email: string

    @Column({ type: "text" })
    lastName: string

    @Column()
    age: number

    @Column({ type: "int", nullable: true })
    class: number

    @Column({ type: "bigint", nullable: true })
    experience: number

    @Column({ type: "float", nullable: true })
    score: number

    @Column({ type: "double", nullable: true })
    weight: number

    @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
    height: number

    @CreateDateColumn()
    createdAt: Date

    @Column({ type: "blob", nullable: true })
    data: Buffer

    @Column({ type: "any", nullable: true })
    anyField: any
}
