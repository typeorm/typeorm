import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm"

@Entity()
@Unique("UQ_NAME", ["name"])
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}
