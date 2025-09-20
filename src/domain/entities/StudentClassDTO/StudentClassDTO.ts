export class StudentClassResponseDTO{
    ClassId:string;
    StudentId:string;
    StudentName:string;
    StudyStatus: number;

    constructor({ClassId,StudentId,StudentName,StudyStatus}:{ClassId:string,StudentId:string,StudentName:string, StudyStatus:number}){
        this.ClassId=ClassId;
        this.StudentId=StudentId;
        this.StudentName=StudentName;
        this.StudyStatus=StudyStatus;
    }

    static fromJson(json:any) :StudentClassResponseDTO{
        return new StudentClassResponseDTO({
            ClassId: json.ClassId,
            StudentId: json.StudentId,
            StudentName: json.StudyName,
            StudyStatus: json.StudyStatus
        });
    }
    
}