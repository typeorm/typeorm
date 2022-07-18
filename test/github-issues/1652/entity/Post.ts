import { Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @PrimaryColumn()
    name: string
}
