export class TeacherClassResponseDTO{
    ClassId:string;
    TeacherId:string;
    TeacherName:string;
    Subject: string;

    constructor({ClassId,TeacherId,TeacherName,Subject}:{ClassId:string,TeacherId:string,TeacherName:string, Subject:string}){
        this.ClassId=ClassId;
        this.TeacherId=TeacherId;
        this.TeacherName=TeacherName;
        this.Subject=Subject;
    }
    
    static fromJson (json:any) :TeacherClassResponseDTO {
        return new TeacherClassResponseDTO({
            ClassId:json.ClassId,
            TeacherId:json.TeacherId,
            TeacherName:json.TeacherId,
            Subject:json.Subject
        });
    }
}