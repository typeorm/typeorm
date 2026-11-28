import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    PrimaryColumn,
    UpdateDateColumn,
} from "../../../../../src"

let tick = 0

export function nextTimestamp(): string {
    tick++
    return new Date(Date.UTC(2020, 0, 1, 0, 0, tick)).toISOString()
}

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @Column()
    title: string

    @CreateDateColumn({ type: "varchar", length: 28, value: nextTimestamp })
    createdAt: string

    @UpdateDateColumn({ type: "varchar", length: 28, value: nextTimestamp })
    updatedAt: string

    @DeleteDateColumn({ nullable: true })
    deletedAt: Date | null
}
