import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm"
import { Author } from "./Author"

@Entity()
export class Photo {
    @PrimaryColumn()
    id: number

    @Column()
    filename: string

    @Column()
    description: string

    @ManyToOne(() => Author, (author) => author.photos)
    author: Author
}
