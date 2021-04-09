import { EntitySchema } from "../../../../src";

import Post from "./Post";

let id = 0;

export default class PostAttachment {
    attachmentId: number;

    post: Post;

    constructor () {
        this.attachmentId = id++;
    }
}

export const PostAttachmentSchema = new EntitySchema<PostAttachment>({
    name: "PostAttachment",
    target: PostAttachment,
    columns: {
        attachmentId: {
            type: Number,
            primary: true,
            nullable: false
        }
    },
    relations: {
        post: {
            primary: true,
            nullable: false,
            target: () => Post,
            type: "many-to-one"
        }
    }
});
