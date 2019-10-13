"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
var index_1 = require("../../src/index");
var Post_1 = require("./entity/Post");
var Question_1 = require("./entity/Question");
var Counters_1 = require("./entity/Counters");
var options = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    logging: ["query", "error"],
    synchronize: true,
    entities: [Post_1.Post, Question_1.Question, Counters_1.Counters]
};
index_1.createConnection(options).then(function (connection) {
    var questionRepository = connection.getRepository(Question_1.Question);
    var question = new Question_1.Question();
    question.title = "Hello question!";
    question.counters = new Counters_1.Counters();
    question.counters.stars = 5;
    question.counters.raiting = 10;
    question.counters.commentCount = 3;
    question.counters.metadata = "#question #question-counter";
    questionRepository
        .save(question)
        .then(function (savedQuestion) {
        console.log("question has been saved: ", savedQuestion);
        // lets load it now:
        return questionRepository.findOne(savedQuestion.id);
    })
        .then(function (loadedQuestion) {
        console.log("question has been loaded: ", loadedQuestion);
        loadedQuestion.counters.commentCount = 7;
        loadedQuestion.counters.metadata = "#updated question";
        return questionRepository.save(loadedQuestion);
    })
        .then(function (updatedQuestion) {
        console.log("question has been updated: ", updatedQuestion);
    })
        .catch(function (e) { return console.log(e); });
}, function (error) { return console.log("Cannot connect: ", error); });
//# sourceMappingURL=app.js.map