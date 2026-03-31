import { PrimaryGeneratedColumn } from "../../../../src"
import { Entity } from "../../../../src"
import { JoinColumn } from "../../../../src"
import { ManyToOne } from "../../../../src"
import { Author } from "./Author"

@Entity()
export class Post {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @ManyToOne(() => Author)
    @JoinColumn()
    author: Author
}
