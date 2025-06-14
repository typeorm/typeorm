import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryColumn,
} from "../../../../src"
import { Translation } from "./translation"

@Entity("countries")
export class Country {
    @PrimaryColumn({ length: 2 })
    code: string

    @Column()
    nameTranslationId: number

    @ManyToOne(() => Translation, { createForeignKeyConstraints: false })
    @JoinColumn({ name: "nameTranslationId", referencedColumnName: "id" })
    nameTranslation: Translation

    @OneToMany(() => Translation, "nameCountry")
    nameTranslations: Translation[]

    @Column("int", { nullable: true })
    currencyTranslationId: number | null

    @ManyToOne(() => Translation, { createForeignKeyConstraints: false })
    @JoinColumn({ name: "currencyTranslationId", referencedColumnName: "id" })
    currencyTranslation: Translation

    @OneToMany(() => Translation, "currencyCountry")
    currencyTranslations: Translation[]
}
