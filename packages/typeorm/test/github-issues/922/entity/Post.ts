import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src/index"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column("hstore", { hstoreType: "object" })
    hstoreObj: object

    @Column("hstore", { hstoreType: "string" })
    hstoreStr: string
}
