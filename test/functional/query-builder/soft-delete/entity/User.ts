import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { DeleteDateColumn } from "../../../../../src/decorator/columns/DeleteDateColumn"
import { Column } from "../../../../../src/decorator/columns/Column"
import { Photo } from "./Photo"
import {
    JoinColumn,
    OneToOne,
    CreateDateColumn,
    UpdateDateColumn,
    VersionColumn,
} from "../../../../../src"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column({ nullable: true })
    company: string

    @Column()
    likesCount: number = 0

    @OneToOne(() => Photo)
    @JoinColumn()
    picture: Photo

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date

    @VersionColumn()
    version: number

    @DeleteDateColumn()
    deletedAt: Date
}
