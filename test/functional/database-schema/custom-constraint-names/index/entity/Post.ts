import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm"

@Entity()
@Index("IDX_NAME", ["name"])
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Index("IDX_HEADER")
    @Column()
    header: string
}
