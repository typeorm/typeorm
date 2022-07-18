import { Entity } from "typeorm"
import { PrimaryGeneratedColumn } from "typeorm"
import { Column, VersionColumn } from "typeorm"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @VersionColumn()
    version: number

    @Column({ type: "jsonb" })
    problems: object
}
