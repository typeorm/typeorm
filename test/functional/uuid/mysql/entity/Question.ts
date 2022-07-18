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

    @Column()
    uuid2: string

    @Column("varchar", { nullable: true })
    uuid3: string | null

    @Column("varchar", { nullable: true })
    @Generated("uuid")
    uuid4: string | null
}
