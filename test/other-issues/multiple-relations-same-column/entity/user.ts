import { Column, Entity, OneToMany, PrimaryColumn } from "../../../../src"

import { Contact } from "./contact"
import { Translation } from "./translation"

@Entity("users")
export class User {
    @PrimaryColumn()
    id: number

    @Column()
    lastNameTranslationId: number

    @OneToMany(() => Translation, "lastNameUser")
    lastNameTranslations: Translation[]

    @Column()
    firstNameTranslationId: number

    @OneToMany(() => Translation, "firstNameUser")
    firstNameTranslations: Translation[]

    @OneToMany(() => Contact, (x) => x.createdBy)
    contactsCreatedBy: Contact[]

    @OneToMany(() => Contact, (x) => x.updatedBy)
    contactsUpdatedBy: Contact[]
}
