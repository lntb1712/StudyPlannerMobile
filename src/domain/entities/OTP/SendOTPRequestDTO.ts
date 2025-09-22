// File: src/domain/entities/OTP/SendOTPRequestDTO.ts
export class SendOTPRequestDTO {
  Email: string;

  constructor(data: { Email: string }) {
    this.Email = data.Email;
  }

  static fromJson(json: any): SendOTPRequestDTO {
    return new SendOTPRequestDTO({
      Email: json.Email || '',
    });
  }
}