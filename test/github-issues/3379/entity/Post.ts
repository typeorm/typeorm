import { Index, PrimaryGeneratedColumn } from "typeorm"
import { Column } from "typeorm"
import { Entity } from "typeorm"

@Index("name_index", ["name"])
@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}
