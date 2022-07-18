import { Column, Entity, PrimaryGeneratedColumn } from "typeorm/index"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    postId: number

    @Column()
    modelId: number
}
