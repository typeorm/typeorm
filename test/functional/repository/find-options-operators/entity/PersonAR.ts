import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { BaseEntity } from "typeorm"

@Entity()
export class PersonAR extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}
