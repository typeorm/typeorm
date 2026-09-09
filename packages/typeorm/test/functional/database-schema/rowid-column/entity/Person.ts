import { Generated } from "../../../../../src"
import { PrimaryColumn } from "../../../../../src"
import { PrimaryGeneratedColumn } from "../../../../../src"
import { Entity } from "../../../../../src"
import { Column } from "../../../../../src"

@Entity()
export class Person {
    @PrimaryGeneratedColumn("rowid")
    id: string

    @PrimaryColumn()
    @Generated("rowid")
    id2: string

    @PrimaryColumn({ generated: "rowid" })
    id3: string

    @Column({ generated: "rowid" })
    id4: string
}
