export class TaskManagementResponseDTO{
    TaskId:number;
    StudentId:string;
    StudentName: string;
    Title: string;
    Description: string;
    DueDate: string;
    StatusId: number;
    StatusName: string;
    CreatedAt : string;
    UpdatedAt: string;

    constructor ({
        TaskId,
        StudentId,
        StudentName,
        Title, 
        Description,
        DueDate,
        StatusId,
        StatusName,
        CreatedAt,
        UpdatedAt
    }:{
        TaskId:number,
        StudentId: string,
        StudentName: string,
        Title: string,
        Description: string,
        DueDate: string,
        StatusId: number,
        StatusName: string,
        CreatedAt: string,
        UpdatedAt: string
    }){
        this.TaskId = TaskId;
        this.StudentId=  StudentId;
        this.StudentName=StudentName;
        this.Title = Title;
        this.Description = Description;
        this.DueDate= DueDate;
        this.StatusId = StatusId;
        this.StatusName = StatusName;
        this.CreatedAt = CreatedAt;
        this.UpdatedAt= UpdatedAt;
    }
    static fromJson (json:any):TaskManagementResponseDTO{
        return new TaskManagementResponseDTO({
            TaskId: json.TaskId,
            StudentId: json.StudentId,
            StudentName: json.StudentName,
            Title: json.Title,
            Description: json.Description,
            DueDate: json.DueDate,
            StatusId: json.StatusId,
            StatusName: json.StatusName,
            CreatedAt: json.CreatedAt,
            UpdatedAt: json.UpdatedAt,
        });
    }
}