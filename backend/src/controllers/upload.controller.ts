import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as candidateService from '../services/candidate.service';
import pdfParse from 'pdf-parse';
import fs from 'fs';

/**
 * POST /api/upload/resume/:candidateId
 * Accepts a PDF/DOCX file, extracts text via pdf-parse, saves to candidate record
 */
export async function uploadResume(req: AuthRequest, res: Response) {
    try {
        const candidateId = req.params.candidateId as string;

        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const file = req.file;
        let resumeText = '';

        // Extract text from PDF
        if (file.mimetype === 'application/pdf') {
            const dataBuffer = fs.readFileSync(file.path);
            const parsed = await pdfParse(dataBuffer);
            resumeText = parsed.text;
        } else {
            // For plain text files
            resumeText = fs.readFileSync(file.path, 'utf-8');
        }

        // Clean up temp file
        fs.unlinkSync(file.path);

        if (!resumeText.trim()) {
            res.status(400).json({ error: 'Could not extract text from the uploaded file' });
            return;
        }

        // Save resume URL (filename as reference) and extracted text
        const candidate = await candidateService.updateResume(
            candidateId,
            file.originalname,
            resumeText
        );

        res.json({
            message: 'Resume uploaded and parsed successfully',
            candidate,
            extractedLength: resumeText.length,
        });
    } catch (error) {
        console.error('Resume upload error:', error);
        res.status(500).json({ error: 'Failed to upload resume' });
    }
}
