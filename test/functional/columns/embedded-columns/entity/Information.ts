import { Column } from "@typeorm/core";

export class Information {

    @Column({name: "descr"})
    description: string;
}
