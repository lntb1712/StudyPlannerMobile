export class AssignmentDetailResponseDTO {
    AssignmentId: number;
    StudentId: string;
    StudentName?: string;
    FilePath?: string;
    StatusId?: number;
    StatusName?: string;
    SubmittedAt?: string;
    Grade?: number;

    constructor({
        AssignmentId,
        StudentId,
        StudentName,
        FilePath,
        StatusId,
        StatusName,
        SubmittedAt,
        Grade
    }: {
        AssignmentId: number;
        StudentId: string;
        StudentName?: string;
        FilePath?: string;
        StatusId?: number;
        StatusName?: string;
        SubmittedAt?: string;
        Grade?: number;
    }) {
        this.AssignmentId = AssignmentId;
        this.StudentId = StudentId;
        this.StudentName = StudentName;
        this.FilePath = FilePath;
        this.StatusId = StatusId;
        this.StatusName = StatusName;
        this.SubmittedAt = SubmittedAt;
        this.Grade = Grade;
    }

    static fromJson(json: any): AssignmentDetailResponseDTO {
        return new AssignmentDetailResponseDTO({
            AssignmentId: json.AssignmentId,
            StudentId: json.StudentId,
            StudentName: json.StudentName,
            FilePath: json.FilePath,
            StatusId: json.StatusId,
            StatusName: json.StatusName,
            SubmittedAt: json.SubmittedAt,
            Grade: json.Grade
        });
    }
}