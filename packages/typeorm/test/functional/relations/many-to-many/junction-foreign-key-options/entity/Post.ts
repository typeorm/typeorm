import {
    Entity,
    JoinTable,
    ManyToMany,
    PrimaryGeneratedColumn,
} from "../../../../../../src"
import { Topic } from "./Topic"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    /**
     * Owner side keeps the default CASCADE, inverse side is restricted
     * through the new inverseJoinColumn options.
     */
    @ManyToMany(() => Topic, { onDelete: "CASCADE" })
    @JoinTable({
        name: "post_topics",
        joinColumn: { name: "post_id" },
        inverseJoinColumn: {
            name: "topic_id",
            onDelete: "NO ACTION",
            onUpdate: "NO ACTION",
        },
    })
    topics: Topic[]

    /**
     * Symmetry: the joinColumn side accepts the same options.
     */
    @ManyToMany(() => Topic)
    @JoinTable({
        name: "post_restricted_topics",
        joinColumn: {
            name: "post_id",
            onDelete: "NO ACTION",
            onUpdate: "NO ACTION",
        },
        inverseJoinColumn: { name: "topic_id" },
    })
    restrictedTopics: Topic[]

    /**
     * Precedence: relation options win over joinColumn options.
     */
    @ManyToMany(() => Topic, { onDelete: "CASCADE", onUpdate: "CASCADE" })
    @JoinTable({
        name: "post_overridden_topics",
        joinColumn: { onDelete: "NO ACTION", onUpdate: "NO ACTION" },
        inverseJoinColumn: { onDelete: "NO ACTION", onUpdate: "NO ACTION" },
    })
    overriddenTopics: Topic[]

    /**
     * Deferrable can be set per junction foreign key.
     */
    @ManyToMany(() => Topic)
    @JoinTable({
        name: "post_deferred_topics",
        joinColumn: { name: "post_id", deferrable: "INITIALLY DEFERRED" },
        inverseJoinColumn: {
            name: "topic_id",
            deferrable: "INITIALLY IMMEDIATE",
        },
    })
    deferredTopics: Topic[]
}
