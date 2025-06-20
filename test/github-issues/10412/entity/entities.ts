import { EntitySchema } from "../../../../src"

interface DocumentRelation {
    documentRelationId: number
    documentId: number
    userId?: number

    document?: Document
}

interface Document {
    documentId: number

    documentRelation?: DocumentRelation[]
}

interface User {
    userId: number

    documents?: Document[]
}

export const userEntitySchema = new EntitySchema<User>({
    name: "user",
    columns: {
        userId: { type: Number, primary: true, name: "user_id" },
    },
    relations: {
        documents: {
            type: "many-to-many",
            target: "document",
            joinTable: {
                name: "document_relation",
                joinColumn: {
                    name: "user_id",
                    referencedColumnName: "userId",
                },
                inverseJoinColumn: {
                    name: "document_id",
                    referencedColumnName: "documentId",
                },
            },
        },
    },
})

export const documentEntitySchema = new EntitySchema<Document>({
    name: "document",
    columns: {
        documentId: { type: Number, primary: true, name: "document_id" },
    },
    relations: {
        documentRelation: {
            type: "one-to-many",
            target: "document_relation",
            inverseSide: "document",
            joinColumn: {
                name: "document_id",
                referencedColumnName: "documentId",
            },
        },
    },
})

export const documentRelationEntitySchema = new EntitySchema<DocumentRelation>({
    name: "document_relation",
    columns: {
        documentRelationId: {
            type: Number,
            primary: true,
            name: "document_relation_id",
        },
        documentId: { type: Number, name: "document_id" },
        userId: { type: Number, name: "user_id", nullable: true },
    },
    relations: {
        document: {
            type: "many-to-one",
            target: "document",
            inverseSide: "documentRelation",
            joinColumn: {
                name: "document_id",
                referencedColumnName: "documentId",
            },
        },
    },
})
