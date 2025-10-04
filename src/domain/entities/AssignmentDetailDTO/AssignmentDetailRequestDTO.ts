export class AssignmentDetailRequestDTO {
    AssignmentId: number;
    StudentId: string;
    StatusId?: number;
    FilePath?: string;
    SubmittedAt?: string;
    Grade?: number;
    File: File;

    constructor({
        AssignmentId,
        StudentId,
        StatusId,
        FilePath,
        SubmittedAt,
        Grade,
        File
    }: {
        AssignmentId: number;
        StudentId: string;
        StatusId?: number;
        FilePath?: string;
        SubmittedAt?: string;
        Grade?: number;
        File: File;
    }) {
        this.AssignmentId = AssignmentId;
        this.StudentId = StudentId;
        this.StatusId = StatusId;
        this.FilePath = FilePath;
        this.SubmittedAt = SubmittedAt;
        this.Grade = Grade;
        this.File = File;
    }
}