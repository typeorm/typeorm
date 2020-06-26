import { Entity, OneToMany, PrimaryColumn } from "@typeorm/core";
import { Month } from "./month";

@Entity()
export class Year {

    @PrimaryColumn()
    public yearNo: number;

    @OneToMany(type => Month, month => month.yearNo)
    public month: Month[];

}
