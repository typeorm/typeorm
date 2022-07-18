import { Column, Entity, PrimaryGeneratedColumn, VersionColumn } from "typeorm"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @VersionColumn()
    version: number
}
