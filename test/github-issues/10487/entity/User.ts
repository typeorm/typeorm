import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "../../../../src";
import { Post } from "./Post";

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: "varchar",
        length: 100,
    })
    firstName: string

    @Column({
        type: "varchar",
        length: 100,
    })
    lastName: string

    @Column({
        type: "int",
    })
    age: number

    @OneToMany(() => Post, post => post.user, {
        cascade: true,
        eager: true
    })
    posts: Post[];
}