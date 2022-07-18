import { PrimaryGeneratedColumn } from "typeorm"
import { Entity } from "typeorm"
import { JoinColumn } from "typeorm"
import { ManyToOne } from "typeorm"
import { Author } from "./Author"

@Entity()
export class Post {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @ManyToOne((type) => Author)
    @JoinColumn()
    author: Author
}
