import { Photo } from "./Photo";
import { User } from "./User";
import { Question } from "./Question";
export declare class Answer {
    id: number;
    question: Question;
    photo: Photo;
    user: User;
}
