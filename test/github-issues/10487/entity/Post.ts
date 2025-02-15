import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "../../../../src";
import { User } from "./User";

@Entity()
export class Post extends BaseEntity {
    @PrimaryGeneratedColumn({
        type: "int",
    })
    id: any

    @Column({
        type: "varchar",
        length: 100,
    })
    title: string

    @Column({
        type: "varchar",
        length: 100,
    })
    content: string

    @ManyToOne(() => User, user => user.posts)
    user: User;
}