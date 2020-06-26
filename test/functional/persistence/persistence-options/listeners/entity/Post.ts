import { AfterRemove, BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    description: string;

    isRemoved: boolean = false;

    @BeforeInsert()
    beforeInsert() {
        this.title += "!";
    }

    @AfterRemove()
    afterRemove() {
        this.isRemoved = true;
    }

}
