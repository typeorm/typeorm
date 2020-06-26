import {Column, Entity, PrimaryGeneratedColumn} from "@typeorm/core";
import {Post} from "./Post";
import {ManyToMany} from "@typeorm/core";
import {AfterRemove} from "@typeorm/core";
import {BeforeRemove} from "@typeorm/core";
import {AfterUpdate} from "@typeorm/core";
import {BeforeUpdate} from "@typeorm/core";
import {AfterInsert} from "@typeorm/core";
import {BeforeInsert} from "@typeorm/core";

@Entity("sample9_post_category")
export class PostCategory {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany(type => Post, post => post.categories, {
        cascade: true
    })
    posts: Post[] = [];

    @BeforeInsert()
    doSomethingBeforeInsertion() {
        console.log(`event: PostCategory "${this.name}" will be inserted so soon...`);
    }

    @AfterInsert()
    doSomethingAfterInsertion() {
        console.log(`event: PostCategory "${this.name}" has been inserted and callback executed`);
    }

    @BeforeUpdate()
    doSomethingBeforeUpdate() {
        console.log(`event: PostCategory "${this.name}" will be updated so soon...`);
    }

    @AfterUpdate()
    doSomethingAfterUpdate() {
        console.log(`event: PostCategory "${this.name}" has been updated and callback executed`);
    }

    @BeforeRemove()
    doSomethingBeforeRemove() {
        console.log(`event: PostCategory "${this.name}" will be removed so soon...`);
    }

    @AfterRemove()
    doSomethingAfterRemove() {
        console.log(`event: PostCategory "${this.name}" has been removed and callback executed`);
    }

}
