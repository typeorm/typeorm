import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity()
export class Foo {
    @PrimaryColumn({ type: "varbinary", length: 16 })
    id: Buffer

    @Column()
    name: string
}
