import { BaseEntity, Entity, JoinTable, ManyToMany, PrimaryColumn } from "@typeorm/core";

import { Bar } from "./Bar";

@Entity("foo")
export class Foo extends BaseEntity {
    @PrimaryColumn() id: number;

    @JoinTable()
    @ManyToMany(() => Bar, bar => bar.foos, {
        cascade: ["insert", "update"],
        onDelete: "NO ACTION"
    })
    bars?: Bar[];


    @JoinTable()
    @ManyToMany(() => Bar, bar => bar.foos, {
        cascade: ["insert", "update"],
    })
    otherBars?: Bar[];
}
