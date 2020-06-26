import { Column, Entity, OneToMany, PrimaryColumn } from "@typeorm/core";

import { Detail } from "./detail";

@Entity()
export class Master {

    @PrimaryColumn({
        length: 20
    })
    id: string;

    @Column({
        nullable: false,
        length: 150
    })
    description: string;

    @OneToMany(type => Detail, detail => detail.master)
    details: Detail[];

}
