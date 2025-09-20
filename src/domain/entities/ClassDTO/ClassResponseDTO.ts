export class ClassResponseDTO{
    ClassId:string;
    ClassName:string;

    constructor({ClassId, ClassName}:{ClassId:string,ClassName:string}){
        this.ClassId=ClassId;
        this.ClassName= ClassName;
    }

    static fromJson(json:any):ClassResponseDTO{
        return new ClassResponseDTO({
            ClassId:json.ClassId,
            ClassName:json.ClassName
        });
    }
}