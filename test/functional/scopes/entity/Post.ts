import {Entity} from "../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../src/decorator/columns/Column";
import {Scope} from "../../../../src/decorator/scopes/Scope";
import {SelectQueryBuilder} from "../../../../src/query-builder/SelectQueryBuilder";
import {BaseEntity} from "../../../../src/repository/BaseEntity";


@Entity()
export class Post extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    stage: string;

    @Column()
    views: number;

    @Scope()
    static idAtMost(id: number): (qb: SelectQueryBuilder<Post>) => SelectQueryBuilder<Post> {
        return function(qb: SelectQueryBuilder<Post>): SelectQueryBuilder<Post> {
            return qb.andWhere('id <= :id', {id: id});
        }
    }

    @Scope(true)
    static isPublic(qb: SelectQueryBuilder<Post>): SelectQueryBuilder<Post> {
        return qb.andWhere('stage = :stage', {stage: 'public'});
    }

    @Scope()
    static isDraft(qb: SelectQueryBuilder<Post>): SelectQueryBuilder<Post> {
        return qb.andWhere('stage = :stage', {stage: 'draft'});
    }

    @Scope(true)
    static hasViewsAtLeast100(qb: SelectQueryBuilder<Post>): SelectQueryBuilder<Post> {
        return Post.hasViewsAtLeast(100)(qb);
    }

    @Scope()
    static hasViewsAtLeast(views: number): (qb: SelectQueryBuilder<Post>) => SelectQueryBuilder<Post> {
        return function(qb: SelectQueryBuilder<Post>): SelectQueryBuilder<Post> {
            return qb.andWhere('views >= :views', {views: views});
        }
    }

    @Scope()
    static draftAndView200(qb: SelectQueryBuilder<Post>): SelectQueryBuilder<Post> {
        return [Post.isDraft, Post.hasViewsAtLeast(200)].reduce((q, s) => s(q), qb);
    }
}