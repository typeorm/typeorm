import { BaseEntity, Column, PrimaryGeneratedColumn } from "typeorm"

import { Entity } from "typeorm/decorator/entity/Entity"

import { DocumentEnum } from "../documentEnum"
import { getEnumValues } from "../enumTools"

@Entity()
export class Bar extends BaseEntity {
    @PrimaryGeneratedColumn() barId: number

    @Column({
        type: "enum",
        enum: getEnumValues(DocumentEnum),
        array: true,
    })
    documents: DocumentEnum[]
}
