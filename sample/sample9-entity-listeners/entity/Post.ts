import crypto from "node:crypto"

import { AfterInsert } from "../../../src/decorator/listeners/AfterInsert"
import { AfterLoad } from "../../../src/decorator/listeners/AfterLoad"
import { AfterRecover } from "../../../src/decorator/listeners/AfterRecover"
import { AfterRemove } from "../../../src/decorator/listeners/AfterRemove"
import { AfterSoftRemove } from "../../../src/decorator/listeners/AfterSoftRemove"
import { AfterUpdate } from "../../../src/decorator/listeners/AfterUpdate"
import { BeforeInsert } from "../../../src/decorator/listeners/BeforeInsert"
import { BeforeRecover } from "../../../src/decorator/listeners/BeforeRecover"
import { BeforeRemove } from "../../../src/decorator/listeners/BeforeRemove"
import { BeforeSoftRemove } from "../../../src/decorator/listeners/BeforeSoftRemove"
import { BeforeUpdate } from "../../../src/decorator/listeners/BeforeUpdate"
import { JoinTable } from "../../../src/decorator/relations/JoinTable"
import { ManyToOne } from "../../../src/decorator/relations/ManyToOne"
import {
    Column,
    Entity,
    ManyToMany,
    PrimaryGeneratedColumn,
} from "../../../src/index"
import { PostAuthor } from "./PostAuthor"
import { PostCategory } from "./PostCategory"

@Entity("sample9_post")
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    text: string

    @ManyToOne(() => PostAuthor, (post) => post.posts, {
        cascade: true,
    })
    author: PostAuthor

    @ManyToMany(() => PostCategory, (category) => category.posts, {
        cascade: true,
    })
    @JoinTable()
    categories: PostCategory[] = []

    uid: number

    @AfterLoad()
    generateRandomNumbers() {
        console.log(
            `event: Post "${this.title}" entity has been loaded and callback executed`,
        )
        this.uid = crypto.randomInt(0, 1000)
    }

    @BeforeInsert()
    doSomethingBeforeInsertion() {
        console.log("event: Post entity will be inserted so soon...")
    }

    @AfterInsert()
    doSomethingAfterInsertion() {
        console.log(
            "event: Post entity has been inserted and callback executed",
        )
    }

    @BeforeUpdate()
    doSomethingBeforeUpdate() {
        console.log("event: Post entity will be updated so soon...")
    }

    @AfterUpdate()
    doSomethingAfterUpdate() {
        console.log("event: Post entity has been updated and callback executed")
    }

    @BeforeRemove()
    doSomethingBeforeRemove() {
        console.log("event: Post entity will be removed so soon...")
    }

    @AfterRemove()
    doSomethingAfterRemove() {
        console.log("event: Post entity has been removed and callback executed")
    }

    @BeforeSoftRemove()
    doSomethingBeforeSoftRemove() {
        console.log("event: Post entity will be soft-removed so soon...")
    }

    @AfterSoftRemove()
    doSomethingAfterSoftRemove() {
        console.log(
            "event: Post entity has been soft-removed and callback executed",
        )
    }

    @BeforeRecover()
    doSomethingBeforeRecover() {
        console.log("event: Post entity will be recovered so soon...")
    }

    @AfterRecover()
    doSomethingAfterRecover() {
        console.log(
            "event: Post entity has been recovered and callback executed",
        )
    }
}
