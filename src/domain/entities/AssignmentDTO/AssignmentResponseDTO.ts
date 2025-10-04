import { AssignmentDetailResponseDTO } from "../AssignmentDetailDTO/AssignmentDetailResponseDTO";

export class AssignmentResponseDTO {
    AssignmentId: number;
    ClassId: string;
    ClassName: string;
    TeacherId: string;
    TeacherName: string;
    Title: string;
    Description: string;
    Deadline: string;
    CreatedAt: string;
    assignments: Array<AssignmentDetailResponseDTO>;

    constructor({
        AssignmentId,
        ClassId,
        ClassName,
        TeacherId,
        TeacherName,
        Title,
        Description,
        Deadline,
        CreatedAt,
        assignments = []
    }: {
        AssignmentId: number;
        ClassId: string;
        ClassName: string;
        TeacherId: string;
        TeacherName: string;
        Title: string;
        Description: string;
        Deadline: string;
        CreatedAt: string;
        assignments?: Array<AssignmentDetailResponseDTO>;
    }) {
        this.AssignmentId = AssignmentId;
        this.ClassId = ClassId;
        this.ClassName = ClassName;
        this.TeacherId = TeacherId;
        this.TeacherName = TeacherName;
        this.Title = Title;
        this.Description = Description;
        this.Deadline = Deadline;
        this.CreatedAt = CreatedAt;
        this.assignments = assignments;
    }

    static fromJson(json: any): AssignmentResponseDTO {
        return new AssignmentResponseDTO({
            AssignmentId: json.AssignmentId,
            ClassId: json.ClassId,
            ClassName: json.ClassName,
            TeacherId: json.TeacherId,
            TeacherName: json.TeacherName,
            Title: json.Title,
            Description: json.Description,
            Deadline: json.Deadline,
            CreatedAt: json.CreatedAt,
            assignments: json.assignments ? json.assignments.map((item: any) => AssignmentDetailResponseDTO.fromJson(item)) : []
        });
    }
}