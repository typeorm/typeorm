import { Column, Entity } from "typeorm"

@Entity({ name: "first" })
export default class Testing {
    @Column("int", {
        nullable: false,
        primary: true,
        unique: true,
    })
    public id!: number
}
