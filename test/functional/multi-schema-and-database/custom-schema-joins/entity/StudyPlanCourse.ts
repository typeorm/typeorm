import { Entity, PrimaryColumn } from "../../../../../src"

@Entity({ schema: "myschema", name: "StudyPlanCourse" })
export class StudyPlanCourse {
    @PrimaryColumn()
    studyPlanId: string

    @PrimaryColumn()
    courseId: string
}
