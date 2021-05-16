import {Column, Entity, PrimaryGeneratedColumn} from "../../../src/index";
import {Post} from "./Post";
import {OneToMany} from "../../../src/decorator/relations/OneToMany";
import {AfterRemove} from "../../../src/decorator/listeners/AfterRemove";
import {BeforeRemove} from "../../../src/decorator/listeners/BeforeRemove";
import {AfterUpdate} from "../../../src/decorator/listeners/AfterUpdate";
import {BeforeUpdate} from "../../../src/decorator/listeners/BeforeUpdate";
import {AfterInsert} from "../../../src/decorator/listeners/AfterInsert";
import {BeforeInsert} from "../../../src/decorator/listeners/BeforeInsert";

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