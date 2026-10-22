import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import {
  Teacher,
  PermanentRoutineEntry,
  ProvisionalArrangement,
  MergedClass,
  Message,
  MessageAcknowledgement,
  AttendanceRecord,
  LeaveApplication,
  SchoolNotice,
  PeriodSchedule,
  AuditLog,
  DayOfWeek,
} from '../types';
import {
  DEFAULT_PERIOD_SCHEDULE,
  INITIAL_TEACHERS,
  INITIAL_PERMANENT_ROUTINES,
  INITIAL_PROVISIONAL_ARRANGEMENTS,
  INITIAL_MERGED_CLASSES,
  INITIAL_MESSAGES,
  INITIAL_ATTENDANCE,
  INITIAL_LEAVES,
  INITIAL_NOTICES,
  getTodayDateString,
} from '../data/seedData';

// Local storage keys for instant zero-latency caching & fallback
const STORAGE_PREFIX = 'nbgn_school_';

function getLocal<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(STORAGE_PREFIX + key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error('LocalStorage write error:', err);
  }
}

class SchoolService {
  private teachers: Teacher[] = getLocal('teachers', INITIAL_TEACHERS);
  private permanentRoutines: PermanentRoutineEntry[] = getLocal('permanentRoutines', INITIAL_PERMANENT_ROUTINES);
  private provisionalArrangements: ProvisionalArrangement[] = getLocal('provisionalArrangements', INITIAL_PROVISIONAL_ARRANGEMENTS);
  private mergedClasses: MergedClass[] = getLocal('mergedClasses', INITIAL_MERGED_CLASSES);
  private messages: Message[] = getLocal('messages', INITIAL_MESSAGES);
  private acknowledgements: MessageAcknowledgement[] = getLocal('acknowledgements', []);
  private attendance: AttendanceRecord[] = getLocal('attendance', INITIAL_ATTENDANCE);
  private leaves: LeaveApplication[] = getLocal('leaves', INITIAL_LEAVES);
  private notices: SchoolNotice[] = getLocal('notices', INITIAL_NOTICES);
  private schedule: PeriodSchedule[] = getLocal('schedule', DEFAULT_PERIOD_SCHEDULE);
  private auditLogs: AuditLog[] = getLocal('auditLogs', [
    {
      id: 'LOG-01',
      action: 'SYSTEM_BOOT',
      performedBy: 'System Administrator',
      details: 'School Management System initialized for academic session 2026-2027.',
      timestamp: new Date().toISOString(),
    },
  ]);

  private listeners: (() => void)[] = [];
  public isFirestoreConnected = false;

  constructor() {
    this.initFirestoreSync();
  }

  // Subscribe to changes
  public subscribe(callback: () => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.error(e);
      }
    });
  }

  // Sync with Firestore
  private async initFirestoreSync() {
    try {
      // Teachers sync
      onSnapshot(collection(db, 'teachers'), (snapshot) => {
        if (!snapshot.empty) {
          const list: Teacher[] = [];
          snapshot.forEach((doc) => list.push(doc.data() as Teacher));
          this.teachers = list;
          setLocal('teachers', list);
          this.isFirestoreConnected = true;
          this.notify();
        } else {
          // Seed initial teachers if empty in firestore
          this.seedInitialTeachers();
        }
      }, (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, 'teachers');
        } catch (e) {
          console.warn('Firestore teachers sync using local cache:', e);
        }
      });

      // Provisional Arrangements sync
      onSnapshot(collection(db, 'provisionalArrangements'), (snapshot) => {
        if (!snapshot.empty) {
          const list: ProvisionalArrangement[] = [];
          snapshot.forEach((doc) => list.push(doc.data() as ProvisionalArrangement));
          this.provisionalArrangements = list;
          setLocal('provisionalArrangements', list);
          this.notify();
        }
      }, (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, 'provisionalArrangements');
        } catch (e) {
          console.warn('Firestore provisionalArrangements sync using local cache:', e);
        }
      });

      // Permanent Routines sync
      onSnapshot(collection(db, 'permanentRoutines'), (snapshot) => {
        if (!snapshot.empty) {
          const list: PermanentRoutineEntry[] = [];
          snapshot.forEach((doc) => list.push(doc.data() as PermanentRoutineEntry));
          this.permanentRoutines = list;
          setLocal('permanentRoutines', list);
          this.notify();
        }
      }, (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, 'permanentRoutines');
        } catch (e) {
          console.warn('Firestore permanentRoutines sync using local cache:', e);
        }
      });

      // Messages sync
      onSnapshot(collection(db, 'messages'), (snapshot) => {
        if (!snapshot.empty) {
          const list: Message[] = [];
          snapshot.forEach((doc) => list.push(doc.data() as Message));
          this.messages = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setLocal('messages', this.messages);
          this.notify();
        }
      }, (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, 'messages');
        } catch (e) {
          console.warn('Firestore messages sync using local cache:', e);
        }
      });

      // Acknowledgements sync
      onSnapshot(collection(db, 'messageAcknowledgements'), (snapshot) => {
        if (!snapshot.empty) {
          const list: MessageAcknowledgement[] = [];
          snapshot.forEach((doc) => list.push(doc.data() as MessageAcknowledgement));
          this.acknowledgements = list;
          setLocal('acknowledgements', list);
          this.notify();
        }
      }, (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, 'messageAcknowledgements');
        } catch (e) {
          console.warn('Firestore messageAcknowledgements sync using local cache:', e);
        }
      });

      // Attendance sync
      onSnapshot(collection(db, 'attendance'), (snapshot) => {
        if (!snapshot.empty) {
          const list: AttendanceRecord[] = [];
          snapshot.forEach((doc) => list.push(doc.data() as AttendanceRecord));
          this.attendance = list;
          setLocal('attendance', list);
          this.notify();
        }
      }, (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, 'attendance');
        } catch (e) {
          console.warn('Firestore attendance sync using local cache:', e);
        }
      });

      // Leaves sync
      onSnapshot(collection(db, 'leaveApplications'), (snapshot) => {
        if (!snapshot.empty) {
          const list: LeaveApplication[] = [];
          snapshot.forEach((doc) => list.push(doc.data() as LeaveApplication));
          this.leaves = list.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
          setLocal('leaves', this.leaves);
          this.notify();
        }
      }, (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, 'leaveApplications');
        } catch (e) {
          console.warn('Firestore leaveApplications sync using local cache:', e);
        }
      });
    } catch (e) {
      console.warn('Firestore initial sync notice: using resilient offline-first store', e);
    }
  }

  private async seedInitialTeachers() {
    try {
      for (const t of INITIAL_TEACHERS) {
        await setDoc(doc(db, 'teachers', t.teacherId), t);
      }
      for (const r of INITIAL_PERMANENT_ROUTINES) {
        await setDoc(doc(db, 'permanentRoutines', r.id), r);
      }
      for (const pa of INITIAL_PROVISIONAL_ARRANGEMENTS) {
        await setDoc(doc(db, 'provisionalArrangements', pa.id), pa);
      }
    } catch {
      // offline or write restricted before login
    }
  }

  // --- GETTERS ---
  public getTeachers() {
    return this.teachers;
  }

  public getTeacherById(id: string) {
    return this.teachers.find((t) => t.id === id || t.teacherId === id);
  }

  public getPermanentRoutines() {
    return this.permanentRoutines;
  }

  public getProvisionalArrangements() {
    return this.provisionalArrangements;
  }

  public getMergedClasses() {
    return this.mergedClasses;
  }

  public getMessages() {
    return this.messages;
  }

  public getAcknowledgements() {
    return this.acknowledgements;
  }

  public getAttendance() {
    return this.attendance;
  }

  public getLeaves() {
    return this.leaves;
  }

  public getNotices() {
    return this.notices;
  }

  public getSchedule() {
    return this.schedule;
  }

  public getAuditLogs() {
    return this.auditLogs;
  }

  // --- CONFLICT DETECTION ---
  public checkRoutineConflict(entry: {
    id?: string;
    day: DayOfWeek;
    periodNumber: number;
    classId: string;
    sectionOrStream: string;
    teacherId: string;
    room: string;
  }): { hasConflict: boolean; message?: string } {
    const existing = this.permanentRoutines.filter((r) => r.id !== entry.id && r.day === entry.day && r.periodNumber === entry.periodNumber);

    // 1. Teacher double-booking
    const teacherConflict = existing.find((r) => r.teacherId === entry.teacherId);
    if (teacherConflict) {
      const teacher = this.getTeacherById(entry.teacherId);
      return {
        hasConflict: true,
        message: `Teacher ${teacher?.name || entry.teacherId} is already scheduled for ${teacherConflict.classId} (${teacherConflict.sectionOrStream}) during Period ${entry.periodNumber} on ${entry.day}.`,
      };
    }

    // 2. Class & Section double-booking
    const classConflict = existing.find((r) => r.classId === entry.classId && r.sectionOrStream === entry.sectionOrStream);
    if (classConflict) {
      return {
        hasConflict: true,
        message: `${entry.classId} (${entry.sectionOrStream}) already has subject "${classConflict.subject}" with ${classConflict.teacherName} in Period ${entry.periodNumber} on ${entry.day}.`,
      };
    }

    // 3. Room double-booking (excluding grounds/open spaces)
    if (entry.room && !entry.room.toLowerCase().includes('ground') && !entry.room.toLowerCase().includes('open')) {
      const roomConflict = existing.find((r) => r.room.toLowerCase() === entry.room.toLowerCase());
      if (roomConflict) {
        return {
          hasConflict: true,
          message: `Room "${entry.room}" is already booked for ${roomConflict.classId} (${roomConflict.sectionOrStream}) in Period ${entry.periodNumber}.`,
        };
      }
    }

    return { hasConflict: false };
  }

  // --- SMART SUBSTITUTION FINDER ---
  public findAvailableSubstitutes(date: string, periodNumber: number, dayOfWeek: DayOfWeek, preferredSubject?: string): {
    teacher: Teacher;
    isSubjectMatch: boolean;
    isEligibleClass: boolean;
    status: 'Free' | 'Busy';
  }[] {
    // 1. Who is on leave or absent today?
    const absentTeacherIds = new Set(
      this.attendance
        .filter((a) => a.date === date && (a.status === 'Absent' || a.status === 'Approved Leave'))
        .map((a) => a.teacherId)
    );

    // 2. Who is already teaching in permanent routine for this day & period?
    const busyInRoutine = new Set(
      this.permanentRoutines
        .filter((r) => r.day === dayOfWeek && r.periodNumber === periodNumber)
        .map((r) => r.teacherId)
    );

    // 3. Who is already assigned in published provisional routine for this date & period?
    const busyInProvisional = new Set(
      this.provisionalArrangements
        .filter((p) => p.date === date && p.periodNumber === periodNumber && p.status === 'Published' && p.replacementTeacherId)
        .map((p) => p.replacementTeacherId!)
    );

    // Filter active teachers
    return this.teachers
      .filter((t) => t.active && !absentTeacherIds.has(t.teacherId) && !absentTeacherIds.has(t.id))
      .map((teacher) => {
        const isBusy = busyInRoutine.has(teacher.teacherId) || busyInRoutine.has(teacher.id) || busyInProvisional.has(teacher.teacherId) || busyInProvisional.has(teacher.id);
        const isSubjectMatch = preferredSubject
          ? teacher.subjects.some((s) => s.toLowerCase().includes(preferredSubject.toLowerCase()) || preferredSubject.toLowerCase().includes(s.toLowerCase()))
          : false;

        return {
          teacher,
          isSubjectMatch,
          isEligibleClass: true,
          status: isBusy ? ('Busy' as const) : ('Free' as const),
        };
      })
      .sort((a, b) => {
        if (a.status === 'Free' && b.status === 'Busy') return -1;
        if (a.status === 'Busy' && b.status === 'Free') return 1;
        if (a.isSubjectMatch && !b.isSubjectMatch) return -1;
        if (!a.isSubjectMatch && b.isSubjectMatch) return 1;
        return a.teacher.name.localeCompare(b.teacher.name);
      });
  }

  // --- ACTIONS ---

  // Provisional Arrangements (FLAGSHIP FEATURE)
  public async saveProvisionalArrangement(arr: ProvisionalArrangement) {
    const index = this.provisionalArrangements.findIndex((p) => p.id === arr.id);
    if (index >= 0) {
      this.provisionalArrangements[index] = arr;
    } else {
      this.provisionalArrangements.unshift(arr);
    }
    setLocal('provisionalArrangements', this.provisionalArrangements);

    // Add audit log
    this.addAuditLog(
      arr.status === 'Published' ? 'PROVISIONAL_ROUTINE_PUBLISHED' : 'PROVISIONAL_ROUTINE_UPDATED',
      arr.createdByName || arr.createdBy,
      `Arrangement ${arr.id}: ${arr.arrangementType} for ${arr.classId} (${arr.sectionOrStream}) Period ${arr.periodNumber}. Original: ${arr.originalTeacherName}, Replacement: ${arr.replacementTeacherName || 'N/A'}`
    );

    // If arrangement is substitute, send an automated notification to replacement teacher
    if (arr.status === 'Published' && arr.replacementTeacherId && arr.replacementTeacherId !== arr.originalTeacherId) {
      this.sendMessage({
        id: `MSG-SUB-${Date.now()}`,
        senderId: arr.createdBy,
        senderName: arr.createdByName || 'School Headmaster',
        senderRole: 'HM',
        recipientType: 'Individual',
        recipientIds: [arr.replacementTeacherId],
        subject: `PROVISIONAL DUTY: Period ${arr.periodNumber} (${arr.classId} ${arr.sectionOrStream})`,
        body: `You have been assigned as substitute teacher for ${arr.originalTeacherName} on ${arr.date} during Period ${arr.periodNumber} in ${arr.temporaryRoom || 'assigned classroom'}. Instructions: ${arr.instructions || 'Conduct regular class revision.'}`,
        priority: 'Urgent',
        category: 'Provisional routine',
        requiresAck: true,
        createdAt: new Date().toISOString(),
      });
    }

    try {
      await setDoc(doc(db, 'provisionalArrangements', arr.id), arr);
    } catch (e) {
      console.warn('Saved locally (Firestore sync pending):', e);
    }

    this.notify();
  }

  public async updateArrangementStatus(id: string, status: ProvisionalArrangement['status'], updater: string) {
    const item = this.provisionalArrangements.find((p) => p.id === id);
    if (item) {
      item.status = status;
      if (status === 'Published') {
        item.publishedAt = new Date().toISOString();
      }
      setLocal('provisionalArrangements', this.provisionalArrangements);
      this.addAuditLog('ARRANGEMENT_STATUS_CHANGED', updater, `Arrangement ${id} marked as ${status}`);

      try {
        await updateDoc(doc(db, 'provisionalArrangements', id), {
          status,
          publishedAt: item.publishedAt || null,
        });
      } catch (e) {
        console.warn('Updated locally:', e);
      }
      this.notify();
    }
  }

  // Merged Classes
  public async saveMergedClass(merged: MergedClass) {
    const idx = this.mergedClasses.findIndex((m) => m.id === merged.id);
    if (idx >= 0) {
      this.mergedClasses[idx] = merged;
    } else {
      this.mergedClasses.unshift(merged);
    }
    setLocal('mergedClasses', this.mergedClasses);

    // Also mirror to Provisional Arrangements so it displays seamlessly on timetables
    const provisionalId = `PA-MERGE-${merged.id}`;
    const pa: ProvisionalArrangement = {
      id: provisionalId,
      date: merged.date,
      periodNumber: merged.periodNumber,
      classId: merged.classesAndSections.join(' & '),
      sectionOrStream: 'Merged',
      originalTeacherId: merged.teacherId,
      originalTeacherName: merged.teacherName,
      replacementTeacherId: merged.teacherId,
      replacementTeacherName: merged.teacherName,
      temporaryRoom: merged.classroom,
      arrangementType: 'Temporary merging of classes',
      instructions: merged.instructions,
      reason: merged.reason,
      status: 'Published',
      createdBy: merged.createdBy,
      createdByName: merged.createdBy,
      createdAt: merged.createdAt,
      publishedAt: new Date().toISOString(),
      affectedTeacherIds: [merged.teacherId],
      affectedClassIds: merged.classesAndSections,
    };
    await this.saveProvisionalArrangement(pa);

    try {
      await setDoc(doc(db, 'mergedClasses', merged.id), merged);
    } catch (e) {
      console.warn('Local merge saved:', e);
    }
    this.notify();
  }

  // Teacher Master
  public async saveTeacher(teacher: Teacher) {
    const idx = this.teachers.findIndex((t) => t.id === teacher.id || t.teacherId === teacher.teacherId);
    if (idx >= 0) {
      this.teachers[idx] = teacher;
    } else {
      this.teachers.push(teacher);
    }
    setLocal('teachers', this.teachers);
    this.addAuditLog('TEACHER_RECORD_UPDATED', 'HM / Administrator', `Teacher master record ${teacher.name} (${teacher.employeeCode}) saved.`);

    try {
      await setDoc(doc(db, 'teachers', teacher.teacherId || teacher.id), teacher);
    } catch (e) {
      console.warn('Local teacher saved:', e);
    }
    this.notify();
  }

  public async deactivateTeacher(teacherId: string, performer: string) {
    const teacher = this.getTeacherById(teacherId);
    if (teacher) {
      teacher.active = false;
      teacher.status = 'Inactive';
      setLocal('teachers', this.teachers);
      this.addAuditLog('TEACHER_DEACTIVATED', performer, `Teacher ${teacher.name} deactivated (historical records preserved).`);

      try {
        await updateDoc(doc(db, 'teachers', teacherId), { active: false, status: 'Inactive' });
      } catch (e) {
        console.warn('Local deactivate saved:', e);
      }
      this.notify();
    }
  }

  // Permanent Routine
  public async savePermanentRoutine(entry: PermanentRoutineEntry) {
    const conflict = this.checkRoutineConflict(entry);
    if (conflict.hasConflict) {
      throw new Error(conflict.message);
    }

    const idx = this.permanentRoutines.findIndex((r) => r.id === entry.id);
    if (idx >= 0) {
      this.permanentRoutines[idx] = entry;
    } else {
      this.permanentRoutines.push(entry);
    }
    setLocal('permanentRoutines', this.permanentRoutines);
    this.addAuditLog('PERMANENT_ROUTINE_SAVED', 'HM', `Routine entry for ${entry.classId} (${entry.sectionOrStream}) ${entry.day} Period ${entry.periodNumber} saved.`);

    try {
      await setDoc(doc(db, 'permanentRoutines', entry.id), entry);
    } catch (e) {
      console.warn('Local routine saved:', e);
    }
    this.notify();
  }

  public async deletePermanentRoutine(id: string) {
    this.permanentRoutines = this.permanentRoutines.filter((r) => r.id !== id);
    setLocal('permanentRoutines', this.permanentRoutines);
    try {
      await deleteDoc(doc(db, 'permanentRoutines', id));
    } catch (e) {
      console.warn('Local routine deleted:', e);
    }
    this.notify();
  }

  // Messages & Acknowledgements
  public async sendMessage(msg: Message) {
    this.messages.unshift(msg);
    setLocal('messages', this.messages);
    this.addAuditLog('MESSAGE_SENT', msg.senderName, `Message sent: "${msg.subject}" (Priority: ${msg.priority})`);

    try {
      await setDoc(doc(db, 'messages', msg.id), msg);
    } catch (e) {
      console.warn('Local message saved:', e);
    }
    this.notify();
  }

  public async acknowledgeMessage(messageId: string, teacherId: string, teacherName: string, note?: string) {
    const ackId = `ACK-${messageId}-${teacherId}`;
    const ack: MessageAcknowledgement = {
      id: ackId,
      messageId,
      teacherId,
      teacherName,
      readAt: new Date().toISOString(),
      acknowledgedAt: new Date().toISOString(),
      note,
    };
    const idx = this.acknowledgements.findIndex((a) => a.id === ackId);
    if (idx >= 0) {
      this.acknowledgements[idx] = ack;
    } else {
      this.acknowledgements.push(ack);
    }
    setLocal('acknowledgements', this.acknowledgements);

    try {
      await setDoc(doc(db, 'messageAcknowledgements', ackId), ack);
    } catch (e) {
      console.warn('Local ack saved:', e);
    }
    this.notify();
  }

  // Attendance
  public async saveAttendance(records: AttendanceRecord[], recorder: string) {
    records.forEach((rec) => {
      const idx = this.attendance.findIndex((a) => a.date === rec.date && a.teacherId === rec.teacherId);
      if (idx >= 0) {
        this.attendance[idx] = rec;
      } else {
        this.attendance.push(rec);
      }
    });
    setLocal('attendance', this.attendance);
    this.addAuditLog('ATTENDANCE_RECORDED', recorder, `Attendance register updated for date ${records[0]?.date || 'today'}`);

    try {
      for (const r of records) {
        await setDoc(doc(db, 'attendance', `${r.date}_${r.teacherId}`), r);
      }
    } catch (e) {
      console.warn('Local attendance saved:', e);
    }
    this.notify();
  }

  // Leave Applications
  public async submitLeaveApplication(leave: LeaveApplication) {
    this.leaves.unshift(leave);
    setLocal('leaves', this.leaves);
    this.addAuditLog('LEAVE_APPLIED', leave.teacherName, `Leave application submitted from ${leave.startDate} to ${leave.endDate} (${leave.leaveType})`);

    try {
      await setDoc(doc(db, 'leaveApplications', leave.id), leave);
    } catch (e) {
      console.warn('Local leave saved:', e);
    }
    this.notify();
  }

  public async reviewLeaveApplication(id: string, status: LeaveApplication['status'], remarks: string, reviewer: string) {
    const leave = this.leaves.find((l) => l.id === id);
    if (leave) {
      leave.status = status;
      leave.reviewedBy = reviewer;
      leave.reviewedAt = new Date().toISOString();
      leave.reviewRemarks = remarks;
      setLocal('leaves', this.leaves);
      this.addAuditLog('LEAVE_REVIEWED', reviewer, `Leave for ${leave.teacherName} marked as ${status}.`);

      // If approved, automatically update attendance for that teacher on those dates
      if (status === 'Approved') {
        const attRecord: AttendanceRecord = {
          id: `ATT-${leave.startDate}-${leave.teacherId}`,
          date: leave.startDate,
          teacherId: leave.teacherId,
          teacherName: leave.teacherName,
          employeeCode: leave.employeeCode,
          status: 'Approved Leave',
          remarks: `Sanctioned: ${leave.leaveType}`,
          recordedBy: reviewer,
          updatedAt: new Date().toISOString(),
        };
        await this.saveAttendance([attRecord], reviewer);
      }

      // Send decision notice to teacher
      this.sendMessage({
        id: `MSG-LV-${Date.now()}`,
        senderId: 'HM',
        senderName: 'Office of the Headmaster',
        senderRole: 'HM',
        recipientType: 'Individual',
        recipientIds: [leave.teacherId],
        subject: `Leave Application Decision: ${status}`,
        body: `Your application for ${leave.leaveType} (${leave.startDate} to ${leave.endDate}) has been ${status}. Remarks: ${remarks || 'None'}`,
        priority: status === 'Approved' ? 'Normal' : 'Urgent',
        category: 'Leave decision',
        requiresAck: true,
        createdAt: new Date().toISOString(),
      });

      try {
        await updateDoc(doc(db, 'leaveApplications', id), {
          status,
          reviewedBy: reviewer,
          reviewedAt: leave.reviewedAt,
          reviewRemarks: remarks,
        });
      } catch (e) {
        console.warn('Local leave review saved:', e);
      }
      this.notify();
    }
  }

  // School Schedule Timings (HM editable)
  public updateSchedule(newSchedule: PeriodSchedule[], updater: string) {
    this.schedule = newSchedule;
    setLocal('schedule', newSchedule);
    this.addAuditLog('TIMETABLE_PERIODS_UPDATED', updater, 'School daily period timings modified.');
    this.notify();
  }

  // Add audit log
  private addAuditLog(action: string, performedBy: string, details: string) {
    const log: AuditLog = {
      id: `LOG-${Date.now()}`,
      action,
      performedBy,
      details,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    setLocal('auditLogs', this.auditLogs);
  }
}

export const schoolService = new SchoolService();
