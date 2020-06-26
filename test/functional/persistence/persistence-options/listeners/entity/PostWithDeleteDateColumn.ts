import { AfterUpdate, BeforeUpdate, Column, DeleteDateColumn, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class PostWithDeleteDateColumn {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    description: string;

    @DeleteDateColumn()
    deletedAt: Date;

    isSoftRemoved: boolean = false;

    @BeforeUpdate()
    beforeUpdate() {
        this.title += "!";
    }

    @AfterUpdate()
    afterUpdate() {
        this.isSoftRemoved = true;
    }

}
