import { Column, Entity, PrimaryGeneratedColumn } from "typeorm/index"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}
