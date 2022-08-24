import {
    Column,
    Entity,
    ManyToMany,
    PrimaryGeneratedColumn,
} from "../../../src/index"
import { PostCategory } from "./PostCategory"
import { PostAuthor } from "./PostAuthor"
import { ManyToOne } from "../../../src/decorator/relations/ManyToOne"
import { AfterLoad } from "../../../src/decorator/listeners/AfterLoad"
import { AfterInsert } from "../../../src/decorator/listeners/AfterInsert"
import { BeforeInsert } from "../../../src/decorator/listeners/BeforeInsert"
import { BeforeUpdate } from "../../../src/decorator/listeners/BeforeUpdate"
import { AfterUpdate } from "../../../src/decorator/listeners/AfterUpdate"
import { BeforeRemove } from "../../../src/decorator/listeners/BeforeRemove"
import { AfterRemove } from "../../../src/decorator/listeners/AfterRemove"
import { AfterRecover } from "../../../src/decorator/listeners/AfterRecover"
import { BeforeRecover } from "../../../src/decorator/listeners/BeforeRecover"
import { AfterSoftRemove } from "../../../src/decorator/listeners/AfterSoftRemove"
import { BeforeSoftRemove } from "../../../src/decorator/listeners/BeforeSoftRemove"
import { JoinTable } from "../../../src/decorator/relations/JoinTable"

@Entity("sample9_post")
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    text: string

    @ManyToOne((type) => PostAuthor, (post) => post.posts, {
        cascade: true,
    })
    author: PostAuthor

    @ManyToMany((type) => PostCategory, (category) => category.posts, {
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
        this.uid = Math.ceil(Math.random() * 1000)
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
