import { Column, Entity } from "../../../../src"

@Entity({
    schema: "api",
    name: "Post",
})
export class Post {
    @Column({ primary: true })
    id: number

    @Column({ nullable: true })
    title: string
}
