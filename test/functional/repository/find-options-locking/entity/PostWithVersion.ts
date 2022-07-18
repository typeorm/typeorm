import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { VersionColumn } from "typeorm/decorator/columns/VersionColumn"

@Entity()
export class PostWithVersion {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @VersionColumn()
    version: number
}
