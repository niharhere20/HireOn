import anthropic from '../config/anthropic';
import prisma from '../config/database';

// Haiku is fast, cheap, and accurate enough for structured extraction tasks.
// Sonnet-class models are unnecessary here and ~15x more expensive.
const HAIKU_MODEL = 'claude-haiku-4-5-20251001';

// Cap resume text to avoid burning tokens on boilerplate/whitespace.
// 4 000 chars ≈ 1 000 tokens and covers any real resume's key content.
const MAX_RESUME_CHARS = 4000;

interface AIAnalysisResult {
    experience_years: number;
    seniority: string;
    extracted_skills: string[];
    inferred_skills: string[];
    strengths: string;
    weaknesses: string;
    match_score: number;
    hire_probability: number;
}

/**
 * Analyze a resume using Claude AI.
 * Returns a structured JSON assessment.
 */
export async function analyzeResume(
    resumeText: string,
    requiredTechStack: string[],
    requiredExperience: number
): Promise<AIAnalysisResult> {
    // Truncate to keep input tokens predictable
    const truncated = resumeText.slice(0, MAX_RESUME_CHARS);

    const message = await anthropic.messages.create({
        model: HAIKU_MODEL,
        max_tokens: 800,
        system: 'You are a hiring AI. Analyze resumes objectively. Return only valid JSON — no markdown, no extra text. Never discriminate on gender, ethnicity, age, or background.',
        messages: [
            {
                role: 'user',
                content: `Job: ${requiredTechStack.join(', ')} | Min experience: ${requiredExperience}yr

Resume:
${truncated}

Return this JSON exactly:
{"experience_years":<number>,"seniority":"<Junior|Mid|Senior|Lead>","extracted_skills":[...],"inferred_skills":[...],"strengths":"<1-2 sentences>","weaknesses":"<1-2 sentences>","match_score":<0-100>,"hire_probability":<0-100>}`,
            },
        ],
    });

    const textBlock = message.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
        throw new Error('No text response from AI');
    }

    const raw = textBlock.text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(raw) as AIAnalysisResult;
}

/**
 * Analyze resume and save AI profile for a candidate.
 * Skips AI call if a profile already exists, unless force=true.
 */
export async function analyzeAndSaveProfile(
    candidateId: string,
    resumeText: string,
    techStack: string[],
    minExperience: number,
    force: boolean = false
): Promise<void> {
    // Skip re-analysis if profile already exists (saves tokens during demo)
    if (!force) {
        const existing = await prisma.aIProfile.findUnique({ where: { candidateId } });
        if (existing) return;
    }

    const analysis = await analyzeResume(resumeText, techStack, minExperience);

    const profileData = {
        experienceYears: analysis.experience_years,
        seniorityLevel: analysis.seniority,
        extractedSkills: analysis.extracted_skills,
        inferredSkills: analysis.inferred_skills,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        matchScore: analysis.match_score,
        hireProbability: analysis.hire_probability,
        rawResponse: analysis as any,
    };

    await prisma.aIProfile.upsert({
        where: { candidateId },
        create: { candidateId, ...profileData },
        update: profileData,
    });
}

/**
 * Summarize interview feedback using Claude AI.
 * Returns 3 bullet points: strengths, concerns, hire signal.
 */
export async function summarizeFeedback(feedback: string): Promise<string> {
    // Cap feedback to avoid runaway input tokens
    const truncated = feedback.slice(0, 2000);

    const message = await anthropic.messages.create({
        model: HAIKU_MODEL,
        max_tokens: 250,
        system: 'You are a hiring assistant. Summarize interview feedback in exactly 3 bullet points for HR.',
        messages: [
            {
                role: 'user',
                content: `Summarize in 3 bullets (strengths / concerns / hire-or-not):\n\n${truncated}`,
            },
        ],
    });

    const textBlock = message.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
        throw new Error('No text response from AI');
    }

    return textBlock.text;
}
