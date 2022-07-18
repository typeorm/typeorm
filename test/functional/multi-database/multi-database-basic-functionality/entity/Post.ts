import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"

@Entity({ database: "./subdir/relative-subdir-sqlite.attach.db" })
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}
