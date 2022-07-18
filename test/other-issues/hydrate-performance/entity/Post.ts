import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    constructor(title?: string) {
        if (title) this.title = title
    }
}
