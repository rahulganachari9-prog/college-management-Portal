import { GoogleGenAI } from '@google/genai';

// Lazy initialization of GoogleGenAI
let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export type GeminiModelId =
  | 'gemini-3.1-pro-preview'
  | 'gemini-3.5-flash'
  | 'gemini-3.1-flash-lite';

export interface ChatMessage {
  id?: string;
  role: 'user' | 'model';
  content: string;
  timestamp?: string;
  modelUsed?: string;
}

export interface ChatRequestPayload {
  messages: ChatMessage[];
  model?: GeminiModelId;
  systemRole?: string;
  userContext?: {
    name?: string;
    role?: string;
    department?: string;
    rollNumber?: string;
    employeeId?: string;
  };
}

export const ROLE_SYSTEM_INSTRUCTIONS: Record<string, string> = {
  student: `You are the Apex Institute AI Academic Copilot & 24/7 Smart Tutor.
Your goal is to support university students in mastering their curriculum, assignments, project work, exam preparation, and career pathways.
You explain complex concepts step-by-step, provide clean code and mathematical derivations, give study tips, and clarify academic policies for Apex Institute of Technology & Management.
Tone: Encouraging, rigorous, clear, and structured with markdown headings, bullet points, and code formatting when appropriate.`,

  faculty: `You are the Apex Institute AI Faculty & Research Assistant.
Your goal is to assist professors and instructors with lesson planning, question paper formulation, rubric generation, grading criteria, research proposal drafts, and syllabus compliance.
You provide precise academic formulations, Bloom's Taxonomy aligned assessments, and institutional best practices.
Tone: Professional, academic, structured, and insightful.`,

  hod: `You are the Apex Institute Department Governance & Accreditation AI Consultant.
Your goal is to support Heads of Department (HODs) in curriculum design, faculty workload optimization, NAAC/NBA accreditation readiness, student performance analytics, and research committee coordination.
Tone: Executive, analytical, policy-aligned, and data-driven.`,

  placement_officer: `You are the Apex Institute Campus Recruitment & Career Strategy AI Advisor.
Your goal is to help students and placement officers with resume reviews, company-specific technical & HR interview mock questions, job description parsing, aptitude test prep, and corporate outreach letters.
Tone: Strategic, motivational, industry-ready, and actionable.`,

  admin: `You are the Apex Institute Campus Operations & Enterprise Admin AI Assistant.
Your goal is to assist college administrators and leadership with ERP workflows, fee structures, compliance documentation, campus event planning, facility scheduling, and institutional reporting.
Tone: Authoritative, organized, concise, and efficient.`,

  general: `You are Apex AI, the intelligent campus assistant for Apex Institute of Technology & Management.
You assist students, faculty, and staff with academic guidance, campus regulations, technical questions, project troubleshooting, and administrative FAQs.
Tone: Helpful, polite, knowledgeable, and accurate.`,
};

export async function processGeminiChat(payload: ChatRequestPayload): Promise<{
  reply: string;
  model: string;
  usage?: any;
}> {
  const {
    messages,
    model = 'gemini-3.5-flash',
    systemRole = 'student',
    userContext,
  } = payload;

  // Selected valid models from skill instructions
  const validModels: GeminiModelId[] = [
    'gemini-3.1-pro-preview',
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
  ];

  const selectedModel = validModels.includes(model) ? model : 'gemini-3.5-flash';

  const baseInstruction =
    ROLE_SYSTEM_INSTRUCTIONS[systemRole] || ROLE_SYSTEM_INSTRUCTIONS.general;

  const contextAddon = userContext
    ? `\nActive User Profile: Name: ${userContext.name || 'User'}, Role: ${
        userContext.role || systemRole
      }, Dept: ${userContext.department || 'Computer Science & Engineering'}.`
    : '';

  const fullSystemInstruction = `${baseInstruction}${contextAddon}
Always reply using clean, readable Markdown with structured paragraphs, clear bullet lists, and code blocks with syntax highlighting when relevant.`;

  // Format messages into Gemini contents format
  const contents = messages.map((msg) => ({
    role: msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: contents as any,
      config: {
        systemInstruction: fullSystemInstruction,
        temperature: 0.7,
        topP: 0.95,
      },
    });

    const replyText = response.text || 'I could not generate a response at this time.';

    return {
      reply: replyText,
      model: selectedModel,
    };
  } catch (error: any) {
    console.error('Gemini API execution error:', error);

    // Provide friendly fallback if API key is not configured or in quota limit
    const lastUserMessage =
      [...messages].reverse().find((m) => m.role === 'user')?.content || 'Hello';

    return {
      reply: generateCampusFallbackReply(lastUserMessage, systemRole, selectedModel, error?.message),
      model: selectedModel,
    };
  }
}

function generateCampusFallbackReply(
  prompt: string,
  role: string,
  model: string,
  errorDetail?: string
): string {
  const query = prompt.toLowerCase();

  if (query.includes('attendance') || query.includes('shortage')) {
    return `### Attendance Policies & Academic Regulations
Under Apex Institute regulations:
- **Minimum Requirement:** 75% aggregate attendance is mandatory to appear for Semester End Examinations (SEE).
- **Medical Condonation:** Students with 65%-74% attendance due to verified medical reasons may apply through the Student Portal with HOD recommendation.
- **Real-Time Tracking:** You can view your subject-wise logs under the **Attendance & Leaves** tab on your dashboard.`;
  }

  if (query.includes('grade') || query.includes('cgpa') || query.includes('sgpa') || query.includes('exam')) {
    return `### Examination & Grading System
Apex Institute of Technology uses a 10-point relative grading scale:
- **O (Outstanding):** Grade Point 10 (>= 90%)
- **A+ (Excellent):** Grade Point 9 (80% - 89%)
- **A (Very Good):** Grade Point 8 (70% - 79%)
- **B+ (Good):** Grade Point 7 (60% - 69%)
- **Internal Assessments:** Comprise 40% Continuous Internal Evaluation (CIE) and 60% Semester End Exam (SEE).
You can track published grade cards in the **Examinations & Grades** section.`;
  }

  if (query.includes('placement') || query.includes('interview') || query.includes('resume') || query.includes('job')) {
    return `### Campus Placement & Career Preparation
Key guidance from the T&P Cell:
1. **Resume Standard:** Keep a 1-page format highlighting 2-3 top GitHub projects, CGPA >= 7.5, and core technical skills (DSA, Full-Stack, Cloud).
2. **Coding Practice:** Master LeetCode mediums in Arrays, Trees, Graphs, and Dynamic Programming.
3. **Upcoming Drives:** Check the **Placements & Jobs** tab for active recruitment drives from Google, Microsoft, Amazon, and TCS Digital.`;
  }

  return `### Apex AI Campus Copilot (${model})
Thank you for your inquiry regarding "${prompt.slice(0, 80)}".

Here is the academic guidance for **${role.toUpperCase()}**:
- **Curriculum & Schedules:** Access course handouts, lab manuals, and timetable slots directly from the dashboard navigation.
- **Help Desk Support:** For technical issues or official cert requests, submit a ticket via the **Help Desk** module.
- **Smart Tutor Assistance:** Feel free to ask me for code debugging, algorithm walkthroughs, research paper summaries, or exam prep strategies!

*(Generated by Apex AI Campus Assistant)*`;
}
