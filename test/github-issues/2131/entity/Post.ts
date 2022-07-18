import { PrimaryGeneratedColumn, Entity, Column } from "typeorm"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number | null

    @Column()
    title: string
}
