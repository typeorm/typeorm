import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity({
    name: "post",
})
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string
}
