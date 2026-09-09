import { Entity, PrimaryGeneratedColumn, Column } from "../../../../src"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ length: 50 })
    title: string
}
