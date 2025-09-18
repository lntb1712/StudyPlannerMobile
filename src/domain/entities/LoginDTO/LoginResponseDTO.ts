export class LoginResponseDTO {
  token: string;
  username: string;
  groupId: string; // hoặc number nếu server trả number

  constructor({ token, username, groupId }: { token: string; username: string; groupId: string }) {
    this.token = token;
    this.username = username;
    this.groupId = groupId;
  }

  static fromJson(json:any): LoginResponseDTO {
    return new LoginResponseDTO({
      token: json.Token,
      username: json.Username,
      groupId: json.GroupId
    });
  }
}
