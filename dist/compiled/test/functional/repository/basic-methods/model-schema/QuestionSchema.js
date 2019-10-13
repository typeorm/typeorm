"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    name: "Question",
    table: {
        name: "question"
    },
    columns: {
        id: {
            type: "int",
            primary: true,
            generated: true
        },
        title: {
            type: "varchar",
            nullable: false
        }
    },
    target: function Question() {
        this.type = "question";
    }
};
//# sourceMappingURL=QuestionSchema.js.map