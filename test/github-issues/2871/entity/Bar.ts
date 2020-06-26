import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

import { DocumentEnum } from "../documentEnum";
import { getEnumValues } from "../enumTools";

@Entity()
export class Bar extends BaseEntity {
    @PrimaryGeneratedColumn() barId: number;

    @Column({
        type: "enum",
        enum: getEnumValues(DocumentEnum),
        array: true,
    })
    documents: DocumentEnum[];
}
