import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { uploadResume } from '../controllers/upload.controller';

const router = Router();

// Store uploaded files temporarily in /tmp
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, require('os').tmpdir());
    },
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `resume-${unique}${path.extname(file.originalname)}`);
    },
});

const fileFilter = (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    const allowed = ['application/pdf', 'text/plain'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF and TXT files are allowed'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// POST /api/upload/resume/:candidateId — Candidate only
router.post(
    '/resume/:candidateId',
    authenticate as any,
    authorize('CANDIDATE') as any,
    upload.single('resume'),
    uploadResume as any
);

export default router;
