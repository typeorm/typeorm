import { Column, Entity, PrimaryColumn } from "../../../../src"

@Entity({ name: "E_PREF" })
export class PrefModel {
    @PrimaryColumn({ name: "PREF_ID" })
    id: string

    @Column({ name: "PREF_NAME" })
    name: string

    @Column({ name: "PREF_KANA" })
    kanaName: string
}
