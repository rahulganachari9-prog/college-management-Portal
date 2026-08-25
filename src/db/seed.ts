import { db } from './index.ts';
import * as schema from './schema.ts';

export async function seedDatabase() {
  try {
    console.log('Checking database seed state...');
    
    // 1. System Settings
    await db.insert(schema.systemSettings).values([
      { settingKey: 'institution_name', settingValue: 'Apex Institute of Technology & Management', description: 'Name of the College / University', category: 'general' },
      { settingKey: 'institution_code', settingValue: 'AITM-7701', description: 'Accreditation Institution Code', category: 'general' },
      { settingKey: 'academic_term_current', settingValue: 'Fall 2025', description: 'Currently active academic session', category: 'academic' },
      { settingKey: 'min_attendance_threshold', settingValue: '75', description: 'Minimum attendance percentage required for exam eligibility', category: 'attendance' },
      { settingKey: 'grading_system', settingValue: '10_point_cgpa', description: 'Evaluation grading scale', category: 'examination' },
    ]).onConflictDoNothing();

    // 2. Departments
    const deptRows = await db.insert(schema.departments).values([
      { code: 'CSE', name: 'Computer Science & Engineering', description: 'Department of Computing, AI, Software Systems and Data Science', building: 'Alan Turing Block - Level 3', contactEmail: 'cse.dept@aitm.edu' },
      { code: 'ECE', name: 'Electronics & Communication', description: 'Department of Embedded Systems, VLSI, and Communications', building: 'Tesla Hall - Level 2', contactEmail: 'ece.dept@aitm.edu' },
      { code: 'ME', name: 'Mechanical Engineering', description: 'Department of Robotics, Manufacturing, and Thermal Sciences', building: 'Watt Engineering Complex', contactEmail: 'me.dept@aitm.edu' },
      { code: 'MBA', name: 'Management Studies', description: 'School of Business Administration & Analytics', building: 'Executive Block - Level 1', contactEmail: 'mgmt.dept@aitm.edu' },
    ]).onConflictDoNothing().returning();

    const allDepts = await db.select().from(schema.departments);
    const cseDept = allDepts.find(d => d.code === 'CSE') || allDepts[0];
    const eceDept = allDepts.find(d => d.code === 'ECE') || allDepts[0];

    // 3. Academic Years & Semesters
    const [ay2025] = await db.insert(schema.academicYears).values({
      name: '2025-2026',
      startDate: '2025-08-01',
      endDate: '2026-06-30',
      isCurrent: true,
    }).onConflictDoNothing().returning();

    const currentAy = ay2025 || (await db.select().from(schema.academicYears))[0];

    const semRows = await db.insert(schema.semesters).values([
      { academicYearId: currentAy.id, name: 'Semester 5 (Fall 2025)', semesterNumber: 5, startDate: '2025-08-01', endDate: '2025-12-20', isCurrent: true },
      { academicYearId: currentAy.id, name: 'Semester 6 (Spring 2026)', semesterNumber: 6, startDate: '2026-01-10', endDate: '2026-05-30', isCurrent: false },
    ]).onConflictDoNothing().returning();

    const currentSem = semRows[0] || (await db.select().from(schema.semesters))[0];

    // 4. Courses
    const courseRows = await db.insert(schema.courses).values([
      { code: 'BTECH-CSE', name: 'B.Tech in Computer Science & Engineering', departmentId: cseDept.id, durationYears: 4, totalSemesters: 8, degreeType: 'Undergraduate' },
      { code: 'BTECH-ECE', name: 'B.Tech in Electronics & Communication', departmentId: eceDept.id, durationYears: 4, totalSemesters: 8, degreeType: 'Undergraduate' },
    ]).onConflictDoNothing().returning();

    const cseCourse = courseRows[0] || (await db.select().from(schema.courses))[0];

    // 5. Seed Core Users (Super Admin, Admin, HOD, Faculty, Students, Placement Officer)
    const userSeeds = [
      { uid: 'usr_superadmin', email: 'superadmin@aitm.edu', name: 'Dr. Arthur Vance (Super Admin)', role: 'super_admin', phone: '+1 555-0100', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
      { uid: 'usr_admin', email: 'admin@aitm.edu', name: 'Eleanor Davis (College Admin)', role: 'admin', phone: '+1 555-0101', avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150' },
      { uid: 'usr_hod_cse', email: 'hod.cse@aitm.edu', name: 'Dr. Robert Jenkins (HOD - CSE)', role: 'hod', departmentId: cseDept.id, phone: '+1 555-0102', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
      { uid: 'usr_faculty_1', email: 'sarah.connor@aitm.edu', name: 'Prof. Sarah Connor', role: 'faculty', departmentId: cseDept.id, phone: '+1 555-0103', avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' },
      { uid: 'usr_faculty_2', email: 'alan.grant@aitm.edu', name: 'Dr. Alan Grant', role: 'faculty', departmentId: cseDept.id, phone: '+1 555-0104', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
      { uid: 'usr_placement', email: 'placement@aitm.edu', name: 'Marcus Sterling (Placement Officer)', role: 'placement_officer', phone: '+1 555-0105', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' },
      { uid: 'usr_student_1', email: 'alex.chen@student.aitm.edu', name: 'Alex Chen', role: 'student', departmentId: cseDept.id, phone: '+1 555-0106', avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150' },
      { uid: 'usr_student_2', email: 'priya.sharma@student.aitm.edu', name: 'Priya Sharma', role: 'student', departmentId: cseDept.id, phone: '+1 555-0107', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150' },
      { uid: 'usr_student_3', email: 'david.miller@student.aitm.edu', name: 'David Miller', role: 'student', departmentId: cseDept.id, phone: '+1 555-0108', avatarUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150' },
    ];

    for (const u of userSeeds) {
      await db.insert(schema.users).values(u).onConflictDoNothing();
    }

    const allUsers = await db.select().from(schema.users);
    const faculty1User = allUsers.find(u => u.email === 'sarah.connor@aitm.edu') || allUsers[0];
    const faculty2User = allUsers.find(u => u.email === 'alan.grant@aitm.edu') || allUsers[0];
    const student1User = allUsers.find(u => u.email === 'alex.chen@student.aitm.edu') || allUsers[0];
    const student2User = allUsers.find(u => u.email === 'priya.sharma@student.aitm.edu') || allUsers[0];

    // 6. Faculty Profile records
    await db.insert(schema.faculty).values([
      { userId: faculty1User.id, employeeId: 'FAC-CSE-101', designation: 'Associate Professor', departmentId: cseDept.id, qualification: 'Ph.D. in Distributed Systems', specialization: 'Cloud Computing, Database Architectures', joiningDate: '2019-07-15', officeRoom: 'Turing-308' },
      { userId: faculty2User.id, employeeId: 'FAC-CSE-102', designation: 'Professor', departmentId: cseDept.id, qualification: 'Ph.D. in Computer Science', specialization: 'Algorithm Design, Artificial Intelligence', joiningDate: '2016-01-10', officeRoom: 'Turing-312' },
    ]).onConflictDoNothing();

    // 7. Classes
    const classRows = await db.insert(schema.classes).values([
      { name: 'CSE Year 3 - Sec A', courseId: cseCourse.id, departmentId: cseDept.id, semesterId: currentSem.id, academicYearId: currentAy.id, section: 'A', roomNumber: 'Room 301', advisorFacultyId: faculty1User.id },
      { name: 'CSE Year 3 - Sec B', courseId: cseCourse.id, departmentId: cseDept.id, semesterId: currentSem.id, academicYearId: currentAy.id, section: 'B', roomNumber: 'Room 302', advisorFacultyId: faculty2User.id },
    ]).onConflictDoNothing().returning();

    const cseClassA = classRows[0] || (await db.select().from(schema.classes))[0];

    // 8. Subjects
    const subjectRows = await db.insert(schema.subjects).values([
      { code: 'CS501', name: 'Database Management Systems', departmentId: cseDept.id, courseId: cseCourse.id, semesterNumber: 5, credits: 4, type: 'theory', facultyId: faculty1User.id },
      { code: 'CS502', name: 'Design & Analysis of Algorithms', departmentId: cseDept.id, courseId: cseCourse.id, semesterNumber: 5, credits: 4, type: 'theory', facultyId: faculty2User.id },
      { code: 'CS503', name: 'Operating Systems & Concurrency', departmentId: cseDept.id, courseId: cseCourse.id, semesterNumber: 5, credits: 3, type: 'theory', facultyId: faculty1User.id },
      { code: 'CS504L', name: 'Full-Stack Software Engineering Lab', departmentId: cseDept.id, courseId: cseCourse.id, semesterNumber: 5, credits: 2, type: 'practical', facultyId: faculty1User.id },
    ]).onConflictDoNothing().returning();

    const dbmsSubject = subjectRows[0] || (await db.select().from(schema.subjects))[0];
    const algoSubject = subjectRows[1] || (await db.select().from(schema.subjects))[0];

    // 9. Student Profiles
    const studentProfiles = await db.insert(schema.students).values([
      { userId: student1User.id, studentIdNum: 'STD-2023-0101', rollNo: '23CSE01', departmentId: cseDept.id, courseId: cseCourse.id, semesterId: currentSem.id, classId: cseClassA.id, admissionYear: '2023', dateOfBirth: '2004-05-14', gender: 'Male', address: '742 Evergreen Terrace, Tech Park City', guardianName: 'Jonathan Chen', guardianPhone: '+1 555-9011', bloodGroup: 'O+', cgpa: '8.85' },
      { userId: student2User.id, studentIdNum: 'STD-2023-0102', rollNo: '23CSE02', departmentId: cseDept.id, courseId: cseCourse.id, semesterId: currentSem.id, classId: cseClassA.id, admissionYear: '2023', dateOfBirth: '2004-08-22', gender: 'Female', address: '124 Lotus Boulevard, Metro Heights', guardianName: 'Sunil Sharma', guardianPhone: '+1 555-9012', bloodGroup: 'B+', cgpa: '9.20' },
    ]).onConflictDoNothing().returning();

    const allStudents = await db.select().from(schema.students);
    const student1 = allStudents[0];
    const student2 = allStudents[1] || allStudents[0];

    // 10. Enrollments
    if (student1) {
      await db.insert(schema.enrollments).values([
        { studentId: student1.id, classId: cseClassA.id, semesterId: currentSem.id, academicYearId: currentAy.id, status: 'enrolled' },
        ...(student2 ? [{ studentId: student2.id, classId: cseClassA.id, semesterId: currentSem.id, academicYearId: currentAy.id, status: 'enrolled' }] : []),
      ]).onConflictDoNothing();
    }

    // 11. Timetable
    await db.insert(schema.timetables).values([
      { classId: cseClassA.id, subjectId: dbmsSubject.id, facultyId: faculty1User.id, dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:00', roomNumber: 'Room 301' },
      { classId: cseClassA.id, subjectId: algoSubject.id, facultyId: faculty2User.id, dayOfWeek: 'Monday', startTime: '10:15', endTime: '11:15', roomNumber: 'Room 301' },
      { classId: cseClassA.id, subjectId: dbmsSubject.id, facultyId: faculty1User.id, dayOfWeek: 'Tuesday', startTime: '11:30', endTime: '12:30', roomNumber: 'Room 301' },
      { classId: cseClassA.id, subjectId: algoSubject.id, facultyId: faculty2User.id, dayOfWeek: 'Wednesday', startTime: '09:00', endTime: '10:00', roomNumber: 'Room 301' },
      { classId: cseClassA.id, subjectId: dbmsSubject.id, facultyId: faculty1User.id, dayOfWeek: 'Thursday', startTime: '14:00', endTime: '16:00', roomNumber: 'CS Lab 2' },
      { classId: cseClassA.id, subjectId: algoSubject.id, facultyId: faculty2User.id, dayOfWeek: 'Friday', startTime: '10:15', endTime: '11:15', roomNumber: 'Room 301' },
    ]).onConflictDoNothing();

    // 12. Attendance Sessions & Records
    const [attSession1] = await db.insert(schema.attendanceSessions).values({
      classId: cseClassA.id,
      subjectId: dbmsSubject.id,
      facultyId: faculty1User.id,
      date: '2025-08-18',
      timeSlot: '09:00 - 10:00',
      topicCovered: 'Relational Algebra, SQL Joins & Query Optimization',
    }).onConflictDoNothing().returning();

    if (attSession1 && student1) {
      await db.insert(schema.attendanceRecords).values([
        { sessionId: attSession1.id, studentId: student1.id, status: 'present', remarks: 'Active participation' },
        ...(student2 ? [{ sessionId: attSession1.id, studentId: student2.id, status: 'present', remarks: 'On time' }] : []),
      ]).onConflictDoNothing();
    }

    const [attSession2] = await db.insert(schema.attendanceSessions).values({
      classId: cseClassA.id,
      subjectId: algoSubject.id,
      facultyId: faculty2User.id,
      date: '2025-08-19',
      timeSlot: '10:15 - 11:15',
      topicCovered: 'Dynamic Programming & Memoization Patterns',
    }).onConflictDoNothing().returning();

    if (attSession2 && student1) {
      await db.insert(schema.attendanceRecords).values([
        { sessionId: attSession2.id, studentId: student1.id, status: 'present', remarks: 'Submitted homework' },
        ...(student2 ? [{ sessionId: attSession2.id, studentId: student2.id, status: 'absent', remarks: 'Medical leave informed' }] : []),
      ]).onConflictDoNothing();
    }

    // 13. Assignments & Submissions
    const [assignment1] = await db.insert(schema.assignments).values({
      title: 'Assignment 1: Distributed Transactions & ACID Isolation',
      description: 'Implement 2-Phase Commit simulation and analyze serializable snapshot isolation vs read-committed phenomena.',
      subjectId: dbmsSubject.id,
      classId: cseClassA.id,
      facultyId: faculty1User.id,
      dueDate: '2025-09-05',
      maxMarks: 100,
      attachmentName: 'DBMS_Assignment_1_Spec.pdf',
      attachmentUrl: 'https://storage.googleapis.com/aitm-materials/dbms-spec.pdf',
    }).onConflictDoNothing().returning();

    const [assignment2] = await db.insert(schema.assignments).values({
      title: 'Assignment 2: Graph Shortest Path & Flow Algorithms',
      description: 'Design Dijkstra with Fibonacci Heaps and solve max-flow min-cut network problems.',
      subjectId: algoSubject.id,
      classId: cseClassA.id,
      facultyId: faculty2User.id,
      dueDate: '2025-09-12',
      maxMarks: 100,
      attachmentName: 'Algorithms_HW2.pdf',
      attachmentUrl: 'https://storage.googleapis.com/aitm-materials/algo-hw2.pdf',
    }).onConflictDoNothing().returning();

    if (assignment1 && student1) {
      await db.insert(schema.assignmentSubmissions).values([
        {
          assignmentId: assignment1.id,
          studentId: student1.id,
          submissionText: 'GitHub repo: github.com/alexchen/2pc-simulation with comprehensive test cases and benchmark reports.',
          fileName: 'alex_chen_assignment1.zip',
          fileUrl: 'https://storage.googleapis.com/aitm-submissions/alex_hw1.zip',
          marksObtained: '95.00',
          grade: 'A+',
          feedback: 'Exceptional test coverage and clear documentation of isolation anomaly handling.',
          gradedById: faculty1User.id,
          status: 'graded',
        },
      ]).onConflictDoNothing();
    }

    // 14. Study Materials
    await db.insert(schema.studyMaterials).values([
      { title: 'Lecture Notes: PostgreSQL Storage Engine & B-Tree Indexing', description: 'Deep dive into WAL, MVCC, Heap pages, and execution plans', subjectId: dbmsSubject.id, facultyId: faculty1User.id, fileUrl: 'https://storage.googleapis.com/aitm-materials/dbms_lec_03.pdf', fileName: 'DBMS_MVCC_Notes.pdf', fileType: 'pdf', fileSize: '4.2 MB', downloadCount: 142 },
      { title: 'Algorithms Cheatsheet: Amortized Analysis & Master Theorem', description: 'Reference sheets for Big-O bounds and recursion trees', subjectId: algoSubject.id, facultyId: faculty2User.id, fileUrl: 'https://storage.googleapis.com/aitm-materials/algo_cheatsheet.pdf', fileName: 'Algo_Master_Theorem.pdf', fileType: 'pdf', fileSize: '1.8 MB', downloadCount: 215 },
    ]).onConflictDoNothing();

    // 15. Examinations, Schedules, Marks, Results
    const [exam1] = await db.insert(schema.examinations).values({
      title: 'Mid-Semester Examinations (Fall 2025)',
      examType: 'midterm',
      academicYearId: currentAy.id,
      semesterId: currentSem.id,
      startDate: '2025-10-10',
      endDate: '2025-10-22',
      isPublished: true,
      gradingScale: 'standard_10_point',
    }).onConflictDoNothing().returning();

    if (exam1) {
      const [schedule1] = await db.insert(schema.examSchedules).values({
        examId: exam1.id,
        subjectId: dbmsSubject.id,
        examDate: '2025-10-12',
        startTime: '09:30',
        endTime: '12:30',
        roomNumber: 'Exam Hall A',
        maxMarks: 100,
        passingMarks: 40,
      }).onConflictDoNothing().returning();

      const [schedule2] = await db.insert(schema.examSchedules).values({
        examId: exam1.id,
        subjectId: algoSubject.id,
        examDate: '2025-10-15',
        startTime: '09:30',
        endTime: '12:30',
        roomNumber: 'Exam Hall B',
        maxMarks: 100,
        passingMarks: 40,
      }).onConflictDoNothing().returning();

      if (schedule1 && schedule2 && student1) {
        await db.insert(schema.marks).values([
          { examScheduleId: schedule1.id, studentId: student1.id, marksObtained: '92.00', isAbsent: false, remarks: 'Excellent SQL optimization answers', enteredById: faculty1User.id },
          { examScheduleId: schedule2.id, studentId: student1.id, marksObtained: '89.00', isAbsent: false, remarks: 'Great dynamic programming proofs', enteredById: faculty2User.id },
          ...(student2 ? [
            { examScheduleId: schedule1.id, studentId: student2.id, marksObtained: '96.00', isAbsent: false, remarks: 'Flawless normalization proofs', enteredById: faculty1User.id },
            { examScheduleId: schedule2.id, studentId: student2.id, marksObtained: '94.00', isAbsent: false, remarks: 'Outstanding graph algorithm formulation', enteredById: faculty2User.id },
          ] : []),
        ]).onConflictDoNothing();

        await db.insert(schema.examResults).values([
          { examId: exam1.id, studentId: student1.id, totalMarks: '181.00', percentage: '90.50', gpa: '9.10', cgpa: '8.85', overallGrade: 'A+', status: 'pass', isPublished: true, publishedAt: new Date('2025-10-28') },
          ...(student2 ? [
            { examId: exam1.id, studentId: student2.id, totalMarks: '190.00', percentage: '95.00', gpa: '9.60', cgpa: '9.20', overallGrade: 'O', status: 'pass', isPublished: true, publishedAt: new Date('2025-10-28') },
          ] : []),
        ]).onConflictDoNothing();
      }
    }

    // 16. Notices & Announcements
    await db.insert(schema.notices).values([
      {
        title: 'Institutional Hackathon 2025 - Registrations Open',
        content: '48-hour annual coding hackathon with $15,000 prize pool sponsored by top cloud & AI technology partners. Open to all engineering departments.',
        targetRole: 'all',
        departmentId: cseDept.id,
        priority: 'urgent',
        attachmentName: 'Hackathon_Rules_2025.pdf',
        attachmentUrl: 'https://storage.googleapis.com/aitm-notices/hackathon2025.pdf',
        isPublished: true,
        authorId: allUsers[0].id,
      },
      {
        title: 'Mid-Semester Exam Schedule and Seating Plan Released',
        content: 'All students are requested to check their room allocations and bring their institutional ID cards along with hall tickets to examination venues.',
        targetRole: 'students',
        departmentId: cseDept.id,
        priority: 'important',
        isPublished: true,
        authorId: allUsers[1].id,
      },
      {
        title: 'Faculty Academic Council & Curriculum Review Meeting',
        content: 'Mandatory council meeting on AI/ML curriculum integration and elective course offerings for next semester.',
        targetRole: 'faculty',
        priority: 'normal',
        isPublished: true,
        authorId: allUsers[0].id,
      },
    ]).onConflictDoNothing();

    // 17. Events
    const [event1] = await db.insert(schema.events).values({
      title: 'InnovateX 2025: National Tech Symposium',
      description: 'Keynotes from leading technology innovators, paper presentations, AI exhibitions, and networking dinners.',
      eventType: 'academic',
      venue: 'Auditorium Complex & Central Lawns',
      startDate: '2025-11-15',
      endDate: '2025-11-17',
      maxCapacity: 500,
      bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      organizerId: allUsers[0].id,
      status: 'upcoming',
    }).onConflictDoNothing().returning();

    if (event1 && student1User) {
      await db.insert(schema.eventRegistrations).values({
        eventId: event1.id,
        userId: student1User.id,
        attended: false,
      }).onConflictDoNothing();
    }

    // 18. Workshops
    const [workshop1] = await db.insert(schema.workshops).values({
      title: 'Hands-on Kubernetes, Microservices & Cloud-Native Deployment',
      description: 'Intensive weekend workshop covering Docker multi-stage builds, Helm charts, Ingress routing, and Prometheus telemetry.',
      instructor: 'Dr. Sarah Connor & Cloud Infrastructure Architects',
      venue: 'Advanced Cloud Computing Lab (Turing-402)',
      startDate: '2025-09-27',
      endDate: '2025-09-28',
      maxCapacity: 60,
      fee: '0.00',
      prerequisite: 'Basic Linux command line & Git familiarity',
      materialsUrl: 'https://github.com/aitm-cloud/k8s-workshop-2025',
      organizerId: faculty1User.id,
      status: 'upcoming',
    }).onConflictDoNothing().returning();

    if (workshop1 && student1User) {
      await db.insert(schema.workshopRegistrations).values({
        workshopId: workshop1.id,
        userId: student1User.id,
        status: 'confirmed',
        attended: true,
        certificateIssued: true,
      }).onConflictDoNothing();
    }

    // 19. Certificates
    if (student1) {
      await db.insert(schema.certificates).values([
        {
          certificateNumber: 'CERT-2025-88219',
          title: 'Certificate of Excellence: Cloud Architecture & Distributed Systems',
          type: 'workshop',
          studentId: student1.id,
          issueDate: '2025-08-20',
          verificationCode: 'VERIF-AITM-88219-X9',
          description: 'Awarded for demonstrating exceptional technical mastery and active participation in Cloud Architecture and Kubernetes deployment projects.',
          issuedById: faculty1User.id,
          metadataJson: JSON.stringify({ grade: 'Distinction', issuedByTitle: 'Head of Cloud Technologies' }),
        },
        {
          certificateNumber: 'CERT-2025-77104',
          title: 'Academic Merit Honor Roll - Semester 4',
          type: 'merit',
          studentId: student1.id,
          issueDate: '2025-06-15',
          verificationCode: 'VERIF-AITM-77104-M4',
          description: 'Awarded for maintaining top 5% academic performance with a semester GPA above 9.0.',
          issuedById: allUsers[0].id,
          metadataJson: JSON.stringify({ rank: '3rd in Department', gpa: '9.15' }),
        },
      ]).onConflictDoNothing();
    }

    // 20. Companies & Placements
    const companyRows = await db.insert(schema.companies).values([
      { name: 'Google Cloud Platform', industry: 'Cloud & AI Computing', website: 'https://cloud.google.com', logoUrl: 'https://www.google.com/favicon.ico', contactPerson: 'Katherine Howard', contactEmail: 'university-recruiting@google.com', contactPhone: '+1 650-253-0000', address: 'Mountain View, CA', description: 'Global leader in cloud computing, AI foundation models, enterprise infrastructure, and search.' },
      { name: 'Stripe', industry: 'Fintech & Payment Infrastructure', website: 'https://stripe.com', logoUrl: 'https://stripe.com/favicon.ico', contactPerson: 'Daniel Vance', contactEmail: 'careers@stripe.com', contactPhone: '+1 415-555-0199', address: 'San Francisco, CA', description: 'Financial infrastructure platform building payment and economic rail systems for the internet.' },
      { name: 'Microsoft Azure', industry: 'Enterprise Software & Cloud', website: 'https://azure.microsoft.com', logoUrl: 'https://azure.microsoft.com/favicon.ico', contactPerson: 'Rachel Green', contactEmail: 'campus-jobs@microsoft.com', contactPhone: '+1 425-882-8080', address: 'Redmond, WA', description: 'Worldwide leader in software, cloud solutions, developer platforms, and enterprise AI.' },
    ]).onConflictDoNothing().returning();

    const gCompany = companyRows[0] || (await db.select().from(schema.companies))[0];
    const sCompany = companyRows[1] || (await db.select().from(schema.companies))[1] || gCompany;

    const [drive1] = await db.insert(schema.placementDrives).values({
      title: 'Google Campus Recruitment Drive 2025-26',
      companyId: gCompany.id,
      academicYearId: currentAy.id,
      driveDate: '2025-10-25',
      venue: 'Placement Cell Auditorium & Virtual Assessment Centers',
      eligibilityCriteria: 'Minimum CGPA 7.50, B.Tech CSE / ECE with no active backlogs.',
      packageDetails: '$120,000 - $145,000 CTC + Signing Bonus & Stock Grants',
      status: 'upcoming',
    }).onConflictDoNothing().returning();

    const [job1] = await db.insert(schema.jobOpportunities).values({
      driveId: drive1 ? drive1.id : null,
      companyId: gCompany.id,
      jobTitle: 'Software Engineer - Distributed Systems & Cloud',
      jobRole: 'SWE Level 3',
      jobType: 'full_time',
      salaryPackage: '$135,000 / annum',
      location: 'Sunnyvale, CA / New York, NY (Hybrid)',
      minCgpa: '7.50',
      eligibleDepartments: 'CSE, ECE',
      deadline: '2025-10-18',
      description: 'Design and build resilient, planetary-scale distributed storage and real-time computation pipelines powering next-generation cloud services.',
      requirements: 'Proficiency in Go, Java, or C++, solid grasp of operating systems, concurrency, database indexing, and network protocols.',
    }).onConflictDoNothing().returning();

    const [job2] = await db.insert(schema.jobOpportunities).values({
      companyId: sCompany.id,
      jobTitle: 'Full-Stack Software Engineering Intern',
      jobRole: 'Engineering Intern - Summer 2026',
      jobType: 'internship',
      salaryPackage: '$8,500 / month',
      location: 'Seattle, WA / Remote',
      minCgpa: '7.00',
      eligibleDepartments: 'CSE, ECE, IT',
      deadline: '2025-10-30',
      description: 'Build developer-first APIs, dashboard workflows, and fraud prevention pipelines.',
      requirements: 'Experience with React, TypeScript, Node.js, SQL databases, and automated testing.',
    }).onConflictDoNothing().returning();

    if (job1 && student1) {
      await db.insert(schema.jobApplications).values({
        jobOpportunityId: job1.id,
        studentId: student1.id,
        resumeUrl: 'https://storage.googleapis.com/aitm-resumes/alex_chen_resume.pdf',
        resumeName: 'Alex_Chen_SWE_Resume.pdf',
        status: 'shortlisted',
        currentStage: 'Technical Round 1 (Algorithms & Systems)',
        notes: 'Passed online coding round with 100% test cases passed.',
      }).onConflictDoNothing();
    }

    // 21. Notifications
    if (student1User) {
      await db.insert(schema.notifications).values([
        {
          userId: student1User.id,
          title: 'Assignment Graded',
          message: 'Your submission for DBMS Assignment 1 has been graded: 95/100 (A+).',
          type: 'assignment',
          linkUrl: '/student/assignments',
          isRead: false,
        },
        {
          userId: student1User.id,
          title: 'Placement Shortlist Update',
          message: 'Congratulations! You have been shortlisted for Google Cloud SWE Technical Round 1.',
          type: 'placement',
          linkUrl: '/student/placements',
          isRead: false,
        },
        {
          userId: student1User.id,
          title: 'New Notice Published',
          message: 'InnovateX 2025 National Tech Symposium registrations are now live.',
          type: 'notice',
          linkUrl: '/student/events',
          isRead: true,
        },
      ]).onConflictDoNothing();
    }

    // 22. Audit Logs
    await db.insert(schema.auditLogs).values([
      { userEmail: 'superadmin@aitm.edu', action: 'CREATE', entity: 'Department', entityId: 'CSE', details: 'Initialized Department of Computer Science & Engineering', ipAddress: '10.0.0.1' },
      { userEmail: 'admin@aitm.edu', action: 'PUBLISH', entity: 'Notice', entityId: '1', details: 'Published Institutional Hackathon 2025 announcement', ipAddress: '10.0.0.2' },
      { userEmail: 'sarah.connor@aitm.edu', action: 'ATTENDANCE_MARKED', entity: 'AttendanceSession', entityId: '1', details: 'Marked attendance for CS Year 3 - Sec A (DBMS)', ipAddress: '10.0.0.3' },
      { userEmail: 'sarah.connor@aitm.edu', action: 'GRADE', entity: 'AssignmentSubmission', entityId: '1', details: 'Graded Alex Chen with 95/100', ipAddress: '10.0.0.3' },
    ]).onConflictDoNothing();

    // 23. Help Desk Tickets & Messages
    if (student1User && student2User) {
      const [t1] = await db.insert(schema.helpDeskTickets).values([
        {
          ticketNumber: 'TKT-2025-0101',
          userId: student1User.id,
          category: 'it_support',
          priority: 'high',
          status: 'in_progress',
          subject: 'Campus High-Speed WiFi authentication failing in Turing Block',
          description: 'Unable to connect to eduroam / AITM-Student-Secure WiFi network on 3rd floor Alan Turing block. Getting 802.1X credential handshake timeout.',
          departmentId: cseDept.id,
          contactPhone: '+1 555-0106',
        },
      ]).onConflictDoNothing().returning();

      if (t1) {
        await db.insert(schema.ticketMessages).values([
          {
            ticketId: t1.id,
            senderId: student1User.id,
            message: 'Attaching MAC address for reference: 3C:22:FB:4A:11:90',
          },
        ]).onConflictDoNothing();
      }

      await db.insert(schema.helpDeskTickets).values([
        {
          ticketNumber: 'TKT-2025-0102',
          userId: student2User.id,
          category: 'academic',
          priority: 'medium',
          status: 'resolved',
          subject: 'Elective Course Grade Transcript Discrepancy (CS-402)',
          description: 'Final semester grade sheet for CS-402 Cloud Architecture reflects B+ instead of A earned on coursework portfolio.',
          departmentId: cseDept.id,
          adminResponse: 'Grade updated following faculty confirmation from Prof. Sarah Connor. Official transcript refreshed on student portal.',
          resolvedAt: new Date(),
        },
      ]).onConflictDoNothing();
    }

    console.log('Database seeded successfully with institutional demo data!');
  } catch (error) {
    console.error('Error during database seed:', error);
  }
}
