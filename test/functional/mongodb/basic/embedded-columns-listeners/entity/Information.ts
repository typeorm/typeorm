import { AfterLoad, BeforeInsert, Column } from "@typeorm/core";

export class Information {

    @Column()
    description?: string;

    @Column()
    comments?: number;

    @BeforeInsert()
    beforeInsert() {
        this.description = "description afterLoad";
    }

    @AfterLoad()
    afterLoad() {
        this.comments = 1;
    }

}
