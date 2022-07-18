import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "typeorm/decorator/entity/Entity"

@Entity()
export class Role {
    @PrimaryGeneratedColumn() id: number

    @Column() name: string
}
