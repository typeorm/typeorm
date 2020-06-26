import { Column, Entity, Index, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Index({fulltext: true})
    @Column()
    default: string;

    @Index({fulltext: true, parser: "ngram"})
    @Column()
    ngram: string;

}
