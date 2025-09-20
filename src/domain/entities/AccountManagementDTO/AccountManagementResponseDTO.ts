export class AccountManagementResponseDTO {
  UserName: string;
  FullName: string;
  Email: string;
  ParentEmail: string;
  GroupId: string;
  GroupName: string;
  CreatedAt: string;
  ClassId: string;
  ClassName:string;

  constructor({
    UserName,
    FullName,
    Email,
    ParentEmail,
    GroupId,
    GroupName,
    CreatedAt,
    ClassId,
    ClassName
  }: {
    UserName: string;
    FullName: string;
    Email: string;
    ParentEmail: string;
    GroupId: string;
    GroupName: string;
    CreatedAt: string;
    ClassId:string;
    ClassName:string;
  }) {
    this.UserName = UserName;
    this.FullName = FullName;
    this.Email = Email;
    this.ParentEmail = ParentEmail;
    this.GroupId = GroupId;
    this.GroupName = GroupName;
    this.CreatedAt = CreatedAt;
    this.ClassId = ClassId;
    this.ClassName = ClassName;
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
      ClassId:json.ClassId ?? "",
      ClassName:json.ClassName ?? ""
    });
  }
}
