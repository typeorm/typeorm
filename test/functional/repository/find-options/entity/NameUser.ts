import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"
import { VirtualColumn } from "../../../../../src"

@Entity('name_user')
export class NameUser {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string

    @VirtualColumn({
        query: (alias) => `SELECT nu.firstName || ' ' || nu.lastName FROM name_user nu WHERE nu.id = ${alias}.id`
    })
    fullName: string;
}
