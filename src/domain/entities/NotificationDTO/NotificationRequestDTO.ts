export class NotificationRequestDTO {
  NotificationId: number;
  UserName: string;
  Title: string;
  Content: string;
  Type: string;
  IsRead: boolean;

  constructor({
    NotificationId,
    UserName,
    Title,
    Content,
    Type,
    IsRead,
  }: {
    NotificationId: number;
    UserName: string;
    Title: string;
    Content: string;
    Type: string;
    IsRead: boolean;
  }) {
    this.NotificationId = NotificationId;
    this.UserName = UserName;
    this.Title = Title;
    this.Content = Content;
    this.Type = Type;
    this.IsRead = IsRead;
  }
}
