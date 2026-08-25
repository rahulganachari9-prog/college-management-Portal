export type UserRole = 'super_admin' | 'admin' | 'hod' | 'faculty' | 'student' | 'placement_officer';

export interface User {
  id: number;
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  departmentId?: number | null;
  phone?: string | null;
  avatarUrl?: string | null;
  status: 'active' | 'inactive';
  createdAt?: string;
}

export interface Department {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  hodId?: number | null;
  building?: string | null;
  contactEmail?: string | null;
}

export interface AcademicYear {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface Semester {
  id: number;
  academicYearId: number;
  name: string;
  semesterNumber: number;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface Course {
  id: number;
  code: string;
  name: string;
  departmentId: number;
  durationYears: number;
  totalSemesters: number;
  degreeType: string;
}

export interface Subject {
  id: number;
  code: string;
  name: string;
  departmentId: number;
  courseId: number;
  semesterNumber: number;
  credits: number;
  type: 'theory' | 'practical' | 'elective';
  facultyId?: number | null;
}

export interface ClassSection {
  id: number;
  name: string;
  courseId: number;
  departmentId: number;
  semesterId: number;
  academicYearId: number;
  section: string;
  roomNumber?: string | null;
  advisorFacultyId?: number | null;
}

export interface Student {
  id: number;
  userId: number;
  studentIdNum: string;
  rollNo: string;
  name: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  departmentId?: number | null;
  courseId?: number | null;
  semesterId?: number | null;
  classId?: number | null;
  admissionYear: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  bloodGroup?: string | null;
  cgpa?: string | null;
  status?: string;
}

export interface FacultyMember {
  id: number;
  userId: number;
  employeeId: string;
  name: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  designation: string;
  departmentId?: number | null;
  qualification?: string | null;
  specialization?: string | null;
  joiningDate?: string | null;
  officeRoom?: string | null;
  status?: string;
}

export interface TimetableSlot {
  id: number;
  classId: number;
  subjectId: number;
  facultyId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomNumber?: string | null;
  subjectName?: string;
  subjectCode?: string;
  facultyName?: string;
  className?: string;
}

export interface AttendanceSession {
  id: number;
  classId: number;
  subjectId: number;
  facultyId: number;
  date: string;
  timeSlot?: string | null;
  topicCovered?: string | null;
  subjectName?: string;
  className?: string;
}

export interface AttendanceRecord {
  id: number;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string | null;
  date: string;
  timeSlot?: string | null;
  topicCovered?: string | null;
  subjectName: string;
  subjectCode: string;
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  subjectId: number;
  classId: number;
  dueDate: string;
  maxMarks: number;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  subjectName?: string;
  subjectCode?: string;
  facultyName?: string;
  createdAt?: string;
}

export interface AssignmentSubmission {
  id: number;
  assignmentId: number;
  studentId: number;
  submissionText?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  submittedAt: string;
  marksObtained?: string | null;
  grade?: string | null;
  feedback?: string | null;
  status: 'submitted' | 'graded' | 'late';
  studentName?: string;
  rollNo?: string;
  studentIdNum?: string;
}

export interface StudyMaterial {
  id: number;
  title: string;
  description?: string | null;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize?: string | null;
  downloadCount: number;
  subjectName?: string;
  subjectCode?: string;
  facultyName?: string;
  createdAt?: string;
}

export interface Examination {
  id: number;
  title: string;
  examType: 'midterm' | 'final' | 'quiz' | 'practical';
  academicYearId?: number | null;
  academicYearName?: string | null;
  semesterId?: number | null;
  semesterName?: string | null;
  departmentId?: number | null;
  departmentName?: string | null;
  departmentCode?: string | null;
  startDate: string;
  endDate: string;
  isPublished: boolean;
  gradingScale: string;
  status?: 'published' | 'pending' | 'ongoing' | 'completed';
  subjectCount?: number;
  subjectNames?: string[];
}

export interface ExamSchedule {
  id: number;
  examId?: number;
  subjectId?: number;
  examDate: string;
  startTime: string;
  endTime: string;
  roomNumber?: string | null;
  maxMarks: number;
  passingMarks: number;
  subjectName: string;
  subjectCode: string;
}

export interface ExamResult {
  id: number;
  examTitle: string;
  examType: string;
  totalMarks: string;
  percentage: string;
  gpa: string;
  cgpa: string;
  overallGrade: string;
  status: 'pass' | 'fail' | 'withheld';
  isPublished: boolean;
  publishedAt?: string | null;
}

export interface GradeCard {
  id: number;
  subjectCode: string;
  subjectName: string;
  credits: number;
  marksObtained: number | string;
  maxMarks: number;
  grade: string;
  gradePoints: string | number;
  semesterId?: number;
  semesterName?: string;
  examTitle?: string;
  examType?: string;
  status?: string;
}

export interface Notice {
  id: number;
  title: string;
  content: string;
  targetRole: string; // 'all' | 'students' | 'faculty' | 'hod' | 'admin'
  departmentId?: number | null; // null or undefined means 'All Departments'
  targetDepartmentIds?: number[] | null;
  departmentName?: string | null;
  departmentCode?: string | null;
  targetDepartmentName?: string | null;
  category?: 'academic' | 'examination' | 'administrative' | 'events' | 'placements' | 'general' | string;
  academicYearId?: number | null;
  academicYearName?: string | null;
  priority: 'normal' | 'important' | 'urgent';
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  isPublished: boolean;
  createdAt: string;
  authorName?: string;
  authorRole?: string;
}

export interface PlacementAnalyticsData {
  overview: {
    totalCompanies: number;
    activeJobOpportunities: number;
    totalApplications: number;
    placedStudents: number;
    totalOffers: number;
    highestPackage: string;
    averagePackage: string;
    placementRate: number; // percentage, e.g. 88.5
  };
  departmentStats: {
    departmentId: number;
    departmentCode: string;
    departmentName: string;
    totalEligible: number;
    placedCount: number;
    placementRate: number;
    averagePackage: string;
    highestPackage: string;
  }[];
  salaryDistribution: {
    tier: string;
    range: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  pipelineFunnel: {
    stage: string;
    count: number;
    description: string;
  }[];
  topRecruiters: {
    id: number;
    name: string;
    industry: string;
    offersCount: number;
    highestPackage: string;
    avgPackage: string;
    roleTypes: string;
  }[];
}

export interface CampusEvent {
  id: number;
  title: string;
  description: string;
  eventType: string;
  venue: string;
  startDate: string;
  endDate: string;
  maxCapacity: number;
  bannerUrl?: string | null;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

export interface Workshop {
  id: number;
  title: string;
  description: string;
  instructor: string;
  venue: string;
  startDate: string;
  endDate: string;
  maxCapacity: number;
  fee: string;
  prerequisite?: string | null;
  materialsUrl?: string | null;
  status: 'upcoming' | 'completed';
}

export interface Certificate {
  id: number;
  certificateNumber: string;
  certificateType: string;
  title?: string;
  type?: string;
  issueDate: string;
  verificationHash: string;
  verificationCode?: string;
  issuingAuthority: string;
  status: string;
  description?: string;
  metadataJson?: string | null;
  studentName?: string;
  studentIdNum?: string;
  studentRollNo?: string;
  departmentCode?: string;
}

export interface Company {
  id: number;
  name: string;
  industry: string;
  website?: string | null;
  logoUrl?: string | null;
  contactPerson?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  description?: string | null;
}

export interface JobOpportunity {
  id: number;
  jobTitle: string;
  jobRole: string;
  jobType: 'full_time' | 'internship' | 'contract';
  salaryPackage: string;
  location: string;
  minCgpa: string;
  eligibleDepartments?: string | null;
  deadline: string;
  description: string;
  requirements?: string | null;
  companyName: string;
  companyIndustry: string;
  companyLogoUrl?: string | null;
  createdAt: string;
}

export interface JobApplication {
  id: number;
  jobOpportunityId: number;
  jobId?: number;
  studentId: number;
  resumeUrl?: string | null;
  resumeName?: string | null;
  status: 'applied' | 'shortlisted' | 'interviewing' | 'offered' | 'rejected' | 'accepted';
  currentStage: string;
  notes?: string | null;
  appliedAt: string;
  jobTitle: string;
  salaryPackage: string;
  companyName: string;
  studentName: string;
  rollNo: string;
  studentCgpa?: string | null;
}

export interface NotificationItem {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: 'assignment' | 'exam' | 'attendance' | 'notice' | 'placement' | 'certificate' | 'general';
  linkUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  userId?: number | null;
  userEmail?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export type TicketCategory =
  | 'academic'
  | 'it_support'
  | 'fee_finance'
  | 'hostel_facility'
  | 'examination'
  | 'placement'
  | 'library'
  | 'other';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface TicketMessage {
  id: number;
  ticketId: number;
  senderId: number;
  senderName: string;
  senderRole: UserRole;
  senderAvatarUrl?: string | null;
  message: string;
  isInternalNote?: boolean;
  createdAt: string;
}

export interface HelpDeskTicket {
  id: number;
  ticketNumber: string;
  userId: number;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  description: string;
  departmentId?: number | null;
  departmentName?: string | null;
  assignedToId?: number | null;
  assignedToName?: string | null;
  adminResponse?: string | null;
  submitterName: string;
  submitterEmail: string;
  submitterRole: UserRole;
  submitterIdentifier?: string | null;
  contactPhone?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  messages?: TicketMessage[];
}

export interface HelpDeskStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  urgent: number;
  avgResolutionHours: number;
}
