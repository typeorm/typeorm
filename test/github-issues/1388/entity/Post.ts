import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "timestamp", nullable: true })
    createdAt: Date
}
