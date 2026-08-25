// High-fidelity fallback and in-memory datastore for CMS
// Seamlessly operates in all environments and bridges with PostgreSQL

export interface MockUser {
  id: number;
  uid: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'hod' | 'faculty' | 'student' | 'placement_officer';
  phone?: string;
  avatarUrl?: string;
  departmentId?: number | null;
  status: string;
}

class MockStore {
  public users: MockUser[] = [
    { id: 1, uid: 'usr_superadmin', email: 'superadmin@aitm.edu', name: 'Dr. Arthur Vance (Super Admin)', role: 'super_admin', phone: '+1 555-0100', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', status: 'active' },
    { id: 2, uid: 'usr_admin', email: 'admin@aitm.edu', name: 'Eleanor Davis (College Admin)', role: 'admin', phone: '+1 555-0101', avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', status: 'active' },
    { id: 3, uid: 'usr_hod_cse', email: 'hod.cse@aitm.edu', name: 'Dr. Robert Jenkins (HOD - CSE)', role: 'hod', departmentId: 1, phone: '+1 555-0102', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', status: 'active' },
    { id: 4, uid: 'usr_faculty_1', email: 'sarah.connor@aitm.edu', name: 'Prof. Sarah Connor', role: 'faculty', departmentId: 1, phone: '+1 555-0103', avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', status: 'active' },
    { id: 5, uid: 'usr_faculty_2', email: 'alan.grant@aitm.edu', name: 'Dr. Alan Grant', role: 'faculty', departmentId: 1, phone: '+1 555-0104', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', status: 'active' },
    { id: 6, uid: 'usr_placement', email: 'placement@aitm.edu', name: 'Marcus Sterling (Placement Officer)', role: 'placement_officer', phone: '+1 555-0105', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', status: 'active' },
    { id: 7, uid: 'usr_student_1', email: 'alex.chen@student.aitm.edu', name: 'Alex Chen', role: 'student', departmentId: 1, phone: '+1 555-0106', avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150', status: 'active' },
    { id: 8, uid: 'usr_student_2', email: 'priya.sharma@student.aitm.edu', name: 'Priya Sharma', role: 'student', departmentId: 1, phone: '+1 555-0107', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', status: 'active' },
    { id: 9, uid: 'usr_student_3', email: 'david.miller@student.aitm.edu', name: 'David Miller', role: 'student', departmentId: 1, phone: '+1 555-0108', avatarUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150', status: 'active' },
  ];

  public departments = [
    { id: 1, code: 'CSE', name: 'Computer Science & Engineering', description: 'Department of Computing, AI, Software Systems and Data Science', building: 'Alan Turing Block - Level 3', contactEmail: 'cse.dept@aitm.edu', hodId: 3 },
    { id: 2, code: 'ECE', name: 'Electronics & Communication', description: 'Department of Embedded Systems, VLSI, and Communications', building: 'Tesla Hall - Level 2', contactEmail: 'ece.dept@aitm.edu', hodId: null },
    { id: 3, code: 'ME', name: 'Mechanical Engineering', description: 'Department of Robotics, Manufacturing, and Thermal Sciences', building: 'Watt Engineering Complex', contactEmail: 'me.dept@aitm.edu', hodId: null },
    { id: 4, code: 'MBA', name: 'Management Studies', description: 'School of Business Administration & Analytics', building: 'Executive Block - Level 1', contactEmail: 'mgmt.dept@aitm.edu', hodId: null },
  ];

  public academicYears = [
    { id: 1, name: '2025-2026', startDate: '2025-08-01', endDate: '2026-06-30', isCurrent: true },
  ];

  public semesters = [
    { id: 1, academicYearId: 1, name: 'Semester 5 (Fall 2025)', semesterNumber: 5, startDate: '2025-08-01', endDate: '2025-12-20', isCurrent: true },
    { id: 2, academicYearId: 1, name: 'Semester 6 (Spring 2026)', semesterNumber: 6, startDate: '2026-01-10', endDate: '2026-05-30', isCurrent: false },
  ];

  public courses = [
    { id: 1, code: 'BTECH-CSE', name: 'B.Tech in Computer Science & Engineering', departmentId: 1, durationYears: 4, totalSemesters: 8, degreeType: 'Undergraduate' },
    { id: 2, code: 'BTECH-ECE', name: 'B.Tech in Electronics & Communication', departmentId: 2, durationYears: 4, totalSemesters: 8, degreeType: 'Undergraduate' },
    { id: 3, code: 'MTECH-AI', name: 'M.Tech in Artificial Intelligence & ML', departmentId: 1, durationYears: 2, totalSemesters: 4, degreeType: 'Postgraduate' },
  ];

  public classes = [
    { id: 1, name: 'CSE Year 3 - Sec A', courseId: 1, departmentId: 1, semesterId: 1, academicYearId: 1, section: 'A', roomNumber: 'Room 301', advisorFacultyId: 4 },
    { id: 2, name: 'CSE Year 3 - Sec B', courseId: 1, departmentId: 1, semesterId: 1, academicYearId: 1, section: 'B', roomNumber: 'Room 302', advisorFacultyId: 5 },
    { id: 3, name: 'ECE Year 3 - Sec A', courseId: 2, departmentId: 2, semesterId: 1, academicYearId: 1, section: 'A', roomNumber: 'Room 204', advisorFacultyId: 5 },
  ];

  public subjects = [
    { id: 1, code: 'CS501', name: 'Database Management Systems', departmentId: 1, courseId: 1, semesterNumber: 5, credits: 4, type: 'theory', facultyId: 4 },
    { id: 2, code: 'CS502', name: 'Design & Analysis of Algorithms', departmentId: 1, courseId: 1, semesterNumber: 5, credits: 4, type: 'theory', facultyId: 5 },
    { id: 3, code: 'CS503', name: 'Operating Systems & Concurrency', departmentId: 1, courseId: 1, semesterNumber: 5, credits: 3, type: 'theory', facultyId: 4 },
    { id: 4, code: 'CS504L', name: 'Full-Stack Software Engineering Lab', departmentId: 1, courseId: 1, semesterNumber: 5, credits: 2, type: 'practical', facultyId: 4 },
  ];

  public faculty = [
    { id: 1, userId: 4, employeeId: 'FAC-CSE-101', designation: 'Associate Professor', departmentId: 1, qualification: 'Ph.D. in Distributed Systems', specialization: 'Cloud Computing, Database Architectures', joiningDate: '2019-07-15', officeRoom: 'Turing-308' },
    { id: 2, userId: 5, employeeId: 'FAC-CSE-102', designation: 'Professor', departmentId: 1, qualification: 'Ph.D. in Computer Science', specialization: 'Algorithm Design, Artificial Intelligence', joiningDate: '2016-01-10', officeRoom: 'Turing-312' },
  ];

  public students = [
    { id: 1, userId: 7, studentIdNum: 'AITM23CS0101', rollNo: '23CSE01', departmentId: 1, courseId: 1, semesterId: 1, classId: 1, admissionYear: '2023', dateOfBirth: '2004-05-14', gender: 'Male', address: '742 Evergreen Terrace, Tech Park City', guardianName: 'Jonathan Chen', guardianPhone: '+1 555-9011', bloodGroup: 'O+', cgpa: '8.92' },
    { id: 2, userId: 8, studentIdNum: 'AITM23CS0102', rollNo: '23CSE02', departmentId: 1, courseId: 1, semesterId: 1, classId: 1, admissionYear: '2023', dateOfBirth: '2004-08-22', gender: 'Female', address: '124 Lotus Boulevard, Metro Heights', guardianName: 'Sunil Sharma', guardianPhone: '+1 555-9012', bloodGroup: 'B+', cgpa: '9.20' },
    { id: 3, userId: 9, studentIdNum: 'AITM23CS0103', rollNo: '23CSE03', departmentId: 1, courseId: 1, semesterId: 1, classId: 1, admissionYear: '2023', dateOfBirth: '2004-01-19', gender: 'Male', address: '88 Cyber Gateway, Silicon Vista', guardianName: 'Robert Miller', guardianPhone: '+1 555-9013', bloodGroup: 'A+', cgpa: '8.40' },
  ];

  public timetables = [
    { id: 1, classId: 1, subjectId: 1, facultyId: 4, dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:00', roomNumber: 'Room 301' },
    { id: 2, classId: 1, subjectId: 2, facultyId: 5, dayOfWeek: 'Monday', startTime: '10:15', endTime: '11:15', roomNumber: 'Room 301' },
    { id: 3, classId: 1, subjectId: 1, facultyId: 4, dayOfWeek: 'Tuesday', startTime: '11:30', endTime: '12:30', roomNumber: 'Room 301' },
    { id: 4, classId: 1, subjectId: 2, facultyId: 5, dayOfWeek: 'Wednesday', startTime: '09:00', endTime: '10:00', roomNumber: 'Room 301' },
    { id: 5, classId: 1, subjectId: 4, facultyId: 4, dayOfWeek: 'Thursday', startTime: '14:00', endTime: '16:00', roomNumber: 'CS Lab 2' },
    { id: 6, classId: 1, subjectId: 2, facultyId: 5, dayOfWeek: 'Friday', startTime: '10:15', endTime: '11:15', roomNumber: 'Room 301' },
  ];

  public attendanceSessions = [
    { id: 1, classId: 1, subjectId: 1, facultyId: 4, date: '2025-08-18', timeSlot: '09:00 - 10:00', topicCovered: 'Relational Algebra, SQL Joins & Query Optimization' },
    { id: 2, classId: 1, subjectId: 2, facultyId: 5, date: '2025-08-19', timeSlot: '10:15 - 11:15', topicCovered: 'Dynamic Programming & Memoization Patterns' },
    { id: 3, classId: 1, subjectId: 1, facultyId: 4, date: '2025-08-20', timeSlot: '11:30 - 12:30', topicCovered: 'PostgreSQL MVCC & B-Tree Index Mechanics' },
  ];

  public attendanceRecords = [
    { id: 1, sessionId: 1, studentId: 1, status: 'present', remarks: 'Active engagement' },
    { id: 2, sessionId: 1, studentId: 2, status: 'present', remarks: 'On time' },
    { id: 3, sessionId: 1, studentId: 3, status: 'present', remarks: 'On time' },
    { id: 4, sessionId: 2, studentId: 1, status: 'present', remarks: 'Solved board problems' },
    { id: 5, sessionId: 2, studentId: 2, status: 'absent', remarks: 'Sick leave informed' },
    { id: 6, sessionId: 2, studentId: 3, status: 'present', remarks: 'On time' },
    { id: 7, sessionId: 3, studentId: 1, status: 'present', remarks: 'Lab demo verified' },
    { id: 8, sessionId: 3, studentId: 2, status: 'present', remarks: 'On time' },
    { id: 9, sessionId: 3, studentId: 3, status: 'present', remarks: 'On time' },
  ];

  public assignments = [
    { id: 1, title: 'Assignment 1: Distributed Transactions & ACID Isolation', description: 'Implement 2-Phase Commit simulation and analyze serializable snapshot isolation vs read-committed phenomena.', subjectId: 1, classId: 1, facultyId: 4, dueDate: '2025-09-05', maxMarks: 100, attachmentName: 'DBMS_Assignment_1_Spec.pdf', attachmentUrl: 'https://storage.googleapis.com/aitm-materials/dbms-spec.pdf', createdAt: '2025-08-20T10:00:00Z' },
    { id: 2, title: 'Assignment 2: Graph Shortest Path & Flow Algorithms', description: 'Design Dijkstra with Fibonacci Heaps and solve max-flow min-cut network problems.', subjectId: 2, classId: 1, facultyId: 5, dueDate: '2025-09-12', maxMarks: 100, attachmentName: 'Algorithms_HW2.pdf', attachmentUrl: 'https://storage.googleapis.com/aitm-materials/algo-hw2.pdf', createdAt: '2025-08-21T11:30:00Z' },
  ];

  public assignmentSubmissions = [
    { id: 1, assignmentId: 1, studentId: 1, submissionText: 'GitHub repo: github.com/alexchen/2pc-simulation with comprehensive test cases and benchmark reports.', fileName: 'alex_chen_assignment1.zip', fileUrl: 'https://storage.googleapis.com/aitm-submissions/alex_hw1.zip', marksObtained: '95.00', grade: 'A+', feedback: 'Exceptional test coverage and clear documentation of isolation anomaly handling.', gradedById: 4, gradedAt: '2025-08-22T14:00:00Z', status: 'graded', submittedAt: '2025-08-21T18:00:00Z' },
  ];

  public studyMaterials = [
    { id: 1, title: 'Lecture Notes: PostgreSQL Storage Engine & B-Tree Indexing', description: 'Deep dive into WAL, MVCC, Heap pages, and execution plans', subjectId: 1, facultyId: 4, fileUrl: 'https://storage.googleapis.com/aitm-materials/dbms_lec_03.pdf', fileName: 'DBMS_MVCC_Notes.pdf', fileType: 'pdf', fileSize: '4.2 MB', downloadCount: 142, createdAt: '2025-08-15T09:00:00Z' },
    { id: 2, title: 'Algorithms Cheatsheet: Amortized Analysis & Master Theorem', description: 'Reference sheets for Big-O bounds and recursion trees', subjectId: 2, facultyId: 5, fileUrl: 'https://storage.googleapis.com/aitm-materials/algo_cheatsheet.pdf', fileName: 'Algo_Master_Theorem.pdf', fileType: 'pdf', fileSize: '1.8 MB', downloadCount: 215, createdAt: '2025-08-16T10:00:00Z' },
  ];

  public examinations = [
    { id: 1, title: 'Mid-Semester Theory Examinations (Fall 2025)', examType: 'midterm', departmentId: 1, academicYearId: 1, semesterId: 1, startDate: '2025-10-10', endDate: '2025-10-22', isPublished: true, gradingScale: 'standard_10_point' },
    { id: 2, title: 'End-Semester Final Practical & Viva Examinations', examType: 'practical', departmentId: 1, academicYearId: 1, semesterId: 1, startDate: '2025-11-20', endDate: '2025-11-28', isPublished: false, gradingScale: 'standard_10_point' },
    { id: 3, title: 'ECE Circuit Design & Embedded Systems Unit Quiz 2', examType: 'quiz', departmentId: 2, academicYearId: 1, semesterId: 1, startDate: '2025-10-05', endDate: '2025-10-07', isPublished: true, gradingScale: 'standard_10_point' },
    { id: 4, title: 'Mechanical Engineering Autumn Final Examinations', examType: 'final', departmentId: 3, academicYearId: 1, semesterId: 1, startDate: '2025-12-01', endDate: '2025-12-15', isPublished: false, gradingScale: 'standard_10_point' },
    { id: 5, title: 'MBA Strategic Management & Financial Analytics Midterm', examType: 'midterm', departmentId: 4, academicYearId: 1, semesterId: 1, startDate: '2025-10-14', endDate: '2025-10-20', isPublished: true, gradingScale: 'standard_10_point' },
  ];

  public examSchedules = [
    { id: 1, examId: 1, subjectId: 1, examDate: '2025-10-12', startTime: '09:30', endTime: '12:30', roomNumber: 'Exam Hall A (Turing)', maxMarks: 100, passingMarks: 40 },
    { id: 2, examId: 1, subjectId: 2, examDate: '2025-10-15', startTime: '09:30', endTime: '12:30', roomNumber: 'Exam Hall B (Turing)', maxMarks: 100, passingMarks: 40 },
    { id: 3, examId: 1, subjectId: 3, examDate: '2025-10-18', startTime: '09:30', endTime: '12:30', roomNumber: 'Exam Hall A (Turing)', maxMarks: 100, passingMarks: 40 },
    { id: 4, examId: 2, subjectId: 4, examDate: '2025-11-22', startTime: '10:00', endTime: '16:00', roomNumber: 'Computer Lab 2', maxMarks: 50, passingMarks: 20 },
  ];

  public marks = [
    { id: 1, examScheduleId: 1, studentId: 1, marksObtained: '92.00', isAbsent: false, remarks: 'Excellent SQL optimization answers', enteredById: 4 },
    { id: 2, examScheduleId: 2, studentId: 1, marksObtained: '89.00', isAbsent: false, remarks: 'Great dynamic programming proofs', enteredById: 5 },
    { id: 3, examScheduleId: 1, studentId: 2, marksObtained: '96.00', isAbsent: false, remarks: 'Flawless normalization proofs', enteredById: 4 },
    { id: 4, examScheduleId: 2, studentId: 2, marksObtained: '94.00', isAbsent: false, remarks: 'Outstanding graph algorithm formulation', enteredById: 5 },
  ];

  public examResults = [
    { id: 1, examId: 1, studentId: 1, totalMarks: '181.00', percentage: '90.50', gpa: '9.10', cgpa: '8.92', overallGrade: 'A+', status: 'pass', isPublished: true, publishedAt: '2025-10-28T12:00:00Z' },
    { id: 2, examId: 1, studentId: 2, totalMarks: '190.00', percentage: '95.00', gpa: '9.60', cgpa: '9.20', overallGrade: 'O', status: 'pass', isPublished: true, publishedAt: '2025-10-28T12:00:00Z' },
  ];

  public notices = [
    {
      id: 1,
      title: 'Institutional Hackathon 2025 - Registrations Open',
      content: '48-hour annual coding hackathon with $15,000 prize pool sponsored by top cloud & AI technology partners. Open to all engineering and management departments.',
      targetRole: 'all',
      departmentId: null, // Broadcast to All Departments
      category: 'events',
      academicYearId: 1,
      priority: 'urgent',
      attachmentName: 'Hackathon_Rules_2025.pdf',
      attachmentUrl: 'https://storage.googleapis.com/aitm-notices/hackathon2025.pdf',
      isPublished: true,
      authorId: 1,
      createdAt: '2025-08-18T10:00:00Z',
    },
    {
      id: 2,
      title: 'CSE Department: GPU Server Cluster Allocation & Access Guidelines',
      content: 'All 3rd and 4th year CSE students working on Capstone AI/ML projects can now request SSH access tokens for the NVIDIA A100 computing cluster via the lab coordinator.',
      targetRole: 'students',
      departmentId: 1, // CSE Only
      category: 'academic',
      academicYearId: 1,
      priority: 'important',
      attachmentName: 'Cluster_Access_Policy.pdf',
      attachmentUrl: 'https://storage.googleapis.com/aitm-notices/gpu-policy.pdf',
      isPublished: true,
      authorId: 3,
      createdAt: '2025-08-22T08:30:00Z',
    },
    {
      id: 3,
      title: 'Mid-Semester Exam Schedule and Seating Plan Released',
      content: 'All students are requested to check their room allocations and bring their institutional ID cards along with hall tickets to examination venues.',
      targetRole: 'students',
      departmentId: null, // Broadcast to All Departments
      category: 'examination',
      academicYearId: 1,
      priority: 'important',
      isPublished: true,
      authorId: 2,
      createdAt: '2025-08-19T14:30:00Z',
    },
    {
      id: 4,
      title: 'ECE Department: VLSI & Embedded Systems Seminar by Intel Research',
      content: 'Guest lecture on FinFET fabrication technology and RISC-V SoC architecture in Tesla Hall Seminar Room 2. Mandatory for ECE juniors and seniors.',
      targetRole: 'all',
      departmentId: 2, // ECE Only
      category: 'academic',
      academicYearId: 1,
      priority: 'normal',
      isPublished: true,
      authorId: 2,
      createdAt: '2025-08-20T11:00:00Z',
    },
    {
      id: 5,
      title: 'Faculty Academic Council & Curriculum Review Meeting',
      content: 'Mandatory council meeting on AI/ML curriculum integration, ABET accreditation milestones, and elective course offerings for next semester.',
      targetRole: 'faculty',
      departmentId: null, // All Faculty
      category: 'administrative',
      academicYearId: 1,
      priority: 'normal',
      isPublished: true,
      authorId: 1,
      createdAt: '2025-08-20T09:15:00Z',
    },
    {
      id: 6,
      title: 'Placement Cell: Google & Stripe Campus Recruitment Drive Rules',
      content: 'Eligible students with CGPA >= 7.50 must upload their updated resume and verify transcript grades on the portal before Friday 5:00 PM.',
      targetRole: 'students',
      departmentId: null, // Broadcast to All Departments
      category: 'placements',
      academicYearId: 1,
      priority: 'urgent',
      attachmentName: 'Placement_Guidelines_2025.pdf',
      attachmentUrl: 'https://storage.googleapis.com/aitm-notices/placement-guidelines.pdf',
      isPublished: true,
      authorId: 6,
      createdAt: '2025-08-21T16:00:00Z',
    },
    {
      id: 7,
      title: 'Mechanical Engineering: Robotics Workshop Safety Protocols',
      content: 'Safety gear and protective footwear mandatory during CNC milling and pneumatic actuator lab sessions starting next Monday.',
      targetRole: 'students',
      departmentId: 3, // ME Only
      category: 'academic',
      academicYearId: 1,
      priority: 'important',
      isPublished: true,
      authorId: 2,
      createdAt: '2025-08-17T13:45:00Z',
    },
  ];

  public events = [
    { id: 1, title: 'InnovateX 2025: National Tech Symposium', description: 'Keynotes from leading technology innovators, paper presentations, AI exhibitions, and networking dinners.', eventType: 'academic', venue: 'Auditorium Complex & Central Lawns', startDate: '2025-11-15', endDate: '2025-11-17', maxCapacity: 500, bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800', organizerId: 1, status: 'upcoming' },
  ];

  public eventRegistrations = [
    { id: 1, eventId: 1, userId: 7, attended: false },
  ];

  public workshops = [
    { id: 1, title: 'Hands-on Kubernetes, Microservices & Cloud-Native Deployment', description: 'Intensive weekend workshop covering Docker multi-stage builds, Helm charts, Ingress routing, and Prometheus telemetry.', instructor: 'Dr. Sarah Connor & Cloud Infrastructure Architects', venue: 'Advanced Cloud Computing Lab (Turing-402)', startDate: '2025-09-27', endDate: '2025-09-28', maxCapacity: 60, fee: '0.00', prerequisite: 'Basic Linux command line & Git familiarity', materialsUrl: 'https://github.com/aitm-cloud/k8s-workshop-2025', organizerId: 4, status: 'upcoming' },
  ];

  public certificates = [
    { id: 1, certificateNumber: 'CERT-2025-88219', certificateType: 'workshop', title: 'Certificate of Excellence: Cloud Architecture & Distributed Systems', studentId: 1, issueDate: '2025-08-20', verificationHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', verificationCode: 'VERIF-AITM-88219-X9', issuingAuthority: 'Registrar Office & Dean of Academic Affairs', status: 'issued', description: 'Awarded for demonstrating exceptional technical mastery and active participation in Cloud Architecture and Kubernetes deployment projects.', issuedById: 4, metadataJson: JSON.stringify({ grade: 'Distinction', issuedByTitle: 'Head of Cloud Technologies' }) },
    { id: 2, certificateNumber: 'CERT-2025-77104', certificateType: 'merit', title: 'Academic Merit Honor Roll - Semester 4', studentId: 1, issueDate: '2025-06-15', verificationHash: '5f4dcc3b5aa765d61d8327deb882cf992b9699aabb50b4625b6a71e21b7ffda7', verificationCode: 'VERIF-AITM-77104-M4', issuingAuthority: 'Board of Governors', status: 'issued', description: 'Awarded for maintaining top 5% academic performance with a semester GPA above 9.0.', issuedById: 1, metadataJson: JSON.stringify({ rank: '3rd in Department', gpa: '9.15' }) },
  ];

  public companies = [
    { id: 1, name: 'Google Cloud Platform', industry: 'Cloud & AI Computing', website: 'https://cloud.google.com', logoUrl: 'https://www.google.com/favicon.ico', contactPerson: 'Katherine Howard', contactEmail: 'university-recruiting@google.com', contactPhone: '+1 650-253-0000', address: 'Mountain View, CA', description: 'Global leader in cloud computing, AI foundation models, enterprise infrastructure, and search.' },
    { id: 2, name: 'Stripe', industry: 'Fintech & Payment Infrastructure', website: 'https://stripe.com', logoUrl: 'https://stripe.com/favicon.ico', contactPerson: 'Daniel Vance', contactEmail: 'careers@stripe.com', contactPhone: '+1 415-555-0199', address: 'San Francisco, CA', description: 'Financial infrastructure platform building payment and economic rail systems for the internet.' },
    { id: 3, name: 'Microsoft Azure', industry: 'Enterprise Software & Cloud', website: 'https://azure.microsoft.com', logoUrl: 'https://azure.microsoft.com/favicon.ico', contactPerson: 'Rachel Green', contactEmail: 'campus-jobs@microsoft.com', contactPhone: '+1 425-882-8080', address: 'Redmond, WA', description: 'Worldwide leader in software, cloud solutions, developer platforms, and enterprise AI.' },
  ];

  public placementDrives = [
    { id: 1, title: 'Google Campus Recruitment Drive 2025-26', companyId: 1, academicYearId: 1, driveDate: '2025-10-25', venue: 'Placement Cell Auditorium & Virtual Assessment Centers', eligibilityCriteria: 'Minimum CGPA 7.50, B.Tech CSE / ECE with no active backlogs.', packageDetails: '$120,000 - $145,000 CTC + Signing Bonus & Stock Grants', status: 'upcoming' },
  ];

  public jobOpportunities = [
    { id: 1, driveId: 1, companyId: 1, jobTitle: 'Software Engineer - Distributed Systems & Cloud', jobRole: 'SWE Level 3', jobType: 'full_time', salaryPackage: '$135,000 / annum', location: 'Sunnyvale, CA / New York, NY (Hybrid)', minCgpa: '7.50', eligibleDepartments: 'CSE, ECE', deadline: '2025-10-18', description: 'Design and build resilient, planetary-scale distributed storage and real-time computation pipelines powering next-generation cloud services.', requirements: 'Proficiency in Go, Java, or C++, solid grasp of operating systems, concurrency, database indexing, and network protocols.' },
    { id: 2, driveId: null, companyId: 2, jobTitle: 'Full-Stack Software Engineering Intern', jobRole: 'Engineering Intern - Summer 2026', jobType: 'internship', salaryPackage: '$8,500 / month', location: 'Seattle, WA / Remote', minCgpa: '7.00', eligibleDepartments: 'CSE, ECE, IT', deadline: '2025-10-30', description: 'Build developer-first APIs, dashboard workflows, and fraud prevention pipelines.', requirements: 'Experience with React, TypeScript, Node.js, SQL databases, and automated testing.' },
  ];

  public jobApplications = [
    { id: 1, jobOpportunityId: 1, studentId: 1, resumeUrl: 'https://storage.googleapis.com/aitm-resumes/alex_chen_resume.pdf', resumeName: 'Alex_Chen_SWE_Resume.pdf', status: 'shortlisted', currentStage: 'Technical Round 1 (Algorithms & Systems)', notes: 'Passed online coding round with 100% test cases passed.' },
  ];

  public notifications = [
    { id: 1, userId: 7, title: 'Assignment Graded', message: 'Your submission for DBMS Assignment 1 has been graded: 95/100 (A+).', type: 'assignment', linkUrl: '/student/assignments', isRead: false },
    { id: 2, userId: 7, title: 'Placement Shortlist Update', message: 'Congratulations! You have been shortlisted for Google Cloud SWE Technical Round 1.', type: 'placement', linkUrl: '/student/placements', isRead: false },
    { id: 3, userId: 7, title: 'New Notice Published', message: 'InnovateX 2025 National Tech Symposium registrations are now live.', type: 'notice', linkUrl: '/student/events', isRead: true },
  ];

  public auditLogs = [
    { id: 1, userId: 1, userEmail: 'superadmin@aitm.edu', action: 'CREATE', entity: 'Department', entityId: 'CSE', details: 'Initialized Department of Computer Science & Engineering', ipAddress: '10.0.0.1', userAgent: 'CMS Client', createdAt: '2025-08-15T08:00:00Z' },
    { id: 2, userId: 2, userEmail: 'admin@aitm.edu', action: 'PUBLISH', entity: 'Notice', entityId: '1', details: 'Published Institutional Hackathon 2025 announcement', ipAddress: '10.0.0.2', userAgent: 'CMS Client', createdAt: '2025-08-18T10:00:00Z' },
    { id: 3, userId: 4, userEmail: 'sarah.connor@aitm.edu', action: 'ATTENDANCE_MARKED', entity: 'AttendanceSession', entityId: '1', details: 'Marked attendance for CS Year 3 - Sec A (DBMS)', ipAddress: '10.0.0.3', userAgent: 'CMS Client', createdAt: '2025-08-18T11:00:00Z' },
    { id: 4, userId: 4, userEmail: 'sarah.connor@aitm.edu', action: 'GRADE', entity: 'AssignmentSubmission', entityId: '1', details: 'Graded Alex Chen with 95/100', ipAddress: '10.0.0.3', userAgent: 'CMS Client', createdAt: '2025-08-22T14:00:00Z' },
  ];

  public systemSettings = [
    { id: 1, settingKey: 'institution_name', settingValue: 'Apex Institute of Technology & Management', description: 'Name of the College / University', category: 'general' },
    { id: 2, settingKey: 'institution_code', settingValue: 'AITM-7701', description: 'Accreditation Institution Code', category: 'general' },
    { id: 3, settingKey: 'academic_term_current', settingValue: 'Fall 2025', description: 'Currently active academic session', category: 'academic' },
    { id: 4, settingKey: 'min_attendance_threshold', settingValue: '75', description: 'Minimum attendance percentage required for exam eligibility', category: 'attendance' },
    { id: 5, settingKey: 'grading_system', settingValue: '10_point_cgpa', description: 'Evaluation grading scale', category: 'examination' },
  ];

  public helpDeskTickets: any[] = [
    {
      id: 1,
      ticketNumber: 'TICK-2025-1001',
      userId: 7, // Alex Chen (Student)
      category: 'it_support',
      priority: 'high',
      status: 'in_progress',
      subject: 'Unable to access Campus WiFi 6E in Turing Block Level 3',
      description: 'Since yesterday afternoon, my student credentials get rejected with error code RADIUS_AUTH_FAIL whenever connecting to AITM-Student-Secure in the 3rd floor labs.',
      departmentId: 1,
      assignedToId: 2, // Eleanor Davis (Admin)
      adminResponse: 'Network Operations center has reset the RADIUS certificate cache. We are monitoring live connections across Turing Block.',
      contactPhone: '+1 555-0106',
      resolvedAt: null,
      createdAt: '2025-08-20T10:15:00.000Z',
      updatedAt: '2025-08-20T14:30:00.000Z',
    },
    {
      id: 2,
      ticketNumber: 'TICK-2025-1002',
      userId: 4, // Prof. Sarah Connor (Faculty)
      category: 'academic',
      priority: 'medium',
      status: 'resolved',
      subject: 'Request for Projector Calibration & HDMI Splitter in Room 301',
      description: 'The overhead 4K ceiling projector in Room 301 has color flicker during DBMS lectures. An auxiliary HDMI/Type-C dongle is also required for guest speaker sessions.',
      departmentId: 1,
      assignedToId: 2, // Admin
      adminResponse: 'AV Maintenance team replaced the HDMI transceiver cable and recalibrated color profiles on 2025-08-19. Tested and confirmed functional.',
      contactPhone: '+1 555-0103',
      resolvedAt: '2025-08-19T16:00:00.000Z',
      createdAt: '2025-08-18T09:00:00.000Z',
      updatedAt: '2025-08-19T16:00:00.000Z',
    },
    {
      id: 3,
      ticketNumber: 'TICK-2025-1003',
      userId: 8, // Priya Sharma (Student)
      category: 'examination',
      priority: 'urgent',
      status: 'open',
      subject: 'Discrepancy in Mid-Term Marks Transcript for CS502',
      description: 'My official grade card shows 82 in CS502 (Algorithms), but the verified evaluated answer script score was 92 as confirmed with Prof. Grant. Requesting grade rectification.',
      departmentId: 1,
      assignedToId: null,
      adminResponse: null,
      contactPhone: '+1 555-0107',
      resolvedAt: null,
      createdAt: '2025-08-21T08:30:00.000Z',
      updatedAt: '2025-08-21T08:30:00.000Z',
    },
    {
      id: 4,
      ticketNumber: 'TICK-2025-1004',
      userId: 5, // Dr. Alan Grant (Faculty)
      category: 'hostel_facility',
      priority: 'low',
      status: 'open',
      subject: 'Lab AC thermostat controller servicing in CS Lab 2',
      description: 'The automated climate controller in CS Lab 2 remains at 18C and fails to cycle off during off-peak hours.',
      departmentId: 1,
      assignedToId: 2,
      adminResponse: 'Work order #WO-9912 assigned to Campus Facilities Engineering.',
      contactPhone: '+1 555-0104',
      resolvedAt: null,
      createdAt: '2025-08-21T11:00:00.000Z',
      updatedAt: '2025-08-21T11:45:00.000Z',
    },
  ];

  public ticketMessages: any[] = [
    {
      id: 1,
      ticketId: 1,
      senderId: 7,
      message: 'Attached MAC address is 4A:99:BC:11:02:FF. Fails on both Android and macOS.',
      isInternalNote: false,
      createdAt: '2025-08-20T10:20:00.000Z',
    },
    {
      id: 2,
      ticketId: 1,
      senderId: 2,
      message: 'NOC engineers inspected AP-Turing-302. RADIUS certificate refreshed. Please test reconnections.',
      isInternalNote: false,
      createdAt: '2025-08-20T14:30:00.000Z',
    },
    {
      id: 3,
      ticketId: 2,
      senderId: 2,
      message: 'AV maintenance completed replacement and tested with 4K 60Hz source.',
      isInternalNote: false,
      createdAt: '2025-08-19T16:00:00.000Z',
    },
    {
      id: 4,
      ticketId: 3,
      senderId: 8,
      message: 'I have attached copy of the physical signed evaluation sheet for reference.',
      isInternalNote: false,
      createdAt: '2025-08-21T08:35:00.000Z',
    },
  ];
}

export const mockStore = new MockStore();
