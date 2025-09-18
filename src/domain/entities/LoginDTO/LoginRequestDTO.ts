export class LoginRequestDTO {
    Username: string;
    Password: string;

    constructor({ Username, Password }: { Username: string; Password: string }) {
        this.Username = Username;
        this.Password = Password;
    }
}
