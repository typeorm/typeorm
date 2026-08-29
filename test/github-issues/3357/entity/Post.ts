import { Entity, PrimaryGeneratedColumn, Column } from "../../../../src"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "varchar", length: 255 })
    title: string

    @Column({ type: "int" })
    count: number
}
