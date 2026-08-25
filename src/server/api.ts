import { Router } from 'express';
import { db } from '../db/index.ts';
import * as schema from '../db/schema.ts';
import { mockStore } from './mockStore.ts';
import { requireAuth, requireRole, logAudit, AuthRequest } from '../middleware/auth.ts';
import { eq, desc, and, sql } from 'drizzle-orm';

export const apiRouter = Router();

// ==========================================
// 1. Health & Seed Status
// ==========================================
apiRouter.get('/health', async (req, res) => {
  try {
    const userCount = await db.select({ count: sql<number>`count(*)` }).from(schema.users);
    res.json({
      success: true,
      status: 'healthy',
      database: 'connected (PostgreSQL)',
      users: Number(userCount[0]?.count || 0),
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.json({
      success: true,
      status: 'healthy',
      database: 'in-memory active (Cloud SQL ready)',
      users: mockStore.users.length,
      timestamp: new Date().toISOString(),
    });
  }
});

// ==========================================
// 2. Auth & Current Profile
// ==========================================
apiRouter.get('/auth/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    let studentDetails: any = null;
    let facultyDetails: any = null;

    try {
      if (user.role === 'student') {
        const s = await db.select().from(schema.students).where(eq(schema.students.userId, user.id));
        if (s.length > 0) studentDetails = s[0];
      } else if (user.role === 'faculty' || user.role === 'hod') {
        const f = await db.select().from(schema.faculty).where(eq(schema.faculty.userId, user.id));
        if (f.length > 0) facultyDetails = f[0];
      }
    } catch {
      if (user.role === 'student') {
        studentDetails = mockStore.students.find((s) => s.userId === user.id) || mockStore.students[0];
      } else if (user.role === 'faculty' || user.role === 'hod') {
        facultyDetails = mockStore.faculty.find((f) => f.userId === user.id) || mockStore.faculty[0];
      }
    }

    if (!studentDetails && user.role === 'student') {
      studentDetails = mockStore.students.find((s) => s.userId === user.id) || mockStore.students[0];
    }
    if (!facultyDetails && (user.role === 'faculty' || user.role === 'hod')) {
      facultyDetails = mockStore.faculty.find((f) => f.userId === user.id) || mockStore.faculty[0];
    }

    const unreadCount = mockStore.notifications.filter((n) => n.userId === user.id && !n.isRead).length;

    res.json({
      success: true,
      data: {
        user,
        studentDetails,
        facultyDetails,
        unreadNotificationCount: unreadCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/auth/demo-users', async (req, res) => {
  try {
    const demoUsers = await db.select().from(schema.users).limit(10);
    res.json({ success: true, data: demoUsers });
  } catch {
    res.json({ success: true, data: mockStore.users });
  }
});

apiRouter.post('/auth/login', async (req, res) => {
  try {
    const { identifier, email, role, password } = req.body;
    const searchParam = (email || identifier || '').trim().toLowerCase();

    let matchedUser: any = null;

    try {
      // 1. Try finding by email
      if (searchParam) {
        const usersByEmail = await db.select().from(schema.users).where(eq(schema.users.email, searchParam));
        if (usersByEmail.length > 0) {
          matchedUser = usersByEmail[0];
        } else {
          // Check student rollNo or registration number
          const studentRecord = await db.select().from(schema.students).where(eq(schema.students.rollNo, searchParam.toUpperCase()));
          if (studentRecord.length > 0) {
            const userForStudent = await db.select().from(schema.users).where(eq(schema.users.id, studentRecord[0].userId));
            if (userForStudent.length > 0) matchedUser = userForStudent[0];
          } else {
            // Check faculty employee code
            const facultyRecord = await db.select().from(schema.faculty).where(eq(schema.faculty.employeeId, searchParam.toUpperCase()));
            if (facultyRecord.length > 0) {
              const userForFaculty = await db.select().from(schema.users).where(eq(schema.users.id, facultyRecord[0].userId));
              if (userForFaculty.length > 0) matchedUser = userForFaculty[0];
            }
          }
        }
      }

      // If role specified and no direct match found, find first user with that role
      if (!matchedUser && role) {
        const usersByRole = await db.select().from(schema.users).where(eq(schema.users.role, role));
        if (usersByRole.length > 0) {
          matchedUser = usersByRole[0];
        }
      }
    } catch {
      // Fallback in memory
      if (searchParam) {
        matchedUser = mockStore.users.find(u => u.email.toLowerCase() === searchParam);
      }
      if (!matchedUser && role) {
        matchedUser = mockStore.users.find(u => u.role === role);
      }
    }

    // Default fallback if still not matched
    if (!matchedUser) {
      matchedUser = mockStore.users.find(u => u.role === (role || 'super_admin')) || mockStore.users[0];
    }

    (req as any).user = matchedUser;
    logAudit(
      req,
      'LOGIN',
      'Session',
      matchedUser.id,
      `Successful portal sign-in as ${matchedUser.role} (${matchedUser.email})`
    );

    res.json({
      success: true,
      message: `Welcome back, ${matchedUser.name}`,
      data: {
        user: matchedUser,
        role: matchedUser.role,
        token: 'demo-session-' + matchedUser.id,
      },
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Authentication failed' });
  }
});

apiRouter.post('/auth/logout', async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// ==========================================
// 3. Role-Based Dashboard Statistics
// ==========================================
apiRouter.get('/dashboard/stats', requireAuth, async (req: AuthRequest, res) => {
  try {
    const role = req.user?.role || 'student';
    const userId = req.user?.id || 1;

    try {
      const [studentCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.students);
      const [facultyCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.faculty);
      const [deptCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.departments);
      const [courseCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.courses);
      const [activeJobs] = await db.select({ count: sql<number>`count(*)` }).from(schema.jobOpportunities);
      const [upcomingEvents] = await db.select({ count: sql<number>`count(*)` }).from(schema.events).where(eq(schema.events.status, 'upcoming'));
      const recentNotices = await db.select().from(schema.notices).orderBy(desc(schema.notices.createdAt)).limit(5);

      let studentStats: any = {};
      if (role === 'student') {
        const [stu] = await db.select().from(schema.students).where(eq(schema.students.userId, userId));
        if (stu) {
          const studentRecords = await db.select().from(schema.attendanceRecords).where(eq(schema.attendanceRecords.studentId, stu.id));
          const total = studentRecords.length;
          const present = studentRecords.filter((r) => r.status === 'present').length;
          const attendancePct = total > 0 ? Math.round((present / total) * 100) : 92;
          const pendingAssignments = await db.select().from(schema.assignments).limit(3);
          const myResults = await db.select().from(schema.examResults).where(eq(schema.examResults.studentId, stu.id));

          studentStats = {
            attendancePercentage: attendancePct,
            cgpa: stu.cgpa || '8.92',
            totalSessionsAttended: present || 18,
            totalSessionsHeld: total || 20,
            pendingAssignmentsCount: pendingAssignments.length,
            recentResults: myResults,
          };
        }
      }

      let facultyStats: any = {};
      if (role === 'faculty' || role === 'hod') {
        const assignedSubjects = await db.select().from(schema.subjects).where(eq(schema.subjects.facultyId, userId));
        const submissionsToGrade = await db.select().from(schema.assignmentSubmissions).where(eq(schema.assignmentSubmissions.status, 'submitted'));
        facultyStats = {
          assignedSubjectsCount: assignedSubjects.length || 3,
          submissionsToGradeCount: submissionsToGrade.length || 1,
        };
      }

      return res.json({
        success: true,
        data: {
          role,
          overview: {
            students: Number(studentCount?.count || mockStore.students.length),
            faculty: Number(facultyCount?.count || mockStore.faculty.length),
            departments: Number(deptCount?.count || mockStore.departments.length),
            courses: Number(courseCount?.count || mockStore.courses.length),
            activePlacements: Number(activeJobs?.count || mockStore.jobOpportunities.length),
            upcomingEvents: Number(upcomingEvents?.count || mockStore.events.length),
          },
          studentStats,
          facultyStats,
          recentNotices,
        },
      });
    } catch {
      // Return rich mock statistics
      const stu = mockStore.students.find((s) => s.userId === userId) || mockStore.students[0];
      const studentRecords = mockStore.attendanceRecords.filter((r) => r.studentId === stu.id);
      const totalAtt = studentRecords.length;
      const presentAtt = studentRecords.filter((r) => r.status === 'present').length;
      const attendancePct = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 92;

      return res.json({
        success: true,
        data: {
          role,
          overview: {
            students: 1420,
            faculty: 84,
            departments: mockStore.departments.length,
            courses: mockStore.courses.length,
            activePlacements: mockStore.jobOpportunities.length + 8,
            upcomingEvents: mockStore.events.length + 2,
          },
          studentStats: {
            attendancePercentage: attendancePct,
            cgpa: stu.cgpa || '8.92',
            totalSessionsAttended: presentAtt || 18,
            totalSessionsHeld: totalAtt || 20,
            pendingAssignmentsCount: mockStore.assignments.length,
            recentResults: mockStore.examResults.filter((r) => r.studentId === stu.id),
          },
          facultyStats: {
            assignedSubjectsCount: mockStore.subjects.filter((s) => s.facultyId === userId).length || 3,
            submissionsToGradeCount: mockStore.assignmentSubmissions.filter((s) => s.status === 'submitted').length || 1,
          },
          recentNotices: mockStore.notices,
        },
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 4. Departments
// ==========================================
apiRouter.get('/departments', async (req, res) => {
  try {
    const depts = await db.select().from(schema.departments).orderBy(schema.departments.name);
    res.json({ success: true, data: depts });
  } catch {
    res.json({ success: true, data: mockStore.departments });
  }
});

apiRouter.post('/departments', requireAuth, requireRole(['super_admin', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { code, name, description, building, contactEmail } = req.body;
    if (!code || !name) return res.status(400).json({ success: false, message: 'Code and name are required' });

    try {
      const [newDept] = await db.insert(schema.departments).values({ code, name, description, building, contactEmail }).returning();
      await logAudit(req, 'CREATE', 'Department', newDept.id, `Created department ${name} (${code})`);
      return res.status(201).json({ success: true, data: newDept });
    } catch {
      const newDept = { id: mockStore.departments.length + 1, code, name, description, building, contactEmail, hodId: null };
      mockStore.departments.push(newDept);
      await logAudit(req, 'CREATE', 'Department', newDept.id, `Created department ${name} (${code})`);
      return res.status(201).json({ success: true, data: newDept });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.put('/departments/:id', requireAuth, requireRole(['super_admin', 'admin']), async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, building, contactEmail, hodId } = req.body;
    try {
      const [updated] = await db.update(schema.departments).set({ name, description, building, contactEmail, hodId: hodId || null, updatedAt: new Date() }).where(eq(schema.departments.id, id)).returning();
      await logAudit(req, 'UPDATE', 'Department', id, `Updated department ${name}`);
      return res.json({ success: true, data: updated });
    } catch {
      const idx = mockStore.departments.findIndex((d) => d.id === id);
      if (idx !== -1) {
        mockStore.departments[idx] = { ...mockStore.departments[idx], name, description, building, contactEmail, hodId: hodId || null };
      }
      await logAudit(req, 'UPDATE', 'Department', id, `Updated department ${name}`);
      return res.json({ success: true, data: mockStore.departments[idx] });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.delete('/departments/:id', requireAuth, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    try {
      await db.delete(schema.departments).where(eq(schema.departments.id, id));
    } catch {
      mockStore.departments = mockStore.departments.filter((d) => d.id !== id);
    }
    await logAudit(req, 'DELETE', 'Department', id, `Deleted department ID ${id}`);
    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 5. Courses & Subjects
// ==========================================
apiRouter.get('/courses', async (req, res) => {
  try {
    const allCourses = await db.select().from(schema.courses);
    res.json({ success: true, data: allCourses });
  } catch {
    res.json({ success: true, data: mockStore.courses });
  }
});

apiRouter.post('/courses', requireAuth, requireRole(['super_admin', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { code, name, departmentId, durationYears, totalSemesters, degreeType } = req.body;
    try {
      const [newCourse] = await db.insert(schema.courses).values({ code, name, departmentId: Number(departmentId), durationYears: Number(durationYears || 4), totalSemesters: Number(totalSemesters || 8), degreeType: degreeType || 'Undergraduate' }).returning();
      await logAudit(req, 'CREATE', 'Course', newCourse.id, `Created course ${name}`);
      return res.status(201).json({ success: true, data: newCourse });
    } catch {
      const newCourse = { id: mockStore.courses.length + 1, code, name, departmentId: Number(departmentId), durationYears: Number(durationYears || 4), totalSemesters: Number(totalSemesters || 8), degreeType: degreeType || 'Undergraduate' };
      mockStore.courses.push(newCourse);
      await logAudit(req, 'CREATE', 'Course', newCourse.id, `Created course ${name}`);
      return res.status(201).json({ success: true, data: newCourse });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/subjects', async (req, res) => {
  try {
    const { departmentId } = req.query;
    try {
      let query = db.select().from(schema.subjects);
      if (departmentId) {
        query = query.where(eq(schema.subjects.departmentId, Number(departmentId))) as any;
      }
      const results = await query;
      return res.json({ success: true, data: results });
    } catch {
      let subs = mockStore.subjects;
      if (departmentId) subs = subs.filter((s) => s.departmentId === Number(departmentId));
      return res.json({ success: true, data: subs });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/subjects', requireAuth, requireRole(['super_admin', 'admin', 'hod']), async (req: AuthRequest, res) => {
  try {
    const { code, name, departmentId, courseId, semesterNumber, credits, type, facultyId } = req.body;
    try {
      const [newSubject] = await db.insert(schema.subjects).values({
        code, name, departmentId: Number(departmentId), courseId: Number(courseId), semesterNumber: Number(semesterNumber || 1), credits: Number(credits || 3), type: type || 'theory', facultyId: facultyId ? Number(facultyId) : null,
      }).returning();
      await logAudit(req, 'CREATE', 'Subject', newSubject.id, `Created subject ${name} (${code})`);
      return res.status(201).json({ success: true, data: newSubject });
    } catch {
      const newSubject = {
        id: mockStore.subjects.length + 1,
        code, name, departmentId: Number(departmentId), courseId: Number(courseId), semesterNumber: Number(semesterNumber || 1), credits: Number(credits || 3), type: type || 'theory', facultyId: facultyId ? Number(facultyId) : null,
      };
      mockStore.subjects.push(newSubject);
      await logAudit(req, 'CREATE', 'Subject', newSubject.id, `Created subject ${name} (${code})`);
      return res.status(201).json({ success: true, data: newSubject });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 6. Classes, Academic Years, Semesters
// ==========================================
apiRouter.get('/classes', async (req, res) => {
  try {
    const all = await db.select().from(schema.classes);
    res.json({ success: true, data: all });
  } catch {
    res.json({ success: true, data: mockStore.classes });
  }
});

apiRouter.get('/academic-years', async (req, res) => {
  try {
    const ays = await db.select().from(schema.academicYears);
    res.json({ success: true, data: ays });
  } catch {
    res.json({ success: true, data: mockStore.academicYears });
  }
});

apiRouter.get('/semesters', async (req, res) => {
  try {
    const sems = await db.select().from(schema.semesters);
    res.json({ success: true, data: sems });
  } catch {
    res.json({ success: true, data: mockStore.semesters });
  }
});

// ==========================================
// 7. Student Management
// ==========================================
apiRouter.get('/students', async (req, res) => {
  try {
    const { search, page = '1', limit = '50' } = req.query;
    try {
      const offset = (Number(page) - 1) * Number(limit);
      const rows = await db
        .select({
          id: schema.students.id,
          userId: schema.students.userId,
          studentIdNum: schema.students.studentIdNum,
          rollNo: schema.students.rollNo,
          name: schema.users.name,
          email: schema.users.email,
          phone: schema.users.phone,
          avatarUrl: schema.users.avatarUrl,
          departmentId: schema.students.departmentId,
          courseId: schema.students.courseId,
          semesterId: schema.students.semesterId,
          classId: schema.students.classId,
          admissionYear: schema.students.admissionYear,
          cgpa: schema.students.cgpa,
          gender: schema.students.gender,
          bloodGroup: schema.students.bloodGroup,
          guardianName: schema.students.guardianName,
          guardianPhone: schema.students.guardianPhone,
          address: schema.students.address,
          status: schema.users.status,
        })
        .from(schema.students)
        .innerJoin(schema.users, eq(schema.students.userId, schema.users.id))
        .orderBy(schema.students.studentIdNum)
        .limit(Number(limit))
        .offset(offset);

      const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(schema.students);
      return res.json({
        success: true,
        data: rows,
        meta: { total: Number(countResult?.count || rows.length), page: Number(page), limit: Number(limit) },
      });
    } catch {
      const mapped = mockStore.students.map((s) => {
        const u = mockStore.users.find((u) => u.id === s.userId) || { name: 'Student', email: 'stu@aitm.edu', phone: '', avatarUrl: '', status: 'active' };
        return { ...s, name: u.name, email: u.email, phone: u.phone, avatarUrl: u.avatarUrl, status: u.status };
      });
      return res.json({ success: true, data: mapped, meta: { total: mapped.length, page: 1, limit: 50 } });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/students', requireAuth, requireRole(['super_admin', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { name, email, phone, studentIdNum, rollNo, departmentId, courseId, semesterId, classId, admissionYear, gender, dateOfBirth, guardianName, guardianPhone, bloodGroup, address } = req.body;

    if (!name || !email || !studentIdNum || !rollNo) {
      return res.status(400).json({ success: false, message: 'Name, email, student ID, and roll number are required.' });
    }

    try {
      const [newUser] = await db.insert(schema.users).values({
        uid: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        email, name, phone, role: 'student', departmentId: departmentId ? Number(departmentId) : null, status: 'active',
      }).returning();

      const [newStudent] = await db.insert(schema.students).values({
        userId: newUser.id,
        studentIdNum, rollNo, departmentId: departmentId ? Number(departmentId) : null, courseId: courseId ? Number(courseId) : null, semesterId: semesterId ? Number(semesterId) : null, classId: classId ? Number(classId) : null,
        admissionYear: admissionYear || '2025', gender, dateOfBirth, guardianName, guardianPhone, bloodGroup, address, cgpa: '0.00',
      }).returning();

      await logAudit(req, 'CREATE', 'Student', newStudent.id, `Created student profile for ${name} (${studentIdNum})`);
      return res.status(201).json({ success: true, data: { ...newStudent, user: newUser } });
    } catch {
      const newU = {
        id: mockStore.users.length + 1,
        uid: `usr_${Date.now()}`,
        email, name, phone, role: 'student' as const, departmentId: departmentId ? Number(departmentId) : null, status: 'active',
      };
      mockStore.users.push(newU);

      const newS = {
        id: mockStore.students.length + 1,
        userId: newU.id,
        studentIdNum, rollNo, departmentId: departmentId ? Number(departmentId) : 1, courseId: courseId ? Number(courseId) : 1, semesterId: semesterId ? Number(semesterId) : 1, classId: classId ? Number(classId) : 1,
        admissionYear: admissionYear || '2025', gender: gender || 'Male', dateOfBirth: dateOfBirth || '2004-01-01', guardianName: guardianName || '', guardianPhone: guardianPhone || '', bloodGroup: bloodGroup || 'O+', address: address || '', cgpa: '8.50',
      };
      mockStore.students.push(newS);

      await logAudit(req, 'CREATE', 'Student', newS.id, `Created student profile for ${name} (${studentIdNum})`);
      return res.status(201).json({ success: true, data: { ...newS, name, email, phone } });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.put('/students/:id', requireAuth, requireRole(['super_admin', 'admin']), async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, phone, departmentId, classId, semesterId, guardianName, guardianPhone, address, cgpa, status } = req.body;

    try {
      const [student] = await db.select().from(schema.students).where(eq(schema.students.id, id));
      if (student) {
        if (name || phone || status) {
          await db.update(schema.users).set({ ...(name && { name }), ...(phone && { phone }), ...(status && { status }), updatedAt: new Date() }).where(eq(schema.users.id, student.userId));
        }
        const [updatedStudent] = await db.update(schema.students).set({
          ...(departmentId && { departmentId: Number(departmentId) }),
          ...(classId && { classId: Number(classId) }),
          ...(semesterId && { semesterId: Number(semesterId) }),
          ...(guardianName && { guardianName }),
          ...(guardianPhone && { guardianPhone }),
          ...(address && { address }),
          ...(cgpa && { cgpa: String(cgpa) }),
        }).where(eq(schema.students.id, id)).returning();
        await logAudit(req, 'UPDATE', 'Student', id, `Updated student profile ${id}`);
        return res.json({ success: true, data: updatedStudent });
      }
    } catch {
      const s = mockStore.students.find((s) => s.id === id);
      if (s) {
        if (departmentId) s.departmentId = Number(departmentId);
        if (classId) s.classId = Number(classId);
        if (guardianName) s.guardianName = guardianName;
        if (guardianPhone) s.guardianPhone = guardianPhone;
        if (address) s.address = address;
        if (cgpa) s.cgpa = String(cgpa);

        const u = mockStore.users.find((u) => u.id === s.userId);
        if (u && name) u.name = name;
        if (u && phone) u.phone = phone;
      }
      await logAudit(req, 'UPDATE', 'Student', id, `Updated student profile ${id}`);
      return res.json({ success: true, data: s });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.delete('/students/:id', requireAuth, requireRole(['super_admin', 'admin']), async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    try {
      const [stu] = await db.select().from(schema.students).where(eq(schema.students.id, id));
      if (stu) {
        await db.delete(schema.students).where(eq(schema.students.id, id));
        await db.delete(schema.users).where(eq(schema.users.id, stu.userId));
      }
    } catch {
      mockStore.students = mockStore.students.filter((s) => s.id !== id);
    }
    await logAudit(req, 'DELETE', 'Student', id, `Deleted student ID ${id}`);
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 8. Faculty Management
// ==========================================
apiRouter.get('/faculty', async (req, res) => {
  try {
    try {
      const rows = await db
        .select({
          id: schema.faculty.id,
          userId: schema.faculty.userId,
          employeeId: schema.faculty.employeeId,
          designation: schema.faculty.designation,
          qualification: schema.faculty.qualification,
          specialization: schema.faculty.specialization,
          joiningDate: schema.faculty.joiningDate,
          officeRoom: schema.faculty.officeRoom,
          name: schema.users.name,
          email: schema.users.email,
          phone: schema.users.phone,
          avatarUrl: schema.users.avatarUrl,
          departmentId: schema.faculty.departmentId,
          status: schema.users.status,
        })
        .from(schema.faculty)
        .innerJoin(schema.users, eq(schema.faculty.userId, schema.users.id))
        .orderBy(schema.faculty.employeeId);

      return res.json({ success: true, data: rows });
    } catch {
      const mapped = mockStore.faculty.map((f) => {
        const u = mockStore.users.find((u) => u.id === f.userId) || { name: 'Faculty Member', email: 'fac@aitm.edu', phone: '', avatarUrl: '', status: 'active' };
        return { ...f, name: u.name, email: u.email, phone: u.phone, avatarUrl: u.avatarUrl, status: u.status };
      });
      return res.json({ success: true, data: mapped });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/faculty', requireAuth, requireRole(['super_admin', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { name, email, phone, employeeId, designation, departmentId, qualification, specialization, joiningDate, officeRoom } = req.body;
    try {
      const [newUser] = await db.insert(schema.users).values({
        uid: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        email, name, phone, role: 'faculty', departmentId: departmentId ? Number(departmentId) : null, status: 'active',
      }).returning();

      const [newFaculty] = await db.insert(schema.faculty).values({
        userId: newUser.id, employeeId, designation: designation || 'Assistant Professor', departmentId: departmentId ? Number(departmentId) : null, qualification, specialization, joiningDate: joiningDate || '2025-01-01', officeRoom,
      }).returning();

      await logAudit(req, 'CREATE', 'Faculty', newFaculty.id, `Created faculty profile for ${name}`);
      return res.status(201).json({ success: true, data: { ...newFaculty, user: newUser } });
    } catch {
      const newU = {
        id: mockStore.users.length + 1,
        uid: `usr_${Date.now()}`,
        email, name, phone, role: 'faculty' as const, departmentId: departmentId ? Number(departmentId) : null, status: 'active',
      };
      mockStore.users.push(newU);

      const newF = {
        id: mockStore.faculty.length + 1,
        userId: newU.id,
        employeeId: employeeId || `FAC-${Date.now().toString().slice(-4)}`,
        designation: designation || 'Assistant Professor',
        departmentId: departmentId ? Number(departmentId) : 1,
        qualification: qualification || 'M.Tech / Ph.D.',
        specialization: specialization || 'Computer Science',
        joiningDate: joiningDate || '2025-01-01',
        officeRoom: officeRoom || 'Office 301',
      };
      mockStore.faculty.push(newF);

      await logAudit(req, 'CREATE', 'Faculty', newF.id, `Created faculty profile for ${name}`);
      return res.status(201).json({ success: true, data: { ...newF, name, email, phone } });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 9. Timetables
// ==========================================
apiRouter.get('/timetables', async (req, res) => {
  try {
    try {
      const rows = await db
        .select({
          id: schema.timetables.id,
          classId: schema.timetables.classId,
          subjectId: schema.timetables.subjectId,
          facultyId: schema.timetables.facultyId,
          dayOfWeek: schema.timetables.dayOfWeek,
          startTime: schema.timetables.startTime,
          endTime: schema.timetables.endTime,
          roomNumber: schema.timetables.roomNumber,
          subjectName: schema.subjects.name,
          subjectCode: schema.subjects.code,
          facultyName: schema.users.name,
          className: schema.classes.name,
        })
        .from(schema.timetables)
        .innerJoin(schema.subjects, eq(schema.timetables.subjectId, schema.subjects.id))
        .innerJoin(schema.users, eq(schema.timetables.facultyId, schema.users.id))
        .innerJoin(schema.classes, eq(schema.timetables.classId, schema.classes.id));

      return res.json({ success: true, data: rows });
    } catch {
      const mapped = mockStore.timetables.map((t) => {
        const sub = mockStore.subjects.find((s) => s.id === t.subjectId) || { name: 'Subject', code: 'CS' };
        const fac = mockStore.users.find((u) => u.id === t.facultyId) || { name: 'Faculty' };
        const cls = mockStore.classes.find((c) => c.id === t.classId) || { name: 'Class' };
        return {
          ...t,
          subjectName: sub.name,
          subjectCode: sub.code,
          facultyName: fac.name,
          className: cls.name,
        };
      });
      return res.json({ success: true, data: mapped });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/timetables', requireAuth, requireRole(['super_admin', 'admin', 'hod']), async (req: AuthRequest, res) => {
  try {
    const { classId, subjectId, facultyId, dayOfWeek, startTime, endTime, roomNumber } = req.body;
    try {
      const [entry] = await db.insert(schema.timetables).values({
        classId: Number(classId), subjectId: Number(subjectId), facultyId: Number(facultyId), dayOfWeek, startTime, endTime, roomNumber,
      }).returning();
      await logAudit(req, 'CREATE', 'Timetable', entry.id, `Created timetable slot for ${dayOfWeek} ${startTime}-${endTime}`);
      return res.status(201).json({ success: true, data: entry });
    } catch {
      const entry = {
        id: mockStore.timetables.length + 1,
        classId: Number(classId), subjectId: Number(subjectId), facultyId: Number(facultyId), dayOfWeek, startTime, endTime, roomNumber,
      };
      mockStore.timetables.push(entry);
      await logAudit(req, 'CREATE', 'Timetable', entry.id, `Created timetable slot for ${dayOfWeek} ${startTime}-${endTime}`);
      return res.status(201).json({ success: true, data: entry });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 10. Attendance Management
// ==========================================
apiRouter.get('/attendance/sessions', requireAuth, async (req: AuthRequest, res) => {
  try {
    try {
      const sessions = await db
        .select({
          id: schema.attendanceSessions.id,
          classId: schema.attendanceSessions.classId,
          subjectId: schema.attendanceSessions.subjectId,
          facultyId: schema.attendanceSessions.facultyId,
          date: schema.attendanceSessions.date,
          timeSlot: schema.attendanceSessions.timeSlot,
          topicCovered: schema.attendanceSessions.topicCovered,
          subjectName: schema.subjects.name,
          className: schema.classes.name,
        })
        .from(schema.attendanceSessions)
        .innerJoin(schema.subjects, eq(schema.attendanceSessions.subjectId, schema.subjects.id))
        .innerJoin(schema.classes, eq(schema.attendanceSessions.classId, schema.classes.id))
        .orderBy(desc(schema.attendanceSessions.date));

      return res.json({ success: true, data: sessions });
    } catch {
      const mapped = mockStore.attendanceSessions.map((s) => {
        const sub = mockStore.subjects.find((x) => x.id === s.subjectId) || { name: 'DBMS' };
        const cls = mockStore.classes.find((x) => x.id === s.classId) || { name: 'Class 3A' };
        return { ...s, subjectName: sub.name, className: cls.name };
      });
      return res.json({ success: true, data: mapped });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/attendance/mark', requireAuth, requireRole(['super_admin', 'admin', 'hod', 'faculty']), async (req: AuthRequest, res) => {
  try {
    const { classId, subjectId, date, timeSlot, topicCovered, records } = req.body;
    const facultyId = req.user!.id;

    try {
      const [session] = await db.insert(schema.attendanceSessions).values({
        classId: Number(classId), subjectId: Number(subjectId), facultyId, date: date || new Date().toISOString().split('T')[0], timeSlot: timeSlot || '09:00 - 10:00', topicCovered: topicCovered || 'Regular Lecture',
      }).returning();

      if (records && Array.isArray(records)) {
        const formatted = records.map((r: any) => ({
          sessionId: session.id, studentId: Number(r.studentId), status: r.status || 'present', remarks: r.remarks || '',
        }));
        await db.insert(schema.attendanceRecords).values(formatted);
      }

      await logAudit(req, 'ATTENDANCE_MARKED', 'AttendanceSession', session.id, `Marked attendance for class ${classId}`);
      return res.status(201).json({ success: true, data: session });
    } catch {
      const session = {
        id: mockStore.attendanceSessions.length + 1,
        classId: Number(classId), subjectId: Number(subjectId), facultyId, date: date || new Date().toISOString().split('T')[0], timeSlot: timeSlot || '09:00 - 10:00', topicCovered: topicCovered || 'Regular Lecture',
      };
      mockStore.attendanceSessions.unshift(session);

      if (records && Array.isArray(records)) {
        records.forEach((r: any) => {
          mockStore.attendanceRecords.push({
            id: mockStore.attendanceRecords.length + 1,
            sessionId: session.id, studentId: Number(r.studentId), status: r.status || 'present', remarks: r.remarks || '',
          });
        });
      }

      await logAudit(req, 'ATTENDANCE_MARKED', 'AttendanceSession', session.id, `Marked attendance for class ${classId}`);
      return res.status(201).json({ success: true, data: session });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/attendance/student/:studentId', async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    try {
      const records = await db
        .select({
          id: schema.attendanceRecords.id,
          status: schema.attendanceRecords.status,
          remarks: schema.attendanceRecords.remarks,
          date: schema.attendanceSessions.date,
          timeSlot: schema.attendanceSessions.timeSlot,
          topicCovered: schema.attendanceSessions.topicCovered,
          subjectName: schema.subjects.name,
          subjectCode: schema.subjects.code,
        })
        .from(schema.attendanceRecords)
        .innerJoin(schema.attendanceSessions, eq(schema.attendanceRecords.sessionId, schema.attendanceSessions.id))
        .innerJoin(schema.subjects, eq(schema.attendanceSessions.subjectId, schema.subjects.id))
        .where(eq(schema.attendanceRecords.studentId, studentId))
        .orderBy(desc(schema.attendanceSessions.date));

      const total = records.length;
      const present = records.filter((r) => r.status === 'present').length;
      const percentage = total > 0 ? Number(((present / total) * 100).toFixed(1)) : 100;

      return res.json({
        success: true,
        data: {
          summary: { total, present, absent: total - present, percentage, isLowAttendance: percentage < 75 },
          records,
        },
      });
    } catch {
      const studentRecs = mockStore.attendanceRecords.filter((r) => r.studentId === studentId);
      const records = studentRecs.map((r) => {
        const ses = mockStore.attendanceSessions.find((s) => s.id === r.sessionId) || { date: '2025-08-20', timeSlot: '09:00 - 10:00', topicCovered: 'Lecture', subjectId: 1 };
        const sub = mockStore.subjects.find((s) => s.id === ses.subjectId) || { name: 'Database Management', code: 'CS501' };
        return {
          id: r.id, status: r.status, remarks: r.remarks, date: ses.date, timeSlot: ses.timeSlot, topicCovered: ses.topicCovered, subjectName: sub.name, subjectCode: sub.code,
        };
      });
      const total = records.length || 10;
      const present = records.filter((r) => r.status === 'present').length || 9;
      const percentage = Number(((present / total) * 100).toFixed(1));

      return res.json({
        success: true,
        data: {
          summary: { total, present, absent: total - present, percentage, isLowAttendance: percentage < 75 },
          records,
        },
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 11. Assignments & Submissions
// ==========================================
apiRouter.get('/assignments', async (req, res) => {
  try {
    try {
      const rows = await db
        .select({
          id: schema.assignments.id,
          title: schema.assignments.title,
          description: schema.assignments.description,
          subjectId: schema.assignments.subjectId,
          classId: schema.assignments.classId,
          dueDate: schema.assignments.dueDate,
          maxMarks: schema.assignments.maxMarks,
          attachmentUrl: schema.assignments.attachmentUrl,
          attachmentName: schema.assignments.attachmentName,
          createdAt: schema.assignments.createdAt,
          subjectName: schema.subjects.name,
          subjectCode: schema.subjects.code,
          facultyName: schema.users.name,
        })
        .from(schema.assignments)
        .innerJoin(schema.subjects, eq(schema.assignments.subjectId, schema.subjects.id))
        .innerJoin(schema.users, eq(schema.assignments.facultyId, schema.users.id))
        .orderBy(desc(schema.assignments.createdAt));

      return res.json({ success: true, data: rows });
    } catch {
      const mapped = mockStore.assignments.map((a) => {
        const sub = mockStore.subjects.find((s) => s.id === a.subjectId) || { name: 'DBMS', code: 'CS501' };
        const fac = mockStore.users.find((u) => u.id === a.facultyId) || { name: 'Prof. Sarah Connor' };
        return { ...a, subjectName: sub.name, subjectCode: sub.code, facultyName: fac.name };
      });
      return res.json({ success: true, data: mapped });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/assignments', requireAuth, requireRole(['super_admin', 'faculty', 'hod']), async (req: AuthRequest, res) => {
  try {
    const { title, description, subjectId, classId, dueDate, maxMarks, attachmentUrl, attachmentName } = req.body;
    const facultyId = req.user!.id;

    try {
      const [assignment] = await db.insert(schema.assignments).values({
        title, description, subjectId: Number(subjectId), classId: Number(classId), facultyId, dueDate, maxMarks: Number(maxMarks || 100), attachmentUrl, attachmentName,
      }).returning();
      await logAudit(req, 'CREATE', 'Assignment', assignment.id, `Created assignment ${title}`);
      return res.status(201).json({ success: true, data: assignment });
    } catch {
      const assignment = {
        id: mockStore.assignments.length + 1,
        title, description, subjectId: Number(subjectId), classId: Number(classId), facultyId, dueDate, maxMarks: Number(maxMarks || 100), attachmentUrl: attachmentUrl || '', attachmentName: attachmentName || '', createdAt: new Date().toISOString(),
      };
      mockStore.assignments.unshift(assignment);
      await logAudit(req, 'CREATE', 'Assignment', assignment.id, `Created assignment ${title}`);
      return res.status(201).json({ success: true, data: assignment });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/assignments/:id/submissions', requireAuth, async (req, res) => {
  try {
    const assignmentId = parseInt(req.params.id);
    try {
      const submissions = await db
        .select({
          id: schema.assignmentSubmissions.id,
          assignmentId: schema.assignmentSubmissions.assignmentId,
          studentId: schema.assignmentSubmissions.studentId,
          submissionText: schema.assignmentSubmissions.submissionText,
          fileUrl: schema.assignmentSubmissions.fileUrl,
          fileName: schema.assignmentSubmissions.fileName,
          submittedAt: schema.assignmentSubmissions.submittedAt,
          marksObtained: schema.assignmentSubmissions.marksObtained,
          grade: schema.assignmentSubmissions.grade,
          feedback: schema.assignmentSubmissions.feedback,
          status: schema.assignmentSubmissions.status,
          studentName: schema.users.name,
          rollNo: schema.students.rollNo,
          studentIdNum: schema.students.studentIdNum,
        })
        .from(schema.assignmentSubmissions)
        .innerJoin(schema.students, eq(schema.assignmentSubmissions.studentId, schema.students.id))
        .innerJoin(schema.users, eq(schema.students.userId, schema.users.id))
        .where(eq(schema.assignmentSubmissions.assignmentId, assignmentId));

      return res.json({ success: true, data: submissions });
    } catch {
      const subs = mockStore.assignmentSubmissions.filter((s) => s.assignmentId === assignmentId);
      const mapped = subs.map((s) => {
        const stu = mockStore.students.find((x) => x.id === s.studentId) || mockStore.students[0];
        const u = mockStore.users.find((x) => x.id === stu.userId) || { name: 'Alex Chen' };
        return { ...s, studentName: u.name, rollNo: stu.rollNo, studentIdNum: stu.studentIdNum };
      });
      return res.json({ success: true, data: mapped });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/assignments/submit', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { assignmentId, submissionText, fileUrl, fileName } = req.body;
    const userId = req.user!.id;

    let studentId = 1;
    const stu = mockStore.students.find((s) => s.userId === userId);
    if (stu) studentId = stu.id;

    try {
      const [submission] = await db.insert(schema.assignmentSubmissions).values({
        assignmentId: Number(assignmentId), studentId, submissionText, fileUrl, fileName, status: 'submitted',
      }).returning();
      await logAudit(req, 'SUBMIT', 'AssignmentSubmission', submission.id, `Submitted assignment ${assignmentId}`);
      return res.status(201).json({ success: true, data: submission });
    } catch {
      const submission = {
        id: mockStore.assignmentSubmissions.length + 1,
        assignmentId: Number(assignmentId), studentId, submissionText: submissionText || '', fileName: fileName || 'solution.zip', fileUrl: fileUrl || 'https://storage.googleapis.com/aitm/solution.zip', marksObtained: null, grade: null, feedback: null, gradedById: null, gradedAt: null, status: 'submitted', submittedAt: new Date().toISOString(),
      };
      mockStore.assignmentSubmissions.push(submission as any);
      await logAudit(req, 'SUBMIT', 'AssignmentSubmission', submission.id, `Submitted assignment ${assignmentId}`);
      return res.status(201).json({ success: true, data: submission });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/assignments/grade/:submissionId', requireAuth, requireRole(['super_admin', 'faculty', 'hod']), async (req: AuthRequest, res) => {
  try {
    const submissionId = parseInt(req.params.submissionId);
    const { marksObtained, grade, feedback } = req.body;
    const gradedById = req.user!.id;

    try {
      const [updated] = await db.update(schema.assignmentSubmissions).set({
        marksObtained: String(marksObtained), grade, feedback, gradedById, gradedAt: new Date(), status: 'graded',
      }).where(eq(schema.assignmentSubmissions.id, submissionId)).returning();
      await logAudit(req, 'GRADE', 'AssignmentSubmission', submissionId, `Graded submission: ${marksObtained} marks (${grade})`);
      return res.json({ success: true, data: updated });
    } catch {
      const sub = mockStore.assignmentSubmissions.find((s) => s.id === submissionId);
      if (sub) {
        sub.marksObtained = String(marksObtained);
        sub.grade = grade;
        sub.feedback = feedback;
        sub.gradedById = gradedById;
        sub.gradedAt = new Date().toISOString();
        sub.status = 'graded';
      }
      await logAudit(req, 'GRADE', 'AssignmentSubmission', submissionId, `Graded submission: ${marksObtained} marks (${grade})`);
      return res.json({ success: true, data: sub });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 12. Study Materials
// ==========================================
apiRouter.get('/study-materials', async (req, res) => {
  try {
    try {
      const rows = await db
        .select({
          id: schema.studyMaterials.id,
          title: schema.studyMaterials.title,
          description: schema.studyMaterials.description,
          fileUrl: schema.studyMaterials.fileUrl,
          fileName: schema.studyMaterials.fileName,
          fileType: schema.studyMaterials.fileType,
          fileSize: schema.studyMaterials.fileSize,
          downloadCount: schema.studyMaterials.downloadCount,
          createdAt: schema.studyMaterials.createdAt,
          subjectName: schema.subjects.name,
          subjectCode: schema.subjects.code,
          facultyName: schema.users.name,
        })
        .from(schema.studyMaterials)
        .innerJoin(schema.subjects, eq(schema.studyMaterials.subjectId, schema.subjects.id))
        .innerJoin(schema.users, eq(schema.studyMaterials.facultyId, schema.users.id))
        .orderBy(desc(schema.studyMaterials.createdAt));

      return res.json({ success: true, data: rows });
    } catch {
      const mapped = mockStore.studyMaterials.map((m) => {
        const sub = mockStore.subjects.find((s) => s.id === m.subjectId) || { name: 'DBMS', code: 'CS501' };
        const fac = mockStore.users.find((u) => u.id === m.facultyId) || { name: 'Prof. Sarah Connor' };
        return { ...m, subjectName: sub.name, subjectCode: sub.code, facultyName: fac.name };
      });
      return res.json({ success: true, data: mapped });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/study-materials', requireAuth, requireRole(['super_admin', 'faculty', 'hod']), async (req: AuthRequest, res) => {
  try {
    const { title, description, subjectId, fileUrl, fileName, fileType, fileSize } = req.body;
    const facultyId = req.user!.id;

    try {
      const [mat] = await db.insert(schema.studyMaterials).values({
        title, description, subjectId: Number(subjectId), facultyId, fileUrl: fileUrl || 'https://storage.googleapis.com/aitm/notes.pdf', fileName: fileName || `${title}.pdf`, fileType: fileType || 'pdf', fileSize: fileSize || '2.4 MB',
      }).returning();
      await logAudit(req, 'UPLOAD', 'StudyMaterial', mat.id, `Uploaded study material ${title}`);
      return res.status(201).json({ success: true, data: mat });
    } catch {
      const mat = {
        id: mockStore.studyMaterials.length + 1,
        title, description, subjectId: Number(subjectId), facultyId, fileUrl: fileUrl || 'https://storage.googleapis.com/aitm/notes.pdf', fileName: fileName || `${title}.pdf`, fileType: fileType || 'pdf', fileSize: fileSize || '2.4 MB', downloadCount: 0, createdAt: new Date().toISOString(),
      };
      mockStore.studyMaterials.unshift(mat);
      await logAudit(req, 'UPLOAD', 'StudyMaterial', mat.id, `Uploaded study material ${title}`);
      return res.status(201).json({ success: true, data: mat });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 13. Examinations & Results
// ==========================================
apiRouter.get('/examinations', async (req, res) => {
  try {
    const { departmentId, semesterId, academicYearId, examType, status, subjectId, search } = req.query as Record<string, string>;

    try {
      let query = db
        .select({
          id: schema.examinations.id,
          title: schema.examinations.title,
          examType: schema.examinations.examType,
          academicYearId: schema.examinations.academicYearId,
          semesterId: schema.examinations.semesterId,
          startDate: schema.examinations.startDate,
          endDate: schema.examinations.endDate,
          isPublished: schema.examinations.isPublished,
          gradingScale: schema.examinations.gradingScale,
          createdAt: schema.examinations.createdAt,
        })
        .from(schema.examinations)
        .orderBy(desc(schema.examinations.startDate));

      const rawExams = await query;
      
      // Enrich with schedules & relations
      const enriched = await Promise.all(
        rawExams.map(async (exam) => {
          let schedules: any[] = [];
          try {
            schedules = await db
              .select({
                subjectId: schema.examSchedules.subjectId,
                subjectName: schema.subjects.name,
                subjectCode: schema.subjects.code,
                departmentId: schema.subjects.departmentId,
              })
              .from(schema.examSchedules)
              .innerJoin(schema.subjects, eq(schema.examSchedules.subjectId, schema.subjects.id))
              .where(eq(schema.examSchedules.examId, exam.id));
          } catch {
            schedules = [];
          }

          const sem = mockStore.semesters.find((s) => s.id === exam.semesterId);
          const acad = mockStore.academicYears.find((a) => a.id === exam.academicYearId);
          const deptId = schedules[0]?.departmentId || (exam as any).departmentId || 1;
          const dept = mockStore.departments.find((d) => d.id === deptId);

          const nowStr = new Date().toISOString().split('T')[0];
          let derivedStatus = 'pending';
          if (exam.isPublished) {
            derivedStatus = 'published';
          } else if (exam.startDate <= nowStr && exam.endDate >= nowStr) {
            derivedStatus = 'ongoing';
          } else if (exam.endDate < nowStr) {
            derivedStatus = 'completed';
          }

          return {
            ...exam,
            departmentId: dept?.id || 1,
            departmentName: dept?.name || 'Computer Science & Engineering',
            departmentCode: dept?.code || 'CSE',
            semesterName: sem?.name || `Semester ${exam.semesterId || 1}`,
            academicYearName: acad?.name || '2025-2026',
            status: derivedStatus,
            subjectCount: schedules.length || 2,
            subjectNames: schedules.map((s) => `${s.subjectCode} - ${s.subjectName}`),
            schedules,
          };
        })
      );

      let filtered = enriched;
      if (departmentId && departmentId !== 'all') {
        filtered = filtered.filter((e) => String(e.departmentId) === String(departmentId));
      }
      if (semesterId && semesterId !== 'all') {
        filtered = filtered.filter((e) => String(e.semesterId) === String(semesterId));
      }
      if (academicYearId && academicYearId !== 'all') {
        filtered = filtered.filter((e) => String(e.academicYearId) === String(academicYearId));
      }
      if (examType && examType !== 'all') {
        filtered = filtered.filter((e) => e.examType.toLowerCase() === examType.toLowerCase());
      }
      if (status && status !== 'all') {
        filtered = filtered.filter((e) => e.status === status || (status === 'published' && e.isPublished));
      }
      if (subjectId && subjectId !== 'all') {
        filtered = filtered.filter((e) => e.schedules?.some((s: any) => String(s.subjectId) === String(subjectId)));
      }
      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        filtered = filtered.filter((e) => 
          e.title.toLowerCase().includes(q) ||
          e.departmentCode.toLowerCase().includes(q) ||
          e.departmentName.toLowerCase().includes(q) ||
          e.examType.toLowerCase().includes(q) ||
          e.subjectNames.some((sn: string) => sn.toLowerCase().includes(q))
        );
      }

      return res.json({ success: true, data: filtered });
    } catch {
      // Mock store fallback with complete filtering
      const nowStr = new Date().toISOString().split('T')[0];
      const enriched = mockStore.examinations.map((e: any) => {
        const sem = mockStore.semesters.find((s) => s.id === e.semesterId);
        const acad = mockStore.academicYears.find((a) => a.id === e.academicYearId);
        const dept = mockStore.departments.find((d) => d.id === e.departmentId) || mockStore.departments[0];
        const schedules = mockStore.examSchedules.filter((s) => s.examId === e.id);
        const subjectNames = schedules.map((s) => {
          const sub = mockStore.subjects.find((x) => x.id === s.subjectId);
          return sub ? `${sub.code} - ${sub.name}` : `Subject #${s.subjectId}`;
        });

        let derivedStatus = 'pending';
        if (e.isPublished) {
          derivedStatus = 'published';
        } else if (e.startDate <= nowStr && e.endDate >= nowStr) {
          derivedStatus = 'ongoing';
        } else if (e.endDate < nowStr) {
          derivedStatus = 'completed';
        }

        return {
          ...e,
          departmentId: dept.id,
          departmentName: dept.name,
          departmentCode: dept.code,
          semesterName: sem?.name || `Semester ${e.semesterId || 1}`,
          academicYearName: acad?.name || '2025-2026',
          status: derivedStatus,
          subjectCount: schedules.length || 2,
          subjectNames: subjectNames.length ? subjectNames : ['CS501 - Database Systems', 'CS502 - Algorithms'],
          schedules,
        };
      });

      let filtered = enriched;
      if (departmentId && departmentId !== 'all') {
        filtered = filtered.filter((e) => String(e.departmentId) === String(departmentId));
      }
      if (semesterId && semesterId !== 'all') {
        filtered = filtered.filter((e) => String(e.semesterId) === String(semesterId));
      }
      if (academicYearId && academicYearId !== 'all') {
        filtered = filtered.filter((e) => String(e.academicYearId) === String(academicYearId));
      }
      if (examType && examType !== 'all') {
        filtered = filtered.filter((e) => e.examType.toLowerCase() === examType.toLowerCase());
      }
      if (status && status !== 'all') {
        filtered = filtered.filter((e) => e.status === status || (status === 'published' && e.isPublished));
      }
      if (subjectId && subjectId !== 'all') {
        filtered = filtered.filter((e) => e.schedules?.some((s: any) => String(s.subjectId) === String(subjectId)));
      }
      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        filtered = filtered.filter((e) => 
          e.title.toLowerCase().includes(q) ||
          e.departmentCode.toLowerCase().includes(q) ||
          e.departmentName.toLowerCase().includes(q) ||
          e.examType.toLowerCase().includes(q) ||
          e.subjectNames.some((sn: string) => sn.toLowerCase().includes(q))
        );
      }

      return res.json({ success: true, data: filtered });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/examinations', requireAuth, requireRole(['super_admin', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { title, examType, departmentId, academicYearId, semesterId, startDate, endDate, gradingScale } = req.body;
    try {
      const [exam] = await db.insert(schema.examinations).values({
        title, examType: examType || 'midterm', academicYearId: academicYearId ? Number(academicYearId) : null, semesterId: semesterId ? Number(semesterId) : null, startDate, endDate, gradingScale: gradingScale || 'standard_10_point', isPublished: false,
      }).returning();
      await logAudit(req, 'CREATE', 'Examination', exam.id, `Created examination ${title}`);
      return res.status(201).json({ success: true, data: exam });
    } catch {
      const exam = {
        id: mockStore.examinations.length + 1,
        title, examType: examType || 'midterm', departmentId: departmentId ? Number(departmentId) : 1, academicYearId: academicYearId ? Number(academicYearId) : 1, semesterId: semesterId ? Number(semesterId) : 1, startDate: startDate || '2025-10-10', endDate: endDate || '2025-10-22', gradingScale: gradingScale || 'standard_10_point', isPublished: false,
      };
      mockStore.examinations.unshift(exam);
      await logAudit(req, 'CREATE', 'Examination', exam.id, `Created examination ${title}`);
      return res.status(201).json({ success: true, data: exam });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/examinations/:id/schedules', async (req, res) => {
  try {
    const examId = parseInt(req.params.id);
    try {
      const schedules = await db
        .select({
          id: schema.examSchedules.id,
          examDate: schema.examSchedules.examDate,
          startTime: schema.examSchedules.startTime,
          endTime: schema.examSchedules.endTime,
          roomNumber: schema.examSchedules.roomNumber,
          maxMarks: schema.examSchedules.maxMarks,
          passingMarks: schema.examSchedules.passingMarks,
          subjectName: schema.subjects.name,
          subjectCode: schema.subjects.code,
        })
        .from(schema.examSchedules)
        .innerJoin(schema.subjects, eq(schema.examSchedules.subjectId, schema.subjects.id))
        .where(eq(schema.examSchedules.examId, examId))
        .orderBy(schema.examSchedules.examDate);

      return res.json({ success: true, data: schedules });
    } catch {
      const scheds = mockStore.examSchedules.filter((s) => s.examId === examId);
      const mapped = scheds.map((s) => {
        const sub = mockStore.subjects.find((x) => x.id === s.subjectId) || { name: 'DBMS', code: 'CS501' };
        return { ...s, subjectName: sub.name, subjectCode: sub.code };
      });
      return res.json({ success: true, data: mapped });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/examinations/marks/enter', requireAuth, requireRole(['super_admin', 'admin', 'faculty', 'hod']), async (req: AuthRequest, res) => {
  try {
    const { examScheduleId, marksList } = req.body;
    const enteredById = req.user!.id;

    if (marksList && Array.isArray(marksList)) {
      try {
        for (const m of marksList) {
          await db.insert(schema.marks).values({
            examScheduleId: Number(examScheduleId), studentId: Number(m.studentId), marksObtained: String(m.marksObtained), isAbsent: Boolean(m.isAbsent), remarks: m.remarks || null, enteredById,
          });
        }
      } catch {
        marksList.forEach((m: any) => {
          mockStore.marks.push({
            id: mockStore.marks.length + 1,
            examScheduleId: Number(examScheduleId), studentId: Number(m.studentId), marksObtained: String(m.marksObtained), isAbsent: Boolean(m.isAbsent), remarks: m.remarks || null, enteredById,
          });
        });
      }
    }

    await logAudit(req, 'MARKS_ENTERED', 'ExamSchedule', examScheduleId, `Recorded marks for ${marksList?.length || 0} students`);
    res.json({ success: true, message: 'Marks recorded successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/examinations/:id/publish-results', requireAuth, requireRole(['super_admin', 'admin']), async (req: AuthRequest, res) => {
  try {
    const examId = parseInt(req.params.id);
    try {
      await db.update(schema.examinations).set({ isPublished: true }).where(eq(schema.examinations.id, examId));
      await db.update(schema.examResults).set({ isPublished: true, publishedAt: new Date() }).where(eq(schema.examResults.examId, examId));
    } catch {
      const exam = mockStore.examinations.find((e) => e.id === examId);
      if (exam) exam.isPublished = true;
      mockStore.examResults.forEach((r) => {
        if (r.examId === examId) {
          r.isPublished = true;
          r.publishedAt = new Date().toISOString();
        }
      });
    }

    await logAudit(req, 'PUBLISH', 'ExaminationResults', examId, `Published results for exam ${examId}`);
    res.json({ success: true, message: 'Results published successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/results/my-results', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    let studentId = 1;
    
    // Find student ID associated with this user
    try {
      const [stu] = await db.select().from(schema.students).where(eq(schema.students.userId, user.id));
      if (stu) studentId = stu.id;
    } catch {
      const stu = mockStore.students.find((s) => s.userId === user.id);
      if (stu) studentId = stu.id;
    }

    // Comprehensive academic subject grade records across semesters
    const sampleGrades = [
      // Semester 5 (Current / Fall 2025)
      { id: 1, subjectCode: 'CS501', subjectName: 'Database Management Systems', credits: 4, marksObtained: 92, maxMarks: 100, grade: 'O', gradePoints: '10.0', semesterId: 5, semesterName: 'Semester 5 (Fall 2025)', examTitle: 'Mid-Semester Theory Examinations', examType: 'midterm', status: 'PASSED' },
      { id: 2, subjectCode: 'CS502', subjectName: 'Design & Analysis of Algorithms', credits: 4, marksObtained: 89, maxMarks: 100, grade: 'A+', gradePoints: '9.0', semesterId: 5, semesterName: 'Semester 5 (Fall 2025)', examTitle: 'Mid-Semester Theory Examinations', examType: 'midterm', status: 'PASSED' },
      { id: 3, subjectCode: 'CS503', subjectName: 'Operating Systems & Concurrency', credits: 3, marksObtained: 86, maxMarks: 100, grade: 'A+', gradePoints: '9.0', semesterId: 5, semesterName: 'Semester 5 (Fall 2025)', examTitle: 'Mid-Semester Theory Examinations', examType: 'midterm', status: 'PASSED' },
      { id: 4, subjectCode: 'CS504L', subjectName: 'Full-Stack Software Engineering Lab', credits: 2, marksObtained: 95, maxMarks: 100, grade: 'O', gradePoints: '10.0', semesterId: 5, semesterName: 'Semester 5 (Fall 2025)', examTitle: 'Practical Examination & Project Viva', examType: 'practical', status: 'PASSED' },
      { id: 5, subjectCode: 'CS505', subjectName: 'Computer Networks & Distributed Systems', credits: 4, marksObtained: 88, maxMarks: 100, grade: 'A+', gradePoints: '9.0', semesterId: 5, semesterName: 'Semester 5 (Fall 2025)', examTitle: 'Mid-Semester Theory Examinations', examType: 'midterm', status: 'PASSED' },
      { id: 6, subjectCode: 'HS501', subjectName: 'Engineering Economics & Project Management', credits: 3, marksObtained: 84, maxMarks: 100, grade: 'A', gradePoints: '8.0', semesterId: 5, semesterName: 'Semester 5 (Fall 2025)', examTitle: 'Mid-Semester Theory Examinations', examType: 'midterm', status: 'PASSED' },

      // Semester 4 (Spring 2025)
      { id: 7, subjectCode: 'CS401', subjectName: 'Theory of Computation & Automata', credits: 4, marksObtained: 91, maxMarks: 100, grade: 'O', gradePoints: '10.0', semesterId: 4, semesterName: 'Semester 4 (Spring 2025)', examTitle: 'End-Semester Final Examinations', examType: 'final', status: 'PASSED' },
      { id: 8, subjectCode: 'CS402', subjectName: 'Computer Organization & Architecture', credits: 4, marksObtained: 85, maxMarks: 100, grade: 'A+', gradePoints: '9.0', semesterId: 4, semesterName: 'Semester 4 (Spring 2025)', examTitle: 'End-Semester Final Examinations', examType: 'final', status: 'PASSED' },
      { id: 9, subjectCode: 'CS403', subjectName: 'Object-Oriented Software Design', credits: 3, marksObtained: 89, maxMarks: 100, grade: 'A+', gradePoints: '9.0', semesterId: 4, semesterName: 'Semester 4 (Spring 2025)', examTitle: 'End-Semester Final Examinations', examType: 'final', status: 'PASSED' },
      { id: 10, subjectCode: 'CS404L', subjectName: 'System Programming & Linux Lab', credits: 2, marksObtained: 94, maxMarks: 100, grade: 'O', gradePoints: '10.0', semesterId: 4, semesterName: 'Semester 4 (Spring 2025)', examTitle: 'Practical Examination & Viva', examType: 'practical', status: 'PASSED' },
      { id: 11, subjectCode: 'MA401', subjectName: 'Probability, Statistics & Stochastic Processes', credits: 4, marksObtained: 87, maxMarks: 100, grade: 'A+', gradePoints: '9.0', semesterId: 4, semesterName: 'Semester 4 (Spring 2025)', examTitle: 'End-Semester Final Examinations', examType: 'final', status: 'PASSED' },

      // Semester 3 (Fall 2024)
      { id: 12, subjectCode: 'CS301', subjectName: 'Data Structures & Algorithms', credits: 4, marksObtained: 93, maxMarks: 100, grade: 'O', gradePoints: '10.0', semesterId: 3, semesterName: 'Semester 3 (Fall 2024)', examTitle: 'End-Semester Final Examinations', examType: 'final', status: 'PASSED' },
      { id: 13, subjectCode: 'CS302', subjectName: 'Digital Logic Design & Microprocessors', credits: 4, marksObtained: 83, maxMarks: 100, grade: 'A', gradePoints: '8.0', semesterId: 3, semesterName: 'Semester 3 (Fall 2024)', examTitle: 'End-Semester Final Examinations', examType: 'final', status: 'PASSED' },
      { id: 14, subjectCode: 'CS303', subjectName: 'Discrete Mathematical Structures', credits: 4, marksObtained: 88, maxMarks: 100, grade: 'A+', gradePoints: '9.0', semesterId: 3, semesterName: 'Semester 3 (Fall 2024)', examTitle: 'End-Semester Final Examinations', examType: 'final', status: 'PASSED' },
      { id: 15, subjectCode: 'CS304L', subjectName: 'Data Structures Laboratory', credits: 2, marksObtained: 96, maxMarks: 100, grade: 'O', gradePoints: '10.0', semesterId: 3, semesterName: 'Semester 3 (Fall 2024)', examTitle: 'Practical Examination & Viva', examType: 'practical', status: 'PASSED' },
    ];

    const semesterSummary = [
      { semesterId: 5, semesterName: 'Semester 5 (Fall 2025)', sgpa: '9.15', creditsRegistered: 20, creditsEarned: 20, status: 'First Class with Distinction' },
      { semesterId: 4, semesterName: 'Semester 4 (Spring 2025)', sgpa: '9.18', creditsRegistered: 17, creditsEarned: 17, status: 'First Class with Distinction' },
      { semesterId: 3, semesterName: 'Semester 3 (Fall 2024)', sgpa: '8.86', creditsRegistered: 14, creditsEarned: 14, status: 'First Class with Distinction' },
      { semesterId: 2, semesterName: 'Semester 2 (Spring 2024)', sgpa: '8.75', creditsRegistered: 18, creditsEarned: 18, status: 'First Class with Distinction' },
      { semesterId: 1, semesterName: 'Semester 1 (Fall 2023)', sgpa: '8.65', creditsRegistered: 18, creditsEarned: 18, status: 'First Class with Distinction' },
    ];

    return res.json({
      success: true,
      data: sampleGrades,
      summary: {
        cgpa: '8.92',
        totalCreditsAccrued: 87,
        totalCreditsRequired: 160,
        currentSgpa: '9.15',
        classification: 'First Class with Distinction',
        degreeProgram: 'B.Tech in Computer Science & Engineering',
        academicStanding: 'Exemplary (Top 5% of Cohort)',
        semesterHistory: semesterSummary,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/results/student/:studentId', async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    try {
      const results = await db
        .select({
          id: schema.examResults.id,
          examTitle: schema.examinations.title,
          examType: schema.examinations.examType,
          totalMarks: schema.examResults.totalMarks,
          percentage: schema.examResults.percentage,
          gpa: schema.examResults.gpa,
          cgpa: schema.examResults.cgpa,
          overallGrade: schema.examResults.overallGrade,
          status: schema.examResults.status,
          isPublished: schema.examResults.isPublished,
          publishedAt: schema.examResults.publishedAt,
        })
        .from(schema.examResults)
        .innerJoin(schema.examinations, eq(schema.examResults.examId, schema.examinations.id))
        .where(eq(schema.examResults.studentId, studentId));

      return res.json({ success: true, data: results });
    } catch {
      const resList = mockStore.examResults.filter((r) => r.studentId === studentId || studentId === 1);
      const mapped = resList.map((r) => {
        const exam = mockStore.examinations.find((e) => e.id === r.examId) || { title: 'Mid-Semester Examination', examType: 'midterm' };
        return { ...r, examTitle: exam.title, examType: exam.examType };
      });
      return res.json({ success: true, data: mapped });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 14. Notices & Announcements (Department-Aware & Enforced)
// ==========================================
apiRouter.get('/notices', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { departmentId, category, priority, targetRole, academicYearId, startDate, endDate, search } = req.query as Record<string, string>;
    const user = req.user!;
    const userRole = user.role;
    const userDeptId = user.departmentId;

    const isGlobalAdmin = userRole === 'super_admin' || userRole === 'admin' || userRole === 'placement_officer';

    try {
      const dbNotices = await db
        .select({
          id: schema.notices.id,
          title: schema.notices.title,
          content: schema.notices.content,
          targetRole: schema.notices.targetRole,
          departmentId: schema.notices.departmentId,
          priority: schema.notices.priority,
          attachmentUrl: schema.notices.attachmentUrl,
          attachmentName: schema.notices.attachmentName,
          isPublished: schema.notices.isPublished,
          createdAt: schema.notices.createdAt,
          authorName: schema.users.name,
          authorRole: schema.users.role,
        })
        .from(schema.notices)
        .innerJoin(schema.users, eq(schema.notices.authorId, schema.users.id))
        .orderBy(desc(schema.notices.createdAt));

      // Enrich with Department details
      const enriched = dbNotices.map((n) => {
        const dept = n.departmentId ? mockStore.departments.find((d) => d.id === n.departmentId) : null;
        return {
          ...n,
          departmentName: dept ? dept.name : 'All Departments (Campus Broadcast)',
          departmentCode: dept ? dept.code : 'ALL',
          targetDepartmentName: dept ? `${dept.code} - ${dept.name}` : 'All Departments',
          category: (n as any).category || 'general',
          academicYearId: (n as any).academicYearId || 1,
          academicYearName: '2025-2026',
        };
      });

      // 1. BACKEND SECURITY ENFORCEMENT:
      // Non-admin roles (student, faculty, hod) only see notices where:
      // - departmentId is null / 0 (Broadcast to all departments)
      // - OR departmentId matches their own departmentId
      let accessible = enriched;
      if (!isGlobalAdmin) {
        accessible = accessible.filter((n) => {
          const deptMatch = !n.departmentId || (userDeptId && n.departmentId === userDeptId);
          const roleMatch = n.targetRole === 'all' || 
            (userRole === 'student' && n.targetRole === 'students') ||
            (userRole === 'faculty' && (n.targetRole === 'faculty' || n.targetRole === 'all')) ||
            (userRole === 'hod' && (n.targetRole === 'hod' || n.targetRole === 'faculty' || n.targetRole === 'all'));
          return deptMatch && roleMatch;
        });
      }

      // 2. Query Filtering
      let filtered = accessible;
      if (departmentId && departmentId !== 'all') {
        if (departmentId === 'broadcast' || departmentId === 'null') {
          filtered = filtered.filter((n) => !n.departmentId);
        } else {
          filtered = filtered.filter((n) => String(n.departmentId) === String(departmentId));
        }
      }
      if (category && category !== 'all') {
        filtered = filtered.filter((n) => n.category.toLowerCase() === category.toLowerCase());
      }
      if (priority && priority !== 'all') {
        filtered = filtered.filter((n) => n.priority.toLowerCase() === priority.toLowerCase());
      }
      if (targetRole && targetRole !== 'all') {
        filtered = filtered.filter((n) => n.targetRole.toLowerCase() === targetRole.toLowerCase());
      }
      if (academicYearId && academicYearId !== 'all') {
        filtered = filtered.filter((n) => String(n.academicYearId) === String(academicYearId));
      }
      if (startDate) {
        filtered = filtered.filter((n) => new Date(n.createdAt) >= new Date(startDate));
      }
      if (endDate) {
        filtered = filtered.filter((n) => new Date(n.createdAt) <= new Date(endDate + 'T23:59:59'));
      }
      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        filtered = filtered.filter((n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.authorName?.toLowerCase().includes(q) ||
          n.departmentCode?.toLowerCase().includes(q) ||
          n.departmentName?.toLowerCase().includes(q)
        );
      }

      return res.json({ success: true, data: filtered });
    } catch {
      // Mock Store Fallback
      const enriched = mockStore.notices.map((n: any) => {
        const u = mockStore.users.find((x) => x.id === n.authorId) || { name: 'Institutional Office', role: 'admin' };
        const dept = n.departmentId ? mockStore.departments.find((d) => d.id === n.departmentId) : null;
        return {
          ...n,
          authorName: u.name,
          authorRole: u.role,
          departmentName: dept ? dept.name : 'All Departments (Campus Broadcast)',
          departmentCode: dept ? dept.code : 'ALL',
          targetDepartmentName: dept ? `${dept.code} - ${dept.name}` : 'All Departments',
          category: n.category || 'general',
          academicYearId: n.academicYearId || 1,
          academicYearName: '2025-2026',
        };
      });

      // 1. BACKEND SECURITY ENFORCEMENT:
      let accessible = enriched;
      if (!isGlobalAdmin) {
        accessible = accessible.filter((n) => {
          const deptMatch = !n.departmentId || (userDeptId && n.departmentId === userDeptId);
          const roleMatch = n.targetRole === 'all' || 
            (userRole === 'student' && n.targetRole === 'students') ||
            (userRole === 'faculty' && (n.targetRole === 'faculty' || n.targetRole === 'all')) ||
            (userRole === 'hod' && (n.targetRole === 'hod' || n.targetRole === 'faculty' || n.targetRole === 'all'));
          return deptMatch && roleMatch;
        });
      }

      // 2. Query Filtering
      let filtered = accessible;
      if (departmentId && departmentId !== 'all') {
        if (departmentId === 'broadcast' || departmentId === 'null') {
          filtered = filtered.filter((n) => !n.departmentId);
        } else {
          filtered = filtered.filter((n) => String(n.departmentId) === String(departmentId));
        }
      }
      if (category && category !== 'all') {
        filtered = filtered.filter((n) => (n.category || 'general').toLowerCase() === category.toLowerCase());
      }
      if (priority && priority !== 'all') {
        filtered = filtered.filter((n) => n.priority.toLowerCase() === priority.toLowerCase());
      }
      if (targetRole && targetRole !== 'all') {
        filtered = filtered.filter((n) => n.targetRole.toLowerCase() === targetRole.toLowerCase());
      }
      if (academicYearId && academicYearId !== 'all') {
        filtered = filtered.filter((n) => String(n.academicYearId || 1) === String(academicYearId));
      }
      if (startDate) {
        filtered = filtered.filter((n) => new Date(n.createdAt) >= new Date(startDate));
      }
      if (endDate) {
        filtered = filtered.filter((n) => new Date(n.createdAt) <= new Date(endDate + 'T23:59:59'));
      }
      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        filtered = filtered.filter((n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.authorName?.toLowerCase().includes(q) ||
          n.departmentCode?.toLowerCase().includes(q) ||
          n.departmentName?.toLowerCase().includes(q)
        );
      }

      return res.json({ success: true, data: filtered });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/notices', requireAuth, requireRole(['super_admin', 'admin', 'hod', 'faculty']), async (req: AuthRequest, res) => {
  try {
    const { title, content, targetRole, priority, departmentId, category, academicYearId, attachmentUrl, attachmentName } = req.body;
    const authorId = req.user!.id;
    const parsedDeptId = departmentId && departmentId !== 'all' && departmentId !== '' ? Number(departmentId) : null;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Notice Title and Content are required' });
    }

    try {
      const [notice] = await db.insert(schema.notices).values({
        title, content, targetRole: targetRole || 'all', priority: priority || 'normal', departmentId: parsedDeptId, attachmentUrl: attachmentUrl || null, attachmentName: attachmentName || null, authorId, isPublished: true,
      }).returning();
      await logAudit(req, 'CREATE', 'Notice', notice.id, `Created notice "${title}" targeting ${parsedDeptId ? 'Dept #' + parsedDeptId : 'All Departments'}`);
      return res.status(201).json({ success: true, data: notice });
    } catch {
      const dept = parsedDeptId ? mockStore.departments.find((d) => d.id === parsedDeptId) : null;
      const notice = {
        id: mockStore.notices.length + 1,
        title,
        content,
        targetRole: targetRole || 'all',
        priority: priority || 'normal',
        departmentId: parsedDeptId,
        category: category || 'general',
        academicYearId: academicYearId ? Number(academicYearId) : 1,
        attachmentUrl: attachmentUrl || '',
        attachmentName: attachmentName || '',
        authorId,
        isPublished: true,
        createdAt: new Date().toISOString(),
        authorName: req.user!.name,
        authorRole: req.user!.role,
        departmentName: dept ? dept.name : 'All Departments (Campus Broadcast)',
        departmentCode: dept ? dept.code : 'ALL',
        targetDepartmentName: dept ? `${dept.code} - ${dept.name}` : 'All Departments',
      };
      mockStore.notices.unshift(notice as any);
      await logAudit(req, 'CREATE', 'Notice', notice.id, `Created notice "${title}" targeting ${parsedDeptId ? 'Dept #' + parsedDeptId : 'All Departments'}`);
      return res.status(201).json({ success: true, data: notice });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 15. Events & Workshops
// ==========================================
apiRouter.get('/events', async (req, res) => {
  try {
    try {
      const allEvents = await db.select().from(schema.events).orderBy(desc(schema.events.startDate));
      return res.json({ success: true, data: allEvents });
    } catch {
      return res.json({ success: true, data: mockStore.events });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/events', requireAuth, requireRole(['super_admin', 'admin', 'hod']), async (req: AuthRequest, res) => {
  try {
    const { title, description, eventType, venue, startDate, endDate, maxCapacity, bannerUrl } = req.body;
    const organizerId = req.user!.id;

    try {
      const [event] = await db.insert(schema.events).values({
        title, description, eventType: eventType || 'academic', venue, startDate, endDate, maxCapacity: Number(maxCapacity || 100), bannerUrl, organizerId, status: 'upcoming',
      }).returning();
      await logAudit(req, 'CREATE', 'Event', event.id, `Created event ${title}`);
      return res.status(201).json({ success: true, data: event });
    } catch {
      const event = {
        id: mockStore.events.length + 1,
        title, description, eventType: eventType || 'academic', venue, startDate: startDate || '2025-11-15', endDate: endDate || '2025-11-17', maxCapacity: Number(maxCapacity || 100), bannerUrl: bannerUrl || '', organizerId, status: 'upcoming',
      };
      mockStore.events.unshift(event as any);
      await logAudit(req, 'CREATE', 'Event', event.id, `Created event ${title}`);
      return res.status(201).json({ success: true, data: event });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/events/:id/register', requireAuth, async (req: AuthRequest, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = req.user!.id;
    try {
      const [reg] = await db.insert(schema.eventRegistrations).values({ eventId, userId, attended: false }).returning();
      await logAudit(req, 'REGISTER', 'EventRegistration', reg.id, `Registered for event ${eventId}`);
      return res.status(201).json({ success: true, data: reg });
    } catch {
      const reg = { id: mockStore.eventRegistrations.length + 1, eventId, userId, attended: false };
      mockStore.eventRegistrations.push(reg);
      await logAudit(req, 'REGISTER', 'EventRegistration', reg.id, `Registered for event ${eventId}`);
      return res.status(201).json({ success: true, data: reg });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/workshops', async (req, res) => {
  try {
    try {
      const workshops = await db.select().from(schema.workshops).orderBy(desc(schema.workshops.startDate));
      return res.json({ success: true, data: workshops });
    } catch {
      return res.json({ success: true, data: mockStore.workshops });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/workshops', requireAuth, requireRole(['super_admin', 'admin', 'faculty', 'hod']), async (req: AuthRequest, res) => {
  try {
    const { title, description, instructor, venue, startDate, endDate, maxCapacity, fee, prerequisite, materialsUrl } = req.body;
    const organizerId = req.user!.id;

    try {
      const [workshop] = await db.insert(schema.workshops).values({
        title, description, instructor, venue, startDate, endDate, maxCapacity: Number(maxCapacity || 50), fee: String(fee || '0.00'), prerequisite, materialsUrl, organizerId, status: 'upcoming',
      }).returning();
      await logAudit(req, 'CREATE', 'Workshop', workshop.id, `Created workshop ${title}`);
      return res.status(201).json({ success: true, data: workshop });
    } catch {
      const workshop = {
        id: mockStore.workshops.length + 1,
        title, description, instructor, venue, startDate, endDate, maxCapacity: Number(maxCapacity || 50), fee: String(fee || '0.00'), prerequisite, materialsUrl, organizerId, status: 'upcoming',
      };
      mockStore.workshops.unshift(workshop as any);
      await logAudit(req, 'CREATE', 'Workshop', workshop.id, `Created workshop ${title}`);
      return res.status(201).json({ success: true, data: workshop });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 16. Certificates
// ==========================================
apiRouter.get('/certificates/my-certificates', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    let studentId = 1;
    const stu = mockStore.students.find((s) => s.userId === userId);
    if (stu) studentId = stu.id;

    try {
      const certs = await db.select().from(schema.certificates).where(eq(schema.certificates.studentId, studentId));
      return res.json({ success: true, data: certs });
    } catch {
      return res.json({ success: true, data: mockStore.certificates.filter((c) => c.studentId === studentId || studentId === 1) });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/certificates/all', requireAuth, requireRole(['super_admin', 'admin']), async (req: AuthRequest, res) => {
  try {
    try {
      const allCerts = await db
        .select({
          id: schema.certificates.id,
          certificateNumber: schema.certificates.certificateNumber,
          title: schema.certificates.title,
          type: schema.certificates.type,
          studentId: schema.certificates.studentId,
          issueDate: schema.certificates.issueDate,
          verificationCode: schema.certificates.verificationCode,
          description: schema.certificates.description,
          studentName: schema.users.name,
          rollNo: schema.students.rollNo,
        })
        .from(schema.certificates)
        .innerJoin(schema.students, eq(schema.certificates.studentId, schema.students.id))
        .innerJoin(schema.users, eq(schema.students.userId, schema.users.id));

      return res.json({ success: true, data: allCerts });
    } catch {
      const mapped = mockStore.certificates.map((c) => {
        const stu = mockStore.students.find((s) => s.id === c.studentId) || mockStore.students[0];
        const u = mockStore.users.find((x) => x.id === stu.userId) || { name: 'Alex Chen' };
        return { ...c, studentName: u.name, rollNo: stu.rollNo };
      });
      return res.json({ success: true, data: mapped });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/certificates/issue', requireAuth, requireRole(['super_admin', 'admin', 'faculty']), async (req: AuthRequest, res) => {
  try {
    const { studentId, certificateType, title, description, issuingAuthority } = req.body;
    const issuedById = req.user!.id;
    const certNum = `CERT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const verifCode = `VERIF-AITM-${Math.floor(10000 + Math.random() * 90000)}-X`;
    const verifHash = `hash_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    try {
      const [cert] = await db.insert(schema.certificates).values({
        certificateNumber: certNum,
        title: title || 'Certificate of Excellence',
        type: certificateType || 'merit',
        studentId: Number(studentId),
        issueDate: new Date().toISOString().split('T')[0],
        verificationCode: verifCode,
        description: description || 'Certificate of Merit & Academic Excellence',
        issuedById,
        metadataJson: JSON.stringify({ issuingAuthority: issuingAuthority || 'Apex Academic Senate', verificationHash: verifHash }),
      }).returning();
      await logAudit(req, 'ISSUE_CERTIFICATE', 'Certificate', cert.id, `Issued certificate ${certNum} to student ${studentId}`);
      return res.status(201).json({ success: true, data: cert });
    } catch {
      const cert = {
        id: mockStore.certificates.length + 1,
        certificateNumber: certNum,
        certificateType: certificateType || 'merit',
        title,
        studentId: Number(studentId),
        issueDate: new Date().toISOString().split('T')[0],
        verificationHash: verifHash,
        verificationCode: verifCode,
        issuingAuthority: issuingAuthority || 'Apex Academic Senate',
        status: 'issued',
        description: description || 'Certificate of Completion',
        issuedById,
        metadataJson: JSON.stringify({ issuedAt: new Date().toISOString() }),
      };
      mockStore.certificates.unshift(cert);
      await logAudit(req, 'ISSUE_CERTIFICATE', 'Certificate', cert.id, `Issued certificate ${certNum} to student ${studentId}`);
      return res.status(201).json({ success: true, data: cert });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/certificates/request', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { certificateType, purpose } = req.body;
    const userId = req.user!.id;
    let studentId = 1;
    const stu = mockStore.students.find((s) => s.userId === userId);
    if (stu) studentId = stu.id;

    const certNum = `REQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const verifHash = `req_hash_${Date.now()}`;
    const verifCode = `VERIF-${Date.now().toString().slice(-6)}`;

    const cert = {
      id: mockStore.certificates.length + 1,
      certificateNumber: certNum,
      certificateType: certificateType || 'bonafide',
      title: `Official ${certificateType?.toUpperCase() || 'BONAFIDE'} Certificate`,
      studentId,
      issueDate: new Date().toISOString().split('T')[0],
      verificationHash: verifHash,
      verificationCode: verifCode,
      issuingAuthority: 'Office of the Registrar',
      status: 'pending',
      description: `Purpose: ${purpose || 'Higher Education / Visa Verification'}`,
      issuedById: null,
      metadataJson: JSON.stringify({ purpose }),
    };
    mockStore.certificates.unshift(cert);

    await logAudit(req, 'REQUEST_CERTIFICATE', 'Certificate', cert.id, `Requested certificate ${certificateType}`);
    res.status(201).json({ success: true, message: 'Certificate request submitted to Registrar office', data: cert });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/certificates/verify/:hash', async (req, res) => {
  try {
    const hash = req.params.hash.trim().toLowerCase();
    const cert = mockStore.certificates.find((c) => c.verificationHash.toLowerCase() === hash || c.verificationCode.toLowerCase() === hash || c.certificateNumber.toLowerCase() === hash);

    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found or hash signature invalid.' });
    }

    const stu = mockStore.students.find((s) => s.id === cert.studentId) || mockStore.students[0];
    const u = mockStore.users.find((x) => x.id === stu.userId) || { name: 'Alex Chen' };

    res.json({
      success: true,
      isValid: true,
      data: {
        certificate: cert,
        student: { name: u.name, rollNo: stu.rollNo, studentIdNum: stu.studentIdNum },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 17. Placements & Career Cell
// ==========================================
apiRouter.get('/placements/companies', async (req, res) => {
  try {
    try {
      const companies = await db.select().from(schema.companies);
      return res.json({ success: true, data: companies });
    } catch {
      return res.json({ success: true, data: mockStore.companies });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/placements/companies', requireAuth, requireRole(['super_admin', 'admin', 'placement_officer']), async (req: AuthRequest, res) => {
  try {
    const { name, industry, website, logoUrl, contactPerson, contactEmail, contactPhone, address, description } = req.body;
    try {
      const [comp] = await db.insert(schema.companies).values({ name, industry, website, logoUrl, contactPerson, contactEmail, contactPhone, address, description }).returning();
      await logAudit(req, 'CREATE', 'Company', comp.id, `Created corporate partner ${name}`);
      return res.status(201).json({ success: true, data: comp });
    } catch {
      const comp = { id: mockStore.companies.length + 1, name, industry, website, logoUrl: logoUrl || 'https://www.google.com/favicon.ico', contactPerson, contactEmail, contactPhone, address, description };
      mockStore.companies.push(comp);
      await logAudit(req, 'CREATE', 'Company', comp.id, `Created corporate partner ${name}`);
      return res.status(201).json({ success: true, data: comp });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/placements/jobs', async (req, res) => {
  try {
    try {
      const jobs = await db
        .select({
          id: schema.jobOpportunities.id,
          jobTitle: schema.jobOpportunities.jobTitle,
          jobRole: schema.jobOpportunities.jobRole,
          jobType: schema.jobOpportunities.jobType,
          salaryPackage: schema.jobOpportunities.salaryPackage,
          location: schema.jobOpportunities.location,
          minCgpa: schema.jobOpportunities.minCgpa,
          eligibleDepartments: schema.jobOpportunities.eligibleDepartments,
          deadline: schema.jobOpportunities.deadline,
          description: schema.jobOpportunities.description,
          requirements: schema.jobOpportunities.requirements,
          companyName: schema.companies.name,
          companyLogo: schema.companies.logoUrl,
          companyWebsite: schema.companies.website,
        })
        .from(schema.jobOpportunities)
        .innerJoin(schema.companies, eq(schema.jobOpportunities.companyId, schema.companies.id));

      return res.json({ success: true, data: jobs });
    } catch {
      const mapped = mockStore.jobOpportunities.map((j) => {
        const comp = mockStore.companies.find((c) => c.id === j.companyId) || { name: 'Tech Partner', logoUrl: '', website: '' };
        return { ...j, companyName: comp.name, companyLogo: comp.logoUrl, companyWebsite: comp.website };
      });
      return res.json({ success: true, data: mapped });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/placements/jobs', requireAuth, requireRole(['super_admin', 'admin', 'placement_officer']), async (req: AuthRequest, res) => {
  try {
    const { companyId, jobTitle, jobRole, jobType, salaryPackage, location, minCgpa, eligibleDepartments, deadline, description, requirements } = req.body;
    try {
      const [job] = await db.insert(schema.jobOpportunities).values({
        companyId: Number(companyId), jobTitle, jobRole, jobType: jobType || 'full_time', salaryPackage, location, minCgpa: String(minCgpa || '6.00'), eligibleDepartments: eligibleDepartments || 'All Departments', deadline, description, requirements,
      }).returning();
      await logAudit(req, 'CREATE', 'JobOpportunity', job.id, `Created job opportunity ${jobTitle}`);
      return res.status(201).json({ success: true, data: job });
    } catch {
      const job = {
        id: mockStore.jobOpportunities.length + 1,
        driveId: null,
        companyId: Number(companyId), jobTitle, jobRole, jobType: jobType || 'full_time', salaryPackage, location, minCgpa: String(minCgpa || '6.00'), eligibleDepartments: eligibleDepartments || 'All Departments', deadline, description, requirements,
      };
      mockStore.jobOpportunities.push(job);
      await logAudit(req, 'CREATE', 'JobOpportunity', job.id, `Created job opportunity ${jobTitle}`);
      return res.status(201).json({ success: true, data: job });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/placements/jobs/:id/apply', requireAuth, async (req: AuthRequest, res) => {
  try {
    const jobId = parseInt(req.params.id);
    const { resumeUrl, resumeName } = req.body;
    const userId = req.user!.id;
    let studentId = 1;
    const stu = mockStore.students.find((s) => s.userId === userId);
    if (stu) studentId = stu.id;

    try {
      const [app] = await db.insert(schema.jobApplications).values({
        jobOpportunityId: jobId, studentId, resumeUrl: resumeUrl || 'https://storage.googleapis.com/aitm/resume.pdf', resumeName: resumeName || 'Student_Resume.pdf', status: 'applied', currentStage: 'Application Submitted',
      }).returning();
      await logAudit(req, 'APPLY', 'JobApplication', app.id, `Applied to job opening ${jobId}`);
      return res.status(201).json({ success: true, message: 'Application submitted successfully', data: app });
    } catch {
      const app = {
        id: mockStore.jobApplications.length + 1,
        jobOpportunityId: jobId, studentId, resumeUrl: resumeUrl || 'https://storage.googleapis.com/aitm/resume.pdf', resumeName: resumeName || 'Student_Resume.pdf', status: 'applied', currentStage: 'Application Submitted', notes: 'Application under review by corporate relations cell.',
      };
      mockStore.jobApplications.push(app);
      await logAudit(req, 'APPLY', 'JobApplication', app.id, `Applied to job opening ${jobId}`);
      return res.status(201).json({ success: true, message: 'Application submitted successfully', data: app });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/placements/applications', requireAuth, async (req: AuthRequest, res) => {
  try {
    try {
      const apps = await db
        .select({
          id: schema.jobApplications.id,
          jobOpportunityId: schema.jobApplications.jobOpportunityId,
          studentId: schema.jobApplications.studentId,
          resumeUrl: schema.jobApplications.resumeUrl,
          resumeName: schema.jobApplications.resumeName,
          status: schema.jobApplications.status,
          currentStage: schema.jobApplications.currentStage,
          notes: schema.jobApplications.notes,
          appliedAt: schema.jobApplications.appliedAt,
          jobTitle: schema.jobOpportunities.jobTitle,
          companyName: schema.companies.name,
          studentName: schema.users.name,
          rollNo: schema.students.rollNo,
          studentIdNum: schema.students.studentIdNum,
        })
        .from(schema.jobApplications)
        .innerJoin(schema.jobOpportunities, eq(schema.jobApplications.jobOpportunityId, schema.jobOpportunities.id))
        .innerJoin(schema.companies, eq(schema.jobOpportunities.companyId, schema.companies.id))
        .innerJoin(schema.students, eq(schema.jobApplications.studentId, schema.students.id))
        .innerJoin(schema.users, eq(schema.students.userId, schema.users.id));

      return res.json({ success: true, data: apps });
    } catch {
      const mapped = mockStore.jobApplications.map((a) => {
        const job = mockStore.jobOpportunities.find((j) => j.id === a.jobOpportunityId) || { jobTitle: 'SWE', companyId: 1 };
        const comp = mockStore.companies.find((c) => c.id === job.companyId) || { name: 'Google Cloud' };
        const stu = mockStore.students.find((s) => s.id === a.studentId) || mockStore.students[0];
        const u = mockStore.users.find((x) => x.id === stu.userId) || { name: 'Alex Chen' };
        return {
          ...a,
          jobTitle: job.jobTitle,
          companyName: comp.name,
          studentName: u.name,
          rollNo: stu.rollNo,
          studentIdNum: stu.studentIdNum,
        };
      });
      return res.json({ success: true, data: mapped });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/placements/analytics', async (req, res) => {
  try {
    const totalCompanies = mockStore.companies.length;
    const activeJobs = mockStore.jobOpportunities.length;
    const totalApplications = mockStore.jobApplications.length;
    
    // Detailed comprehensive placement analytics payload
    const analyticsData = {
      overview: {
        totalCompanies: totalCompanies || 14,
        activeJobOpportunities: activeJobs || 8,
        totalApplications: totalApplications || 42,
        placedStudents: 148,
        totalOffers: 182,
        highestPackage: '$145,000 / annum (Google Cloud)',
        averagePackage: '$86,500 / annum',
        placementRate: 91.2,
      },
      departmentStats: [
        {
          departmentId: 1,
          departmentCode: 'CSE',
          departmentName: 'Computer Science & Engineering',
          totalEligible: 68,
          placedCount: 65,
          placementRate: 95.6,
          averagePackage: '$98,000 / annum',
          highestPackage: '$145,000 / annum',
        },
        {
          departmentId: 2,
          departmentCode: 'ECE',
          departmentName: 'Electronics & Communication',
          totalEligible: 45,
          placedCount: 41,
          placementRate: 91.1,
          averagePackage: '$84,000 / annum',
          highestPackage: '$120,000 / annum',
        },
        {
          departmentId: 3,
          departmentCode: 'ME',
          departmentName: 'Mechanical Engineering',
          totalEligible: 32,
          placedCount: 27,
          placementRate: 84.4,
          averagePackage: '$72,000 / annum',
          highestPackage: '$95,000 / annum',
        },
        {
          departmentId: 4,
          departmentCode: 'MBA',
          departmentName: 'Management Studies',
          totalEligible: 28,
          placedCount: 25,
          placementRate: 89.3,
          averagePackage: '$89,000 / annum',
          highestPackage: '$110,000 / annum',
        },
      ],
      salaryDistribution: [
        { tier: 'Tier 1 (Premium / Global)', range: '> $120k / > 20 LPA', count: 34, percentage: 23, color: '#4f46e5' },
        { tier: 'Tier 2 (High Potential)', range: '$90k - $120k / 12-20 LPA', count: 58, percentage: 39, color: '#0ea5e9' },
        { tier: 'Tier 3 (Standard Core)', range: '$60k - $90k / 7-12 LPA', count: 42, percentage: 28, color: '#10b981' },
        { tier: 'Tier 4 (Associate/Foundational)', range: '< $60k / < 7 LPA', count: 14, percentage: 10, color: '#f59e0b' },
      ],
      pipelineFunnel: [
        { stage: 'Profiles Verified & Registered', count: 173, description: 'Students cleared CGPA & discipline criteria' },
        { stage: 'Aptitude & Online Assessments', count: 156, description: 'Passed technical coding / analytics benchmarks' },
        { stage: 'Technical Interviews & Panel', count: 122, description: 'Completed systems design & domain rounds' },
        { stage: 'HR & Leadership Evaluation', count: 98, description: 'Final cultural & behavioral assessments' },
        { stage: 'Formal Offers Issued & Accepted', count: 182, description: 'Official letters of employment generated' },
      ],
      topRecruiters: [
        { id: 1, name: 'Google Cloud Platform', industry: 'Cloud, Distributed AI', offersCount: 18, highestPackage: '$145,000', avgPackage: '$135,000', roleTypes: 'SWE L3, Cloud Solutions Architect' },
        { id: 2, name: 'Stripe', industry: 'Fintech & Economic Infra', offersCount: 12, highestPackage: '$130,000', avgPackage: '$115,000', roleTypes: 'Full-Stack SWE, Data Pipeline Engineer' },
        { id: 3, name: 'Microsoft Azure', industry: 'Enterprise Software & Cloud', offersCount: 22, highestPackage: '$140,000', avgPackage: '$125,000', roleTypes: 'Software Engineer, AI Platform Dev' },
        { id: 4, name: 'Amazon Web Services', industry: 'Cloud & Infrastructure', offersCount: 26, highestPackage: '$138,000', avgPackage: '$118,000', roleTypes: 'SDE-1, Cloud DevOps Specialist' },
        { id: 5, name: 'Cisco Systems', industry: 'Networking & Cybersecurity', offersCount: 15, highestPackage: '$110,000', avgPackage: '$92,000', roleTypes: 'Network Software Engineer' },
      ],
    };

    return res.json({ success: true, data: analyticsData });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 18. Security Audit Logs
// ==========================================
apiRouter.get('/audit-logs', requireAuth, requireRole(['super_admin', 'admin']), async (req: AuthRequest, res) => {
  try {
    try {
      const logs = await db.select().from(schema.auditLogs).orderBy(desc(schema.auditLogs.createdAt)).limit(100);
      return res.json({ success: true, data: logs });
    } catch {
      return res.json({ success: true, data: mockStore.auditLogs });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 19. System Settings
// ==========================================
apiRouter.get('/system/settings', async (req, res) => {
  try {
    try {
      const settings = await db.select().from(schema.systemSettings);
      return res.json({ success: true, data: settings });
    } catch {
      return res.json({ success: true, data: mockStore.systemSettings });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/system/settings', requireAuth, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const { settings } = req.body;
    if (Array.isArray(settings)) {
      settings.forEach((s) => {
        const item = mockStore.systemSettings.find((x) => x.settingKey === s.settingKey);
        if (item) item.settingValue = s.settingValue;
      });
    }
    await logAudit(req, 'UPDATE', 'SystemSettings', '1', 'Updated campus operational parameters');
    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 20. Notifications
// ==========================================
apiRouter.get('/notifications', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const list = mockStore.notifications.filter((n) => n.userId === userId || userId === 1);
    res.json({ success: true, data: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/notifications/mark-read', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    mockStore.notifications.forEach((n) => {
      if (n.userId === userId || userId === 1) n.isRead = true;
    });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 21. Help Desk & Support Ticketing System
// ==========================================
function formatTicket(ticket: any) {
  const submitter = mockStore.users.find((u) => u.id === ticket.userId);
  const assignedAdmin = ticket.assignedToId ? mockStore.users.find((u) => u.id === ticket.assignedToId) : null;
  const dept = ticket.departmentId ? mockStore.departments.find((d) => d.id === ticket.departmentId) : null;

  let submitterIdentifier = '';
  if (submitter?.role === 'student') {
    const st = mockStore.students.find((s) => s.userId === submitter.id);
    submitterIdentifier = st?.rollNo ? `Roll: ${st.rollNo}` : 'Student';
  } else if (submitter?.role === 'faculty' || submitter?.role === 'hod') {
    const fac = mockStore.faculty.find((f) => f.userId === submitter.id);
    submitterIdentifier = fac?.employeeId ? `Emp: ${fac.employeeId}` : 'Faculty';
  }

  const rawMessages = mockStore.ticketMessages.filter((m) => m.ticketId === ticket.id);
  const messages = rawMessages.map((m) => {
    const sender = mockStore.users.find((u) => u.id === m.senderId);
    return {
      id: m.id,
      ticketId: m.ticketId,
      senderId: m.senderId,
      senderName: sender ? sender.name : 'Campus User',
      senderRole: sender ? sender.role : 'student',
      senderAvatarUrl: sender?.avatarUrl || null,
      message: m.message,
      isInternalNote: m.isInternalNote || false,
      createdAt: m.createdAt || new Date().toISOString(),
    };
  });

  return {
    ...ticket,
    submitterName: submitter?.name || 'Unknown User',
    submitterEmail: submitter?.email || '',
    submitterRole: submitter?.role || 'student',
    submitterIdentifier,
    departmentName: dept?.name || null,
    assignedToName: assignedAdmin?.name || null,
    messages,
  };
}

apiRouter.get('/helpdesk/stats', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const isAdmin = user.role === 'super_admin' || user.role === 'admin';
    const tickets = isAdmin
      ? mockStore.helpDeskTickets
      : mockStore.helpDeskTickets.filter((t) => t.userId === user.id);

    const total = tickets.length;
    const open = tickets.filter((t) => t.status === 'open').length;
    const inProgress = tickets.filter((t) => t.status === 'in_progress').length;
    const resolved = tickets.filter((t) => t.status === 'resolved').length;
    const closed = tickets.filter((t) => t.status === 'closed').length;
    const urgent = tickets.filter((t) => t.priority === 'urgent' && t.status !== 'resolved' && t.status !== 'closed').length;

    res.json({
      success: true,
      data: {
        total,
        open,
        inProgress,
        resolved,
        closed,
        urgent,
        avgResolutionHours: 14.5,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/helpdesk/tickets', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { status, priority, category, search, scope } = req.query;
    const isAdmin = user.role === 'super_admin' || user.role === 'admin';

    let list = mockStore.helpDeskTickets;

    // Non-admins see only their own tickets, unless scope explicitly queried or HOD in department
    if (!isAdmin || scope === 'my') {
      list = list.filter((t) => t.userId === user.id);
    }

    if (status && status !== 'all') {
      list = list.filter((t) => t.status === status);
    }
    if (priority && priority !== 'all') {
      list = list.filter((t) => t.priority === priority);
    }
    if (category && category !== 'all') {
      list = list.filter((t) => t.category === category);
    }
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter((t) => {
        const sub = mockStore.users.find((u) => u.id === t.userId);
        return (
          t.ticketNumber.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          (sub && sub.name.toLowerCase().includes(q)) ||
          (sub && sub.email.toLowerCase().includes(q))
        );
      });
    }

    // Sort newest first
    list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const formatted = list.map(formatTicket);
    res.json({ success: true, data: formatted });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/helpdesk/tickets/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const ticketId = Number(req.params.id);
    const ticket = mockStore.helpDeskTickets.find((t) => t.id === ticketId);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const isAdmin = user.role === 'super_admin' || user.role === 'admin';
    if (!isAdmin && ticket.userId !== user.id) {
      return res.status(403).json({ success: false, message: 'Access denied to this ticket' });
    }

    res.json({ success: true, data: formatTicket(ticket) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/helpdesk/tickets', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { subject, description, category, priority, departmentId, contactPhone } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ success: false, message: 'Subject and description are required' });
    }

    const nextId = mockStore.helpDeskTickets.length > 0
      ? Math.max(...mockStore.helpDeskTickets.map((t) => t.id)) + 1
      : 1;

    const ticketNumber = `TICK-${new Date().getFullYear()}-${1000 + nextId}`;
    const newTicket = {
      id: nextId,
      ticketNumber,
      userId: user.id,
      category: category || 'other',
      priority: priority || 'medium',
      status: 'open',
      subject: subject.trim(),
      description: description.trim(),
      departmentId: departmentId ? Number(departmentId) : (user.departmentId || null),
      assignedToId: null,
      adminResponse: null,
      contactPhone: contactPhone || user.phone || null,
      resolvedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockStore.helpDeskTickets.unshift(newTicket);

    // Notify administrators
    mockStore.notifications.unshift({
      id: mockStore.notifications.length + 1,
      userId: 2, // Admin Eleanor Davis
      title: `New Support Ticket: ${ticketNumber}`,
      message: `${user.name} submitted ticket "${subject}" [${priority || 'medium'} priority].`,
      type: 'notice',
      linkUrl: '/admin/helpdesk',
      isRead: false,
    });

    // Notify Super Admin if urgent
    if (priority === 'urgent') {
      mockStore.notifications.unshift({
        id: mockStore.notifications.length + 1,
        userId: 1,
        title: `URGENT Ticket: ${ticketNumber}`,
        message: `High-priority escalation by ${user.name}: "${subject}"`,
        type: 'notice',
        linkUrl: '/admin/helpdesk',
        isRead: false,
      });
    }

    await logAudit(req, 'CREATE', 'HelpDeskTicket', String(nextId), `Created support ticket ${ticketNumber}: ${subject}`);
    res.status(201).json({ success: true, data: formatTicket(newTicket), message: 'Ticket submitted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.patch('/helpdesk/tickets/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const ticketId = Number(req.params.id);
    const ticket = mockStore.helpDeskTickets.find((t) => t.id === ticketId);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const isAdmin = user.role === 'super_admin' || user.role === 'admin';
    const isOwner = ticket.userId === user.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Access denied to modify ticket' });
    }

    const { status, priority, category, assignedToId, adminResponse } = req.body;

    if (status) {
      ticket.status = status;
      if (status === 'resolved' || status === 'closed') {
        ticket.resolvedAt = new Date().toISOString();
      }
    }
    if (priority && isAdmin) ticket.priority = priority;
    if (category && isAdmin) ticket.category = category;
    if (assignedToId !== undefined && isAdmin) ticket.assignedToId = assignedToId ? Number(assignedToId) : null;
    if (adminResponse !== undefined && isAdmin) ticket.adminResponse = adminResponse;

    ticket.updatedAt = new Date().toISOString();

    // If admin updated or resolved, notify the creator
    if (isAdmin && !isOwner) {
      mockStore.notifications.unshift({
        id: mockStore.notifications.length + 1,
        userId: ticket.userId,
        title: `Ticket ${ticket.ticketNumber} Updated`,
        message: `Your support request status is now "${ticket.status.toUpperCase()}". ${adminResponse ? `Response: ${adminResponse.substring(0, 60)}...` : ''}`,
        type: 'general',
        linkUrl: '/helpdesk',
        isRead: false,
      });
    }

    await logAudit(req, 'UPDATE', 'HelpDeskTicket', String(ticketId), `Updated ticket ${ticket.ticketNumber} status to ${ticket.status}`);
    res.json({ success: true, data: formatTicket(ticket), message: 'Ticket updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/helpdesk/tickets/:id/messages', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const ticketId = Number(req.params.id);
    const ticket = mockStore.helpDeskTickets.find((t) => t.id === ticketId);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const isAdmin = user.role === 'super_admin' || user.role === 'admin';
    const isOwner = ticket.userId === user.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Access denied to post messages on this ticket' });
    }

    const { message, isInternalNote } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty' });
    }

    const nextMsgId = mockStore.ticketMessages.length > 0
      ? Math.max(...mockStore.ticketMessages.map((m) => m.id)) + 1
      : 1;

    const newMsg = {
      id: nextMsgId,
      ticketId,
      senderId: user.id,
      message: message.trim(),
      isInternalNote: Boolean(isInternalNote && isAdmin),
      createdAt: new Date().toISOString(),
    };

    mockStore.ticketMessages.push(newMsg);
    ticket.updatedAt = new Date().toISOString();

    // If ticket was resolved and user writes back, auto-reopen or keep active
    if (isOwner && (ticket.status === 'resolved' || ticket.status === 'closed')) {
      ticket.status = 'open';
    }

    // Send notification to recipient
    const recipientId = isOwner ? (ticket.assignedToId || 2) : ticket.userId;
    mockStore.notifications.unshift({
      id: mockStore.notifications.length + 1,
      userId: recipientId,
      title: `New Reply on ${ticket.ticketNumber}`,
      message: `${user.name}: "${message.trim().substring(0, 60)}..."`,
      type: 'general',
      linkUrl: '/helpdesk',
      isRead: false,
    });

    await logAudit(req, 'CREATE', 'TicketMessage', String(nextMsgId), `Added response to ticket ${ticket.ticketNumber}`);
    res.status(201).json({ success: true, data: formatTicket(ticket), message: 'Message sent successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 19. Gemini AI Multi-Turn Chatbot API
// ==========================================
import { processGeminiChat } from './gemini.ts';

apiRouter.post('/gemini/chat', async (req, res) => {
  try {
    const { messages, model, systemRole, userContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid messages array is required for chat.',
      });
    }

    const result = await processGeminiChat({
      messages,
      model,
      systemRole,
      userContext,
    });

    res.json({
      success: true,
      data: {
        reply: result.reply,
        model: result.model,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Gemini API route error:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to process AI conversation',
    });
  }
});

