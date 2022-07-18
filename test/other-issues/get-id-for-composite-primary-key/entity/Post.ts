import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Post {
    @PrimaryGeneratedColumn("increment")
    id!: number

    @Column()
    content!: string
}
