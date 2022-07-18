import { Column } from "typeorm/decorator/columns/Column"
import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Staff } from "./Staff"
import { OneToMany } from "typeorm"

@Entity()
export class Faculty {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToMany((type) => Staff, (staff) => staff.faculty, {
        cascade: true,
        eager: true,
    })
    staff: Staff[]
}
