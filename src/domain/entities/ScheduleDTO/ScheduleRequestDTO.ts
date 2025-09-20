export class ScheduleRequestDTO {
  ScheduleId: number;
  StudentId?: string;
  ClassId?: string;
  TeacherId?: string;
  Subject?: string;
  DayOfWeek?: number;
  StartTime?: string;   // có thể giữ string ISO, ví dụ "08:30"
  EndTime?: string;
  StatusId?: number;
  CreatedAt?: string;   // ISO date string
  UpdatedAt?: string;

  constructor({ScheduleId, StudentId, ClassId, TeacherId, Subject, DayOfWeek, StartTime, EndTime, StatusId, CreatedAt, UpdatedAt}: {ScheduleId: number; StudentId?: string; ClassId?: string; TeacherId?: string; Subject?: string; DayOfWeek?: number; StartTime?: string; EndTime?: string; StatusId?: number; CreatedAt?: string; UpdatedAt?: string}) {
    this.ScheduleId = ScheduleId;
    this.StudentId = StudentId;
    this.ClassId = ClassId;
    this.TeacherId = TeacherId;
    this.Subject = Subject;
    this.DayOfWeek = DayOfWeek;
    this.StartTime = StartTime;
    this.EndTime = EndTime;
    this.StatusId = StatusId;
    this.CreatedAt = CreatedAt;
    this.UpdatedAt = UpdatedAt;
  }
}
