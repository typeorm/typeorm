import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {OneToOne} from "../../../../../../src/decorator/relations/OneToOne";
import {JoinColumn} from "../../../../../../src/decorator/relations/JoinColumn";
import {User} from "./User";
import {ManyToOne} from "../../../../../../src/decorator/relations/ManyToOne";
import {Post} from "./Post";

@Entity()
export class Editor {

    @OneToOne(type => User, { eager: true, primary: true })
    @JoinColumn()
    user: User;

    @ManyToOne(type => Post, { primary: true })
    post: Post;

}