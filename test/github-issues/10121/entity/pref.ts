import { Column, Entity, PrimaryColumn } from "../../../../src"

@Entity({ name: "E_PREF" })
export default class PrefModel {
    @PrimaryColumn({ name: "PREF_ID" })
    id!: string

    @Column({ name: "PREF_NAME", nullable: false })
    name!: string

    @Column({ name: "PREF_KANA", nullable: false })
    kanaName!: string
}
