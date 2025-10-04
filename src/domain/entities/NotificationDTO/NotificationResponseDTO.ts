import { AssignmentResponseDTO } from "../AssignmentDTO/AssignmentResponseDTO";

export class NotificationResponseDTO {
  NotificationId: number;
  UserName: string;
  FullName: string;
  Title: string;
  Content: string;
  Type: string;
  IsRead: boolean;
  CreatedAt: string;

  constructor({
    NotificationId,
    UserName,
    FullName,
    Title,
    Content,
    Type,
    IsRead,
    CreatedAt,
  }: {
    NotificationId: number;
    UserName: string;
    FullName: string;
    Title: string;
    Content: string;
    Type: string;
    IsRead: boolean;
    CreatedAt:string;
  }) {
    this.NotificationId = NotificationId;
    this.UserName = UserName;
    this.FullName =FullName;
    this.Title = Title;
    this.Content = Content;
    this.Type = Type;
    this.IsRead = IsRead;
    this.CreatedAt = CreatedAt;
  }

  static fromJson(json:any):NotificationResponseDTO{
    return new NotificationResponseDTO({
        NotificationId: json.NotificationId,
        UserName : json.UserName,
        FullName: json.FullName,
        Title: json.Title,
        Content: json.Content,
        Type: json.Type,
        IsRead: json.IsRead,
        CreatedAt : json.CreatedAt,
    });
  }
}
