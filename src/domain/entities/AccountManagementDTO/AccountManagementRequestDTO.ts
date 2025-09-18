export class AccountManagementRequestDTO {
    UserName: string;
    Password: string;
    FullName: string;
    Email: string;
    ParentEmail: string;
    GroupId: string;

    constructor({ UserName, Password, FullName, Email, ParentEmail, GroupId }: { UserName: string; Password: string; FullName: string; Email: string; ParentEmail: string; GroupId: string }) {
        this.UserName = UserName;
        this.Password = Password;
        this.FullName = FullName;
        this.Email = Email;
        this.ParentEmail = ParentEmail;
        this.GroupId = GroupId;
    }

}
