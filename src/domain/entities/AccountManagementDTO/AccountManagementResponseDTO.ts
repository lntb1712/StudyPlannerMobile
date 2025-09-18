export class AccountManagementResponseDTO {
  UserName: string;
  FullName: string;
  Email: string;
  ParentEmail: string;
  GroupId: string;
  GroupName: string;
  CreatedAt: string;

  constructor({
    UserName,
    FullName,
    Email,
    ParentEmail,
    GroupId,
    GroupName,
    CreatedAt,
  }: {
    UserName: string;
    FullName: string;
    Email: string;
    ParentEmail: string;
    GroupId: string;
    GroupName: string;
    CreatedAt: string;
  }) {
    this.UserName = UserName;
    this.FullName = FullName;
    this.Email = Email;
    this.ParentEmail = ParentEmail;
    this.GroupId = GroupId;
    this.GroupName = GroupName;
    this.CreatedAt = CreatedAt;
  }

  static fromJson(json: any): AccountManagementResponseDTO {
    return new AccountManagementResponseDTO({
      UserName: json.UserName,
      FullName: json.FullName,
      Email: json.Email,
      ParentEmail: json.ParentEmail,
      GroupId: json.GroupId,
      GroupName: json.GroupName,
      CreatedAt: json.CreatedAt,
    });
  }
}
