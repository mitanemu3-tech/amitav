export type UserRole = 'HM' | 'AHM' | 'AT';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  teacherId?: string;
  photoURL?: string;
}

export type TeacherStatus = 'Active' | 'Inactive' | 'On Leave' | 'Retired';

export interface Teacher {
  id: string;
  teacherId: string;
  name: string;
  designation: string; // e.g., 'Headmaster', 'Assistant Headmaster', 'Assistant Teacher'
  employeeCode: string;
  mobile: string;
  email: string;
  subjects: string[]; // e.g., ['Bengali', 'Sanskrit']
  eligibleClasses: string[]; // e.g., ['Class IX', 'Class X', 'Class XI', 'Class XII']
  assignedClasses?: string[];
  dateOfJoining: string;
  status: TeacherStatus;
  role: UserRole;
  active: boolean;
  avatarColor?: string;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface PeriodSchedule {
  periodNumber: number;
  name: string;
  startTime: string; // e.g. "10:50 AM"
  endTime: string;   // e.g. "11:30 AM"
  isBreak?: boolean;
}

export interface PermanentRoutineEntry {
  id: string;
  day: DayOfWeek;
  periodNumber: number;
  classId: string;        // e.g., 'Class V', 'Class XI'
  sectionOrStream: string; // 'Section A', 'Section B', 'Science', 'Arts'
  subject: string;
  teacherId: string;
  teacherName: string;
  room: string;
  academicSession: string;
  remarks?: string;
}

export type ArrangementType =
  | 'Substitute teacher'
  | 'Temporary merging of classes'
  | 'Period shifted to another time'
  | 'Room changed'
  | 'Class cancelled'
  | 'Joint teaching'
  | 'Special class'
  | 'Free period'
  | 'Other';

export type ArrangementStatus = 'Draft' | 'Published' | 'Updated' | 'Cancelled' | 'Completed';

export interface ProvisionalArrangement {
  id: string;
  date: string; // YYYY-MM-DD
  periodNumber: number;
  classId: string;
  sectionOrStream: string;
  originalTeacherId: string;
  originalTeacherName: string;
  replacementTeacherId?: string;
  replacementTeacherName?: string;
  temporaryRoom?: string;
  arrangementType: ArrangementType;
  instructions: string;
  reason: string;
  status: ArrangementStatus;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  publishedAt?: string;
  affectedTeacherIds: string[];
  affectedClassIds: string[];
}

export interface MergedClass {
  id: string;
  date: string;
  periodNumber: number;
  classesAndSections: string[]; // e.g. ['Class V - Section A', 'Class V - Section B']
  subject: string;
  teacherId: string;
  teacherName: string;
  classroom: string;
  reason: string;
  instructions: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  createdBy: string;
  createdAt: string;
}

export type AttendanceStatus =
  | 'Present'
  | 'Absent'
  | 'Approved Leave'
  | 'Official Duty'
  | 'Late Arrival'
  | 'Half Day';

export interface AttendanceRecord {
  id: string;
  date: string;
  teacherId: string;
  teacherName: string;
  employeeCode: string;
  status: AttendanceStatus;
  timeIn?: string;
  remarks?: string;
  recordedBy: string;
  updatedAt: string;
}

export type LeaveType =
  | 'Casual Leave'
  | 'Medical Leave'
  | 'Duty Leave'
  | 'Maternity Leave'
  | 'Other';

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Clarification Requested';

export interface LeaveApplication {
  id: string;
  teacherId: string;
  teacherName: string;
  employeeCode: string;
  startDate: string;
  endDate: string;
  leaveType: LeaveType;
  reason: string;
  status: LeaveStatus;
  appliedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewRemarks?: string;
  affectedPeriodsCount?: number;
}

export type MessagePriority = 'Normal' | 'Urgent' | 'Emergency';

export type MessageCategory =
  | 'General notice'
  | 'Urgent instruction'
  | 'Provisional routine'
  | 'Substitute assignment'
  | 'Meeting notice'
  | 'Examination duty'
  | 'Leave decision'
  | 'Emergency announcement';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientType: 'All Teachers' | 'Individual' | 'Subject Group' | 'Class Teachers';
  recipientIds?: string[]; // teacher IDs or specific group tag
  subject: string;
  body: string;
  priority: MessagePriority;
  category: MessageCategory;
  requiresAck: boolean;
  createdAt: string;
  attachments?: string[];
}

export interface MessageAcknowledgement {
  id: string;
  messageId: string;
  teacherId: string;
  teacherName: string;
  readAt: string;
  acknowledgedAt?: string;
  note?: string;
}

export interface SchoolNotice {
  id: string;
  title: string;
  content: string;
  priority: 'Low' | 'Normal' | 'High';
  targetAudience: string;
  publishedBy: string;
  publishedAt: string;
  validUntil?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  details: string;
  timestamp: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  divisions: string[]; // ['Section A', 'Section B'] or ['Science', 'Arts']
}
