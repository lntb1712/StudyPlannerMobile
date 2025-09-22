// File: src/domain/entities/RegisterDTO/RegisterParentRequestDTO.ts
export class RegisterParentRequestDTO {
  Email: string;
  FullName: string;
  Password: string;
  ConfirmPassword: string;

  constructor(data: { Email: string; FullName: string; Password: string; ConfirmPassword: string }) {
    this.Email = data.Email;
    this.FullName = data.FullName;
    this.Password = data.Password;
    this.ConfirmPassword = data.ConfirmPassword;
  }

  static fromJson(json: any): RegisterParentRequestDTO {
    return new RegisterParentRequestDTO({
      Email: json.Email || '',
      FullName: json.FullName || '',
      Password: json.Password || '',
      ConfirmPassword: json.ConfirmPassword || '',
    });
  }
}