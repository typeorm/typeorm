import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"
import { Index } from "typeorm/decorator/Index"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Index({ fulltext: true })
    @Column()
    default: string

    @Index({ fulltext: true, parser: "ngram" })
    @Column()
    ngram: string
}
