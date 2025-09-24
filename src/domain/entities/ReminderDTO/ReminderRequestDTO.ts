export class ReminderRequestDTO {
    ReminderId: number;
    ParentId: string;
    StudentId: string;
    Content: string;
    DueDate: string;
    StatusId: number;
    CreateAt: string;

    constructor({ ReminderId, ParentId, StudentId, Content, DueDate, StatusId, CreateAt }: { ReminderId: number, ParentId: string, StudentId: string, Content: string, DueDate: string, StatusId: number, CreateAt: string }) {
        this.ReminderId = ReminderId;
        this.ParentId = ParentId;
        this.StudentId = StudentId;
        this.Content = Content;
        this.DueDate = DueDate;
        this.StatusId = StatusId;
        this.CreateAt = CreateAt;
    }
}