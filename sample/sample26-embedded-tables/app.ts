import "reflect-metadata";
import {createConnection, ConnectionOptions} from "../../src/index";
import {Post} from "./entity/Post";
import {Question} from "./entity/Question";
import {Counters} from "./entity/Counters";

const options: ConnectionOptions = {
    driver: {
        type: "mysql",
        host: "localhost",
        port: 3306,
        username: "root",
        password: "admin",
        database: "test"
    },
    logging: {
        logOnlyFailedQueries: true,
        logFailedQueryError: true
    },
    autoSchemaSync: true,
    entities: [Post, Question, Counters]
};

createConnection(options).then(connection => {

    let questionRepository = connection.getRepository(Question);
    
    const question = new Question();
    question.title = "Hello question!";
    question.counters = new Counters();
    question.counters.stars = 5;
    question.counters.raiting = 10;
    question.counters.commentCount = 3;
    question.counters.metadata = "#question #question-counter";

    questionRepository
        .persist(question)
        .then(savedQuestion => {
            console.log("question has been saved: ", savedQuestion);
            
            // lets load it now:
            return questionRepository.findOneById(savedQuestion.id);
        })
        .then(loadedQuestion => {
            console.log("question has been loaded: ", loadedQuestion);

            loadedQuestion!.counters.commentCount = 7;
            loadedQuestion!.counters.metadata = "#updated question";
            
            return questionRepository.persist(loadedQuestion!);
        })
        .then(updatedQuestion => {
            console.log("question has been updated: ", updatedQuestion);
        })
        .catch(e => console.log(e));

}, error => console.log("Cannot connect: ", error));
