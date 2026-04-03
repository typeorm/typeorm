import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "varchar", length: 50 })
    title: string
}
