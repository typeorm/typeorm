import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"

@Entity()
export class Image {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    isRemoved: boolean = false
}
