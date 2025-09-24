export class ReminderResponseDTO {
  ReminderId: number;
  ParentId: string;
  ParentFullName: string;
  StudentId: string;
  StudentFullName: string;
  Content: string;
  DueDate: string;
  StatusId: number;
  StatusName: string;
  CreateAt: string;

  constructor({
    ReminderId,
    ParentId,
    ParentFullName,
    StudentId,
    StudentFullName,
    Content,
    DueDate,
    StatusId,
    StatusName,
    CreateAt,
  }: {
    ReminderId: number;
    ParentId: string;
    ParentFullName: string;
    StudentId: string;
    StudentFullName: string;
    Content: string;
    DueDate: string;
    StatusId: number;
    StatusName: string;
    CreateAt: string;
  }) {
    this.ReminderId = ReminderId;
    this.ParentId = ParentId;
    this.ParentFullName = ParentFullName;
    this.StudentId = StudentId;
    this.StudentFullName = StudentFullName;
    this.Content = Content;
    this.DueDate = DueDate;
    this.StatusId = StatusId;
    this.StatusName = StatusName;
    this.CreateAt = CreateAt;
  }
  static fromJson(json: any): ReminderResponseDTO {
    return new ReminderResponseDTO({
      ReminderId: json.ReminderId || 0,
      ParentId: json.ParentId || "",
      ParentFullName: json.ParentFullName || "",
      StudentId: json.StudentId || "",
      StudentFullName: json.StudentFullName || "",
      Content: json.Content || "",
      DueDate: json.DueDate || "",
      StatusId: json.StatusId || 0,
      StatusName: json.StatusName || "",
      CreateAt: json.CreatedAt || "", // Fix: Map từ "CreatedAt" (API) sang "CreateAt" (DTO)
    });
  }
}
