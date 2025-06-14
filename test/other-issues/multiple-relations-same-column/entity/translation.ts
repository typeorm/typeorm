import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryColumn,
} from "../../../../src"
import { Country } from "./country"
import { User } from "./user"

@Entity("translations")
export class Translation {
    @PrimaryColumn()
    id: number

    @PrimaryColumn()
    lang: string

    @Column()
    text: string

    @ManyToOne(() => Country, { createForeignKeyConstraints: false })
    @JoinColumn({ name: "id", referencedColumnName: "nameTranslationId" })
    nameCountry: Country

    @OneToMany(() => Country, "nameTranslation")
    nameCountries: Country[]

    @ManyToOne(() => Country, { createForeignKeyConstraints: false })
    @JoinColumn({ name: "id", referencedColumnName: "currencyTranslationId" })
    currencyCountry: Country

    @OneToMany(() => Country, "currencyTranslation")
    currencyCountries: Country[]

    @ManyToOne(() => User, { createForeignKeyConstraints: false })
    @JoinColumn({ name: "id", referencedColumnName: "firstNameTranslationId" })
    firstNameUser: User

    @ManyToOne(() => User, { createForeignKeyConstraints: false })
    @JoinColumn({ name: "id", referencedColumnName: "lastNameTranslationId" })
    lastNameUser: User
}
