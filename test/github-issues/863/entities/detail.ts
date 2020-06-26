import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "@typeorm/core";

import { Master } from "./master";

@Entity()
@Index("IDX_UNQ_MasterId", type => [type.masterId], {unique: true})
export class Detail {

    @PrimaryColumn({
        length: 20
    })
    id: string;

    @Column({
        nullable: false,
        length: 20
    })
    masterId: string;

    @ManyToOne(type => Master, master => master.details, {
        nullable: false,
        onDelete: "CASCADE"
    })
    @JoinColumn({
        name: "masterId"
    })
    master: Master;

}
