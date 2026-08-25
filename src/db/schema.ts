import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// 1. Users
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID or system ID
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull().default('student'), // super_admin, admin, hod, faculty, student, placement_officer
  departmentId: integer('department_id'),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  status: text('status').notNull().default('active'), // active, inactive
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 2. Departments
export const departments = pgTable('departments', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(), // e.g., 'CS', 'ECE', 'ME'
  name: text('name').notNull(),
  description: text('description'),
  hodId: integer('hod_id'), // faculty user id
  building: text('building'),
  contactEmail: text('contact_email'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 3. Academic Years
export const academicYears = pgTable('academic_years', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(), // e.g., '2025-2026'
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  isCurrent: boolean('is_current').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// 4. Semesters
export const semesters = pgTable('semesters', {
  id: serial('id').primaryKey(),
  academicYearId: integer('academic_year_id').references(() => academicYears.id),
  name: text('name').notNull(), // e.g., 'Fall 2025 (Semester 5)'
  semesterNumber: integer('semester_number').notNull(), // 1 to 8
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  isCurrent: boolean('is_current').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// 5. Courses / Programs (e.g. B.Tech Computer Science)
export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(), // e.g., 'BTECH-CS'
  name: text('name').notNull(),
  departmentId: integer('department_id').references(() => departments.id),
  durationYears: integer('duration_years').notNull().default(4),
  totalSemesters: integer('total_semesters').notNull().default(8),
  degreeType: text('degree_type').notNull().default('Undergraduate'), // Undergraduate, Postgraduate, Doctorate
  createdAt: timestamp('created_at').defaultNow(),
});

// 6. Subjects / Modules
export const subjects = pgTable('subjects', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(), // e.g., 'CS301'
  name: text('name').notNull(),
  departmentId: integer('department_id').references(() => departments.id),
  courseId: integer('course_id').references(() => courses.id),
  semesterNumber: integer('semester_number').notNull().default(1),
  credits: integer('credits').notNull().default(3),
  type: text('type').notNull().default('theory'), // theory, practical, elective
  facultyId: integer('faculty_id').references(() => users.id), // Assigned faculty
  createdAt: timestamp('created_at').defaultNow(),
});

// 7. Classes / Sections (e.g., CS-3A)
export const classes = pgTable('classes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(), // e.g., 'CS-Year3-SectionA'
  courseId: integer('course_id').references(() => courses.id),
  departmentId: integer('department_id').references(() => departments.id),
  semesterId: integer('semester_id').references(() => semesters.id),
  academicYearId: integer('academic_year_id').references(() => academicYears.id),
  section: text('section').notNull().default('A'),
  roomNumber: text('room_number'),
  advisorFacultyId: integer('advisor_faculty_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// 8. Students Profile Details
export const students = pgTable('students', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull().unique(),
  studentIdNum: text('student_id_num').notNull().unique(), // e.g., 'STD-2023-0101'
  rollNo: text('roll_no').notNull(),
  departmentId: integer('department_id').references(() => departments.id),
  courseId: integer('course_id').references(() => courses.id),
  semesterId: integer('semester_id').references(() => semesters.id),
  classId: integer('class_id').references(() => classes.id),
  admissionYear: text('admission_year').notNull(),
  dateOfBirth: text('date_of_birth'),
  gender: text('gender'), // Male, Female, Other
  address: text('address'),
  guardianName: text('guardian_name'),
  guardianPhone: text('guardian_phone'),
  bloodGroup: text('blood_group'),
  cgpa: numeric('cgpa', { precision: 4, scale: 2 }).default('0.00'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 9. Faculty Profile Details
export const faculty = pgTable('faculty', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull().unique(),
  employeeId: text('employee_id').notNull().unique(), // e.g., 'EMP-CS-101'
  designation: text('designation').notNull().default('Assistant Professor'), // Professor, Associate Professor, Assistant Professor, Lecturer
  departmentId: integer('department_id').references(() => departments.id),
  qualification: text('qualification'),
  specialization: text('specialization'),
  joiningDate: text('joining_date'),
  officeRoom: text('office_room'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 10. Enrollments
export const enrollments = pgTable('enrollments', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').references(() => students.id).notNull(),
  classId: integer('class_id').references(() => classes.id).notNull(),
  semesterId: integer('semester_id').references(() => semesters.id).notNull(),
  academicYearId: integer('academic_year_id').references(() => academicYears.id).notNull(),
  status: text('status').notNull().default('enrolled'), // enrolled, completed, dropped
  createdAt: timestamp('created_at').defaultNow(),
});

// 11. Timetable
export const timetables = pgTable('timetables', {
  id: serial('id').primaryKey(),
  classId: integer('class_id').references(() => classes.id).notNull(),
  subjectId: integer('subject_id').references(() => subjects.id).notNull(),
  facultyId: integer('faculty_id').references(() => users.id).notNull(),
  dayOfWeek: text('day_of_week').notNull(), // Monday, Tuesday, Wednesday, Thursday, Friday, Saturday
  startTime: text('start_time').notNull(), // e.g., '09:00'
  endTime: text('end_time').notNull(), // e.g., '10:00'
  roomNumber: text('room_number'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 12. Attendance Sessions
export const attendanceSessions = pgTable('attendance_sessions', {
  id: serial('id').primaryKey(),
  classId: integer('class_id').references(() => classes.id).notNull(),
  subjectId: integer('subject_id').references(() => subjects.id).notNull(),
  facultyId: integer('faculty_id').references(() => users.id).notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  timeSlot: text('time_slot'),
  topicCovered: text('topic_covered'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 13. Attendance Records
export const attendanceRecords = pgTable('attendance_records', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => attendanceSessions.id).notNull(),
  studentId: integer('student_id').references(() => students.id).notNull(),
  status: text('status').notNull().default('present'), // present, absent, late, excused
  remarks: text('remarks'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 14. Assignments
export const assignments = pgTable('assignments', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  subjectId: integer('subject_id').references(() => subjects.id).notNull(),
  classId: integer('class_id').references(() => classes.id).notNull(),
  facultyId: integer('faculty_id').references(() => users.id).notNull(),
  dueDate: text('due_date').notNull(),
  maxMarks: integer('max_marks').notNull().default(100),
  attachmentUrl: text('attachment_url'),
  attachmentName: text('attachment_name'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 15. Assignment Submissions
export const assignmentSubmissions = pgTable('assignment_submissions', {
  id: serial('id').primaryKey(),
  assignmentId: integer('assignment_id').references(() => assignments.id).notNull(),
  studentId: integer('student_id').references(() => students.id).notNull(),
  submissionText: text('submission_text'),
  fileUrl: text('file_url'),
  fileName: text('file_name'),
  submittedAt: timestamp('submitted_at').defaultNow(),
  marksObtained: numeric('marks_obtained', { precision: 5, scale: 2 }),
  grade: text('grade'),
  feedback: text('feedback'),
  gradedById: integer('graded_by_id').references(() => users.id),
  gradedAt: timestamp('graded_at'),
  status: text('status').notNull().default('submitted'), // submitted, graded, late
});

// 16. Study Materials
export const studyMaterials = pgTable('study_materials', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  subjectId: integer('subject_id').references(() => subjects.id).notNull(),
  facultyId: integer('faculty_id').references(() => users.id).notNull(),
  fileUrl: text('file_url').notNull(),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull().default('pdf'), // pdf, doc, slides, link
  fileSize: text('file_size'),
  downloadCount: integer('download_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// 17. Examinations
export const examinations = pgTable('examinations', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(), // e.g., 'Mid-Semester Examinations Fall 2025'
  examType: text('exam_type').notNull().default('midterm'), // midterm, final, quiz, practical
  academicYearId: integer('academic_year_id').references(() => academicYears.id),
  semesterId: integer('semester_id').references(() => semesters.id),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  isPublished: boolean('is_published').default(false),
  gradingScale: text('grading_scale').default('standard_10_point'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 18. Exam Schedules
export const examSchedules = pgTable('exam_schedules', {
  id: serial('id').primaryKey(),
  examId: integer('exam_id').references(() => examinations.id).notNull(),
  subjectId: integer('subject_id').references(() => subjects.id).notNull(),
  examDate: text('exam_date').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  roomNumber: text('room_number'),
  maxMarks: integer('max_marks').notNull().default(100),
  passingMarks: integer('passing_marks').notNull().default(40),
  createdAt: timestamp('created_at').defaultNow(),
});

// 19. Student Marks
export const marks = pgTable('marks', {
  id: serial('id').primaryKey(),
  examScheduleId: integer('exam_schedule_id').references(() => examSchedules.id).notNull(),
  studentId: integer('student_id').references(() => students.id).notNull(),
  marksObtained: numeric('marks_obtained', { precision: 5, scale: 2 }).notNull(),
  isAbsent: boolean('is_absent').default(false),
  remarks: text('remarks'),
  enteredById: integer('entered_by_id').references(() => users.id),
  enteredAt: timestamp('entered_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 20. Exam Results Summary
export const examResults = pgTable('exam_results', {
  id: serial('id').primaryKey(),
  examId: integer('exam_id').references(() => examinations.id).notNull(),
  studentId: integer('student_id').references(() => students.id).notNull(),
  totalMarks: numeric('total_marks', { precision: 6, scale: 2 }).notNull(),
  percentage: numeric('percentage', { precision: 5, scale: 2 }).notNull(),
  gpa: numeric('gpa', { precision: 4, scale: 2 }).notNull(),
  cgpa: numeric('cgpa', { precision: 4, scale: 2 }).notNull(),
  overallGrade: text('overall_grade').notNull(),
  status: text('status').notNull().default('pass'), // pass, fail, withheld
  isPublished: boolean('is_published').default(false),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 21. Notices & Announcements
export const notices = pgTable('notices', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  targetRole: text('target_role').notNull().default('all'), // all, students, faculty, hod, admin
  departmentId: integer('department_id').references(() => departments.id),
  priority: text('priority').notNull().default('normal'), // normal, important, urgent
  attachmentUrl: text('attachment_url'),
  attachmentName: text('attachment_name'),
  isPublished: boolean('is_published').default(true),
  authorId: integer('author_id').references(() => users.id).notNull(),
  expiresAt: text('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 22. Events
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  eventType: text('event_type').notNull().default('academic'), // cultural, sports, academic, seminar, other
  venue: text('venue').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  maxCapacity: integer('max_capacity').default(100),
  bannerUrl: text('banner_url'),
  organizerId: integer('organizer_id').references(() => users.id),
  status: text('status').notNull().default('upcoming'), // upcoming, ongoing, completed, cancelled
  createdAt: timestamp('created_at').defaultNow(),
});

// 23. Event Registrations
export const eventRegistrations = pgTable('event_registrations', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').references(() => events.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  attended: boolean('attended').default(false),
  registeredAt: timestamp('registered_at').defaultNow(),
});

// 24. Workshops
export const workshops = pgTable('workshops', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  instructor: text('instructor').notNull(),
  venue: text('venue').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  maxCapacity: integer('max_capacity').default(50),
  fee: numeric('fee', { precision: 8, scale: 2 }).default('0.00'),
  prerequisite: text('prerequisite'),
  materialsUrl: text('materials_url'),
  organizerId: integer('organizer_id').references(() => users.id),
  status: text('status').notNull().default('upcoming'), // upcoming, completed
  createdAt: timestamp('created_at').defaultNow(),
});

// 25. Workshop Registrations
export const workshopRegistrations = pgTable('workshop_registrations', {
  id: serial('id').primaryKey(),
  workshopId: integer('workshop_id').references(() => workshops.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  status: text('status').notNull().default('confirmed'), // confirmed, pending, cancelled
  attended: boolean('attended').default(false),
  certificateIssued: boolean('certificate_issued').default(false),
  registeredAt: timestamp('registered_at').defaultNow(),
});

// 26. Certificates
export const certificates = pgTable('certificates', {
  id: serial('id').primaryKey(),
  certificateNumber: text('certificate_number').notNull().unique(), // e.g., 'CERT-2025-88219'
  title: text('title').notNull(),
  type: text('type').notNull().default('event'), // course_completion, event, workshop, merit, placement
  studentId: integer('student_id').references(() => students.id).notNull(),
  issueDate: text('issue_date').notNull(),
  verificationCode: text('verification_code').notNull().unique(),
  description: text('description').notNull(),
  issuedById: integer('issued_by_id').references(() => users.id).notNull(),
  metadataJson: text('metadata_json'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 27. Companies (Placements)
export const companies = pgTable('companies', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  industry: text('industry').notNull(),
  website: text('website'),
  logoUrl: text('logo_url'),
  contactPerson: text('contact_person'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  address: text('address'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 28. Placement Drives
export const placementDrives = pgTable('placement_drives', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  companyId: integer('company_id').references(() => companies.id).notNull(),
  academicYearId: integer('academic_year_id').references(() => academicYears.id),
  driveDate: text('drive_date').notNull(),
  venue: text('venue').notNull(),
  eligibilityCriteria: text('eligibility_criteria'),
  packageDetails: text('package_details'),
  status: text('status').notNull().default('upcoming'), // upcoming, ongoing, completed
  createdAt: timestamp('created_at').defaultNow(),
});

// 29. Job Opportunities
export const jobOpportunities = pgTable('job_opportunities', {
  id: serial('id').primaryKey(),
  driveId: integer('drive_id').references(() => placementDrives.id),
  companyId: integer('company_id').references(() => companies.id).notNull(),
  jobTitle: text('job_title').notNull(),
  jobRole: text('job_role').notNull(),
  jobType: text('job_type').notNull().default('full_time'), // full_time, internship, contract
  salaryPackage: text('salary_package').notNull(), // e.g. '$85,000 / annum'
  location: text('location').notNull(),
  minCgpa: numeric('min_cgpa', { precision: 4, scale: 2 }).default('6.50'),
  eligibleDepartments: text('eligible_departments'), // Comma-separated or JSON
  deadline: text('deadline').notNull(),
  description: text('description').notNull(),
  requirements: text('requirements'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 30. Job Applications
export const jobApplications = pgTable('job_applications', {
  id: serial('id').primaryKey(),
  jobOpportunityId: integer('job_opportunity_id').references(() => jobOpportunities.id).notNull(),
  studentId: integer('student_id').references(() => students.id).notNull(),
  resumeUrl: text('resume_url'),
  resumeName: text('resume_name'),
  status: text('status').notNull().default('applied'), // applied, shortlisted, interviewing, offered, rejected, accepted
  currentStage: text('current_stage').notNull().default('Application Review'),
  notes: text('notes'),
  appliedAt: timestamp('applied_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 31. Notifications
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull().default('general'), // assignment, exam, attendance, notice, placement, certificate, general
  linkUrl: text('link_url'),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// 32. Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'),
  userEmail: text('user_email'),
  action: text('action').notNull(), // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, ATTENDANCE_MARKED, MARKS_ENTERED, PUBLISHED
  entity: text('entity').notNull(), // Student, Faculty, Attendance, Exam, Assignment, Notice, JobApplication, etc.
  entityId: text('entity_id'),
  details: text('details'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 33. System Settings
export const systemSettings = pgTable('system_settings', {
  id: serial('id').primaryKey(),
  settingKey: text('setting_key').notNull().unique(),
  settingValue: text('setting_value').notNull(),
  description: text('description'),
  category: text('category').notNull().default('general'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 34. Help Desk Tickets
export const helpDeskTickets = pgTable('help_desk_tickets', {
  id: serial('id').primaryKey(),
  ticketNumber: text('ticket_number').notNull().unique(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  category: text('category').notNull().default('other'), // academic, it_support, fee_finance, hostel_facility, examination, placement, library, other
  priority: text('priority').notNull().default('medium'), // low, medium, high, urgent
  status: text('status').notNull().default('open'), // open, in_progress, resolved, closed
  subject: text('subject').notNull(),
  description: text('description').notNull(),
  departmentId: integer('department_id').references(() => departments.id, { onDelete: 'set null' }),
  assignedToId: integer('assigned_to_id').references(() => users.id, { onDelete: 'set null' }),
  adminResponse: text('admin_response'),
  contactPhone: text('contact_phone'),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 35. Help Desk Ticket Messages
export const ticketMessages = pgTable('ticket_messages', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id').references(() => helpDeskTickets.id, { onDelete: 'cascade' }).notNull(),
  senderId: integer('sender_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  message: text('message').notNull(),
  isInternalNote: boolean('is_internal_note').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relationships
export const usersRelations = relations(users, ({ one, many }) => ({
  department: one(departments, { fields: [users.departmentId], references: [departments.id] }),
  studentProfile: one(students, { fields: [users.id], references: [students.userId] }),
  facultyProfile: one(faculty, { fields: [users.id], references: [faculty.userId] }),
  notifications: many(notifications),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  courses: many(courses),
  subjects: many(subjects),
  users: many(users),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  department: one(departments, { fields: [courses.departmentId], references: [departments.id] }),
  subjects: many(subjects),
  classes: many(classes),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  department: one(departments, { fields: [subjects.departmentId], references: [departments.id] }),
  course: one(courses, { fields: [subjects.courseId], references: [courses.id] }),
  facultyUser: one(users, { fields: [subjects.facultyId], references: [users.id] }),
  studyMaterials: many(studyMaterials),
  assignments: many(assignments),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  course: one(courses, { fields: [classes.courseId], references: [courses.id] }),
  department: one(departments, { fields: [classes.departmentId], references: [departments.id] }),
  semester: one(semesters, { fields: [classes.semesterId], references: [semesters.id] }),
  timetables: many(timetables),
  enrollments: many(enrollments),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, { fields: [students.userId], references: [users.id] }),
  department: one(departments, { fields: [students.departmentId], references: [departments.id] }),
  course: one(courses, { fields: [students.courseId], references: [courses.id] }),
  class: one(classes, { fields: [students.classId], references: [classes.id] }),
  enrollments: many(enrollments),
  attendanceRecords: many(attendanceRecords),
  submissions: many(assignmentSubmissions),
  marks: many(marks),
  certificates: many(certificates),
  jobApplications: many(jobApplications),
}));
