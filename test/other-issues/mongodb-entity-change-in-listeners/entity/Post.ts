import { AfterLoad, BeforeUpdate, Column, Entity, ObjectIdColumn, UpdateDateColumn } from "@typeorm/core";

@Entity()
export class Post {

    @ObjectIdColumn()
    id: number;

    @Column()
    title: string;

    @Column({default: false})
    active: boolean;

    @UpdateDateColumn()
    updateDate: Date;
    loaded: Boolean = false;

    @BeforeUpdate()
    async beforeUpdate() {
        this.title += "!";
    }

    @AfterLoad()
    async afterLoad() {
        this.loaded = true;
    }

}
