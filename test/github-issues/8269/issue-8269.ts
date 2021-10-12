import "reflect-metadata";
import { plainToClass } from "class-transformer";

import { User } from "./User";
import { Shim } from "./shim";

describe("github issues > #8269 model-shim: support BaseEntity extending", () => {
    it("should create instances with the correct property types", () => {
        const photoLiteral = {
            url: "typeorm.io",
        };

        const user = plainToClass(User, {
            someDate: "Sat Jun 01 2019",
            oneToOnePhoto: photoLiteral,
            oneToManyPhotos: [photoLiteral],
            manyToOnePhoto: photoLiteral,
            manyToManyPhotos: [photoLiteral],
            treeChildrenPhotos: [photoLiteral],
            treeParentPhoto: photoLiteral,
        });

        user.hasId().should.be.a("boolean");
        user.save({}).should.be.instanceof(Promise);
        user.remove({}).should.be.instanceof(Promise);
        user.softRemove({}).should.be.instanceof(Promise);
        user.recover({}).should.be.instanceof(Promise);
        user.reload().should.be.instanceof(Promise);

        Shim.BaseEntity.should.have.property("useConnection");
        Shim.BaseEntity.getRepository().should.be.instanceof(Function);
        Shim.BaseEntity.should.have.property("target");
        Shim.BaseEntity.hasId().should.be.a("boolean");
        Shim.BaseEntity.should.have.property("getId");
        Shim.BaseEntity.createQueryBuilder().should.be.instanceof(Function);
        Shim.BaseEntity.create(User).should.be.instanceof(Shim.BaseEntity);
        Shim.BaseEntity.create(User, [{}]).should.be.instanceof(Array);
        Shim.BaseEntity.create(User, [{}])[0].should.be.instanceof(
            Shim.BaseEntity
        );
        Shim.BaseEntity.create(User, {}).should.be.instanceof(Shim.BaseEntity);
        Shim.BaseEntity.merge(User, user, user).should.be.instanceof(
            Shim.BaseEntity
        );
        Shim.BaseEntity.preload().should.be.instanceof(Promise);
        Shim.BaseEntity.save().should.be.instanceof(Promise);
        Shim.BaseEntity.save().should.be.instanceof(Promise);
        Shim.BaseEntity.remove().should.be.instanceof(Promise);
        Shim.BaseEntity.remove().should.be.instanceof(Promise);
        Shim.BaseEntity.softRemove().should.be.instanceof(Promise);
        Shim.BaseEntity.softRemove().should.be.instanceof(Promise);
        Shim.BaseEntity.insert().should.be.instanceof(Promise);
        Shim.BaseEntity.update().should.be.instanceof(Promise);
        Shim.BaseEntity.delete().should.be.instanceof(Promise);
        Shim.BaseEntity.count().should.be.instanceof(Promise);
        Shim.BaseEntity.count().should.be.instanceof(Promise);
        Shim.BaseEntity.find().should.be.instanceof(Promise);
        Shim.BaseEntity.find().should.be.instanceof(Promise);
        Shim.BaseEntity.findAndCount().should.be.instanceof(Promise);
        Shim.BaseEntity.findAndCount().should.be.instanceof(Promise);
        Shim.BaseEntity.findByIds().should.be.instanceof(Promise);
        Shim.BaseEntity.findByIds().should.be.instanceof(Promise);
        Shim.BaseEntity.findOne().should.be.instanceof(Promise);
        Shim.BaseEntity.findOne().should.be.instanceof(Promise);
        Shim.BaseEntity.findOne().should.be.instanceof(Promise);
        Shim.BaseEntity.findOneOrFail().should.be.instanceof(Promise);
        Shim.BaseEntity.findOneOrFail().should.be.instanceof(Promise);
        Shim.BaseEntity.findOneOrFail().should.be.instanceof(Promise);
        Shim.BaseEntity.query().should.be.instanceof(Promise);
        Shim.BaseEntity.clear().should.be.instanceof(Promise);
    });
});
