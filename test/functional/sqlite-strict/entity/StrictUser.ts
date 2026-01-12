import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from "../../../../src"

@Entity({ strict: true })
export class StrictUser {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    age: number

    @Column({ type: "real" })
    score: number

    @Column({ type: "blob", nullable: true })
    data: Buffer

    @Column({ type: "text", nullable: true })
    description: string

    @CreateDateColumn({ type: "any", nullable: true })
    createdAt: Date
}
