import { Column, Entity } from "../../../../src"

@Entity({
    schema: "typeorm_test",
    name: "post",
})
export class Post {
    @Column({ primary: true })
    id: number

    @Column({ nullable: true })
    title: string
}
