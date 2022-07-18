import { Entity, PrimaryGeneratedColumn } from "typeorm"
import { Column } from "typeorm/decorator/columns/Column"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column("int", { array: true, nullable: true })
    skill_id_array: number[]
}
