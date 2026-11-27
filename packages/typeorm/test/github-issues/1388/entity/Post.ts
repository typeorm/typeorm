import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "timestamp", nullable: true })
    createdAt: Date
}
