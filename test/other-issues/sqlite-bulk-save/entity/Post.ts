import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @Column()
    title: string

    constructor(id?: number, title?: string) {
        if (id) this.id = id
        if (title) this.title = title
    }
}
