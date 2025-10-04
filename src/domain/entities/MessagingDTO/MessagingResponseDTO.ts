export class  MessagingResponseDTO{
    MessageId: number;
    SenderId: string;
    SenderName: string;
    ReceiverId: string;
    ReceiverName: string;
    Content: string;
    IsRead: boolean;
    CreatedAt: string;

    constructor ({
        MessageId,
        SenderId,
        SenderName,
        ReceiverId,
        ReceiverName,
        Content,
        IsRead,
        CreatedAt
    }:{
        MessageId: number,
        SenderId: string,
        SenderName: string,
        ReceiverId: string,
        ReceiverName: string,
        Content: string,
        IsRead: boolean,
        CreatedAt: string
    }){
        this.MessageId= MessageId;
        this.SenderId= SenderId;
        this.SenderName = SenderName;
        this.ReceiverId = ReceiverId;
        this.ReceiverName = ReceiverName;
        this.Content = Content;
        this.IsRead = IsRead;
        this.CreatedAt = CreatedAt;
    }

    static fromJson(json:any):MessagingResponseDTO{
        return new MessagingResponseDTO({
            MessageId : json.MessageId,
            SenderId : json.SenderId,
            SenderName : json.SenderName,
            ReceiverId: json.ReceiverId,
            ReceiverName: json.ReceiverName,
            Content: json.Content,
            IsRead : json.IsRead,
            CreatedAt : json.CreatedAt
        })
    }
}