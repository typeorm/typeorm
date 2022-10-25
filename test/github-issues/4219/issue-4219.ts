import "reflect-metadata"
import { plainToClassFromExist } from "class-transformer"
import { expect } from "chai"

// import { Photo } from "./entity/Photo"
import { User } from "./entity/User"

describe("github issues > #4219 class-transformer-shim: support metadata reflection", () => {
    it("should create instances with the correct property types", () => {
        const photoLiteral = {
            url: "typeorm.io",
        }

        const user = plainToClassFromExist(User, {
            someDate: "Sat Jun 01 2019",
            oneToOnePhoto: photoLiteral,
            oneToManyPhotos: [photoLiteral],
            manyToOnePhoto: photoLiteral,
            manyToManyPhotos: [photoLiteral],
            treeChildrenPhotos: [photoLiteral],
            treeParentPhoto: photoLiteral,
        })

        expect(user).instanceof(User)

        // user.someDate.should.be.instanceof(Date)
        // user.oneToOnePhoto.should.be.instanceof(Photo)
        // user.oneToManyPhotos[0].should.be.instanceof(Photo)
        // user.manyToOnePhoto.should.be.instanceof(Photo)
        // user.manyToManyPhotos[0].should.be.instanceof(Photo)
        // user.treeParentPhoto.should.be.instanceof(Photo)
    })
})
