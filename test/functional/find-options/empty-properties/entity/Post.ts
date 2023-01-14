import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../src"

export type MyCustomType = "A" | "B" | "C"
@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    text: string

    @Column()
    type: MyCustomType
}
