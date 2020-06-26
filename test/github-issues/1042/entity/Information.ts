import { Column } from "@typeorm/core";

export class Information {

    @Column()
    maritalStatus: string;

    @Column()
    gender: string;

    @Column()
    address: string;

}
