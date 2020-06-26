import { Column } from "@typeorm/core";

export class Information {

    @Column()
    description: string;

    @Column()
    visible: boolean;

    @Column()
    editable: boolean;

}
