import { Column, Entity } from "typeorm"

@Entity({ name: "second" })
export default class Testing {
    @Column("int", {
        nullable: false,
        primary: true,
        unique: true,
    })
    public notId!: number
}
