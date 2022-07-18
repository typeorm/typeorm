import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { TableInheritance } from "typeorm/decorator/entity/TableInheritance"

@Entity()
@TableInheritance({ column: { type: "varchar", name: "type" } })
export class Token {
    @PrimaryGeneratedColumn() id: number

    @Column() tokenSecret: string

    @Column() expiresOn: Date
}
