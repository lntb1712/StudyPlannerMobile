export class TaskManagementRequestDTO{
    TaskId:number;
    StudentId:string;
    Title: string;
    Description: string;
    DueDate: string;
    StatusId: number;

    constructor ({
        TaskId,
        StudentId,
        Title, 
        Description,
        DueDate,
        StatusId,
    }:{
        TaskId:number,
        StudentId: string,
        Title: string,
        Description: string,
        DueDate: string,
        StatusId: number,
    }){
        this.TaskId = TaskId;
        this.StudentId=  StudentId;
        this.Title = Title;
        this.Description = Description;
        this.DueDate= DueDate;
        this.StatusId = StatusId;
    }
}