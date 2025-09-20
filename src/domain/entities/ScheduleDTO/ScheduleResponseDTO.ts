export class ScheduleResponseDTO {
  ScheduleId: number;
  StudentId?: string;
  StudentName?: string;
  ClassId?: string;
  ClassName?: string;
  TeacherId?: string;
  TeacherName?: string;
  Subject?: string;
  DayOfWeek?: number;
  StartTime?: string;   // có thể giữ string ISO, ví dụ "08:30"
  EndTime?: string;
  StatusId?: number;
  StatusName?: string;
  CreatedAt?: string;   // ISO date string
  UpdatedAt?: string;

  constructor({ScheduleId, StudentId, StudentName, ClassId, ClassName, TeacherId, TeacherName, Subject, DayOfWeek, StartTime, EndTime, StatusId, StatusName, CreatedAt, UpdatedAt}: {ScheduleId: number; StudentId?: string; StudentName?: string; ClassId?: string; ClassName?: string; TeacherId?: string; TeacherName?: string; Subject?: string; DayOfWeek?: number; StartTime?: string; EndTime?: string; StatusId?: number; StatusName?: string; CreatedAt?: string; UpdatedAt?: string}) {
    this.ScheduleId = ScheduleId;
    this.StudentId = StudentId;
    this.StudentName = StudentName;
    this.ClassId = ClassId;
    this.ClassName = ClassName;
    this.TeacherId = TeacherId;
    this.TeacherName = TeacherName;
    this.Subject = Subject;
    this.DayOfWeek = DayOfWeek;
    this.StartTime = StartTime;
    this.EndTime = EndTime;
    this.StatusId = StatusId;
    this.StatusName = StatusName;
    this.CreatedAt = CreatedAt;
    this.UpdatedAt = UpdatedAt;
    }

    static fromJson(json: any): ScheduleResponseDTO {
        return new ScheduleResponseDTO({
            ScheduleId: json.ScheduleId,
            StudentId: json.StudentId,
            StudentName: json.StudentName,
            ClassId: json.ClassId,
            ClassName: json.ClassName,
            TeacherId: json.TeacherId,
            TeacherName: json.TeacherName,
            Subject: json.Subject,
            DayOfWeek: json.DayOfWeek,
            StartTime: json.StartTime,
            EndTime: json.EndTime,
            StatusId: json.StatusId,    
            StatusName: json.StatusName,
            CreatedAt: json.CreatedAt,
            UpdatedAt: json.UpdatedAt,
        });
    }
}
