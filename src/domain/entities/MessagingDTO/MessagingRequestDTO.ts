export class  MessagingRequestDTO{
    MessageId: number;
    SenderId: string;
    ReceiverId: string;
    Content: string;
    IsRead: boolean;

    constructor ({
        MessageId,
        SenderId,
        ReceiverId,
        Content,
        IsRead,
    }:{
        MessageId: number,
        SenderId: string,
        ReceiverId: string,
        Content: string,
        IsRead: boolean
    }){
        this.MessageId= MessageId;
        this.SenderId= SenderId;
        this.ReceiverId = ReceiverId;
        this.Content = Content;
        this.IsRead = IsRead;
    }
}