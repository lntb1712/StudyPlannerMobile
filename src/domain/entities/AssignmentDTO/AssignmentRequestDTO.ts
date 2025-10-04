export class AssignmentRequestDTO{
    AssignmentId: number;
    ClassId: string;
    TeacherId: string;
    Title: string;
    Description: string;
    Deadline: string;
    CreatedAt: string;

    constructor({ AssignmentId, ClassId, TeacherId, Title, Description, Deadline, CreatedAt}:
        {AssignmentId:number,ClassId:string, TeacherId:string, Title:string, Description:string, Deadline:string,CreatedAt:string}){
            this.AssignmentId = AssignmentId;
            this.ClassId= ClassId;
            this.TeacherId = TeacherId;
            this.Title = Title;
            this.Description = Description;
            this.Deadline = Deadline;
            this.CreatedAt = CreatedAt;
        }
}
