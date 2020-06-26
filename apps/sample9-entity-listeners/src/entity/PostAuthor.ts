import {Column, Entity, PrimaryGeneratedColumn} from "@typeorm/core";
import {Post} from "./Post";
import {OneToMany} from "@typeorm/core";
import {AfterRemove} from "@typeorm/core";
import {BeforeRemove} from "@typeorm/core";
import {AfterUpdate} from "@typeorm/core";
import {BeforeUpdate} from "@typeorm/core";
import {AfterInsert} from "@typeorm/core";
import {BeforeInsert} from "@typeorm/core";

@Entity("sample9_post_author")
export class PostAuthor {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Post, post => post.author)
    posts: Post[];

    @BeforeInsert()
    doSomethingBeforeInsertion() {
        console.log("event: PostAuthor entity will be inserted so soon...");
    }

    @AfterInsert()
    doSomethingAfterInsertion() {
        console.log("event: PostAuthor entity has been inserted and callback executed");
    }

    @BeforeUpdate()
    doSomethingBeforeUpdate() {
        console.log("event: PostAuthor entity will be updated so soon...");
    }

    @AfterUpdate()
    doSomethingAfterUpdate() {
        console.log("event: PostAuthor entity has been updated and callback executed");
    }

    @BeforeRemove()
    doSomethingBeforeRemove() {
        console.log("event: PostAuthor entity will be removed so soon...");
    }

    @AfterRemove()
    doSomethingAfterRemove() {
        console.log("event: PostAuthor entity has been removed and callback executed");
    }

}
