import { Column, Entity, Index, PrimaryGeneratedColumn } from "../../../../src"

@Entity({
    name: "post",
})
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Index("IDX_title")
    @Column({ nullable: true })
    title: string
}
