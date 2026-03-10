import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as candidateService from '../services/candidate.service';
import * as notifService from '../services/notification.service';
import pdfParse from 'pdf-parse';
import fs from 'node:fs';
import { v2 as cloudinary } from 'cloudinary';
import prisma from '../config/database';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadToCloudinary(filePath: string, originalName: string): Promise<string> {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(filePath, {
            resource_type: 'raw',
            folder: 'hireon/resumes',
            public_id: `resume-${Date.now()}`,
            use_filename: false,
            format: originalName.endsWith('.pdf') ? 'pdf' : 'txt',
        }, (error, result) => {
            if (error || !result) reject(error);
            else resolve(result.secure_url);
        });
    });
}

/**
 * POST /api/upload/resume/:candidateId
 * Accepts a PDF/TXT file, uploads to Cloudinary, extracts text, saves to candidate record
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

        // Extract text
        if (file.mimetype === 'application/pdf') {
            const dataBuffer = fs.readFileSync(file.path);
            const parsed = await pdfParse(dataBuffer);
            resumeText = parsed.text;
        } else {
            resumeText = fs.readFileSync(file.path, 'utf-8');
        }

        if (!resumeText.trim()) {
            fs.unlinkSync(file.path);
            res.status(400).json({ error: 'Could not extract text from the uploaded file' });
            return;
        }

        // Upload to Cloudinary
        let resumeUrl = file.originalname;
        if (process.env.CLOUDINARY_CLOUD_NAME) {
            try {
                resumeUrl = await uploadToCloudinary(file.path, file.originalname);
            } catch (cloudErr) {
                console.warn('Cloudinary upload failed, falling back to filename:', cloudErr);
            }
        }

        // Clean up temp file
        fs.unlinkSync(file.path);

        // Save Cloudinary URL + extracted text
        const candidate = await candidateService.updateResume(
            candidateId,
            resumeUrl,
            resumeText
        );

        // Notify the candidate their resume was received
        if (req.user) {
            notifService.createNotification(
                req.user.id,
                'RESUME_UPLOADED',
                'Resume Received',
                'Your resume has been uploaded and is being analyzed by our AI. Results will be ready shortly.'
            ).catch(() => {});
        }

        res.json({
            message: 'Resume uploaded successfully',
            candidate,
            extractedLength: resumeText.length,
        });
    } catch (error) {
        console.error('Resume upload error:', error);
        res.status(500).json({ error: 'Failed to upload resume' });
    }
}

/**
 * POST /api/upload/avatar
 * Uploads profile picture to Cloudinary and saves URL on the User record
 */
export async function uploadAvatar(req: AuthRequest, res: Response) {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const file = req.file;
        let profilePictureUrl = '';

        if (process.env.CLOUDINARY_CLOUD_NAME) {
            profilePictureUrl = await new Promise<string>((resolve, reject) => {
                cloudinary.uploader.upload(file.path, {
                    resource_type: 'image',
                    folder: 'hireon/avatars',
                    public_id: `avatar-${req.user!.id}`,
                    overwrite: true,
                    transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }],
                }, (error, result) => {
                    if (error || !result) reject(new Error(error?.message ?? 'Cloudinary avatar upload failed'));
                    else resolve(result.secure_url);
                });
            });
        } else {
            profilePictureUrl = file.originalname;
        }

        fs.unlinkSync(file.path);

        await prisma.user.update({
            where: { id: req.user.id },
            data: { profilePictureUrl },
        });

        res.json({ profilePictureUrl });
    } catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({ error: 'Failed to upload avatar' });
    }
}
