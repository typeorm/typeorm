import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { Generated } from "typeorm/decorator/Generated"

@Entity()
export class Question {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    @Generated("uuid")
    uuid: string

    @Column("uniqueidentifier", { nullable: true })
    uuid2: string | null

    @Column("uniqueidentifier", { nullable: true })
    @Generated("uuid")
    uuid3: string | null
}
