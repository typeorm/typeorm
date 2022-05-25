import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../src"
import { Index } from "../../../../../src/decorator/Index"

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
