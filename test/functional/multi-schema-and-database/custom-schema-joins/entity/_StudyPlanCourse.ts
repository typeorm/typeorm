import { Entity, PrimaryColumn } from "../../../../../src"

@Entity({ schema: "myschema", name: "_StudyPlanCourse" })
export class _StudyPlanCourse {
    @PrimaryColumn()
    studyPlanId: string

    @PrimaryColumn()
    courseId: string
}
