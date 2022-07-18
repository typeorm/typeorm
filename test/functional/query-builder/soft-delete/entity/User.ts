import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { DeleteDateColumn } from "typeorm/decorator/columns/DeleteDateColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { Photo } from "./Photo"
import { JoinColumn, OneToOne } from "typeorm"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    likesCount: number = 0

    @OneToOne(() => Photo)
    @JoinColumn()
    picture: Photo

    @DeleteDateColumn()
    deletedAt: Date
}
