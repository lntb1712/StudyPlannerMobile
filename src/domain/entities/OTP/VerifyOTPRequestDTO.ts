// File: src/domain/entities/OTP/VerifyOTPRequestDTO.ts
export class VerifyOTPRequestDTO {
  Email: string;
  OTP: string;

  constructor(data: { Email: string; OTP: string }) {
    this.Email = data.Email;
    this.OTP = data.OTP;
  }

  static fromJson(json: any): VerifyOTPRequestDTO {
    return new VerifyOTPRequestDTO({
      Email: json.Email || '',
      OTP: json.OTP || '',
    });
  }
}