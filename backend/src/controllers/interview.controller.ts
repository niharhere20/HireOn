import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as schedulingService from '../services/scheduling.service';
import * as aiService from '../services/ai.service';
import { sendInterviewScheduledEmails } from '../services/email.service';

export async function scheduleInterview(req: AuthRequest, res: Response) {
    try {
        const { candidateId, interviewerId, startTime, durationMinutes } = req.body;

        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        if (!startTime) {
            res.status(400).json({ error: 'startTime is required' });
            return;
        }

        const interview = await schedulingService.scheduleInterview(
            candidateId,
            interviewerId,
            req.user.id,
            new Date(startTime),
            durationMinutes || 45
        );

        // Send email notifications (non-blocking)
        sendInterviewScheduledEmails({
            candidateName: interview.candidate.user.name,
            candidateEmail: interview.candidate.user.email,
            interviewerName: interview.interviewer.name,
            interviewerEmail: interview.interviewer.email,
            hrName: interview.hr.name,
            hrEmail: interview.hr.email,
            startTime: interview.startTime,
            endTime: interview.endTime,
            meetLink: interview.meetLink!,
            requirementTitle: (interview.candidate as any).assignedRequirement?.title,
        }).catch((err) => console.error('[email] error:', err));

        res.status(201).json(interview);
    } catch (error: any) {
        console.error('Schedule interview error:', error);
        res.status(500).json({ error: 'Failed to schedule interview' });
    }
}

export async function getInterviews(req: AuthRequest, res: Response) {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const { status } = req.query;
        const filters: any = {};

        // Role-based filtering
        if (req.user.role === 'HR') {
            filters.hrId = req.user.id;
        } else if (req.user.role === 'INTERVIEWER') {
            filters.interviewerId = req.user.id;
        }

        if (status) filters.status = status;

        const interviews = await schedulingService.getInterviews(filters);
        res.json(interviews);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch interviews' });
    }
}

export async function submitFeedback(req: AuthRequest, res: Response) {
    try {
        const interviewId = req.params.interviewId as string;
        const { feedback } = req.body;

        // Generate AI summary of feedback
        let aiSummary: string | undefined;
        try {
            aiSummary = await aiService.summarizeFeedback(feedback);
        } catch {
            // If AI fails, continue without summary
            console.warn('AI feedback summarization failed');
        }

        const interview = await schedulingService.submitFeedback(
            interviewId,
            feedback,
            aiSummary
        );

        res.json(interview);
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit feedback' });
    }
}

export async function addAvailability(req: AuthRequest, res: Response) {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const { slots } = req.body;
        const parsedSlots = slots.map((slot: { startTime: string; endTime: string }) => ({
            startTime: new Date(slot.startTime),
            endTime: new Date(slot.endTime),
        }));

        await schedulingService.addAvailabilitySlots(req.user.id, parsedSlots);
        res.status(201).json({ message: 'Availability added' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add availability' });
    }
}

export async function getAvailability(req: AuthRequest, res: Response) {
    try {
        const userId = req.params.userId as string;
        const slots = await schedulingService.getAvailabilitySlots(userId);
        res.json(slots);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch availability' });
    }
}
