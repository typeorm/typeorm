import { Column } from "@typeorm/core";

export class EditHistory {

    @Column()
    title: string;

    @Column()
    text: string;

}
