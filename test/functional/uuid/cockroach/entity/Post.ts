import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { Generated } from "typeorm/decorator/Generated"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: string

    @Column()
    @Generated("uuid")
    uuid: string
}
