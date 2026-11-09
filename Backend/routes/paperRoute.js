import express from 'express';
import { getQuestions, getAllPapers, getAllStudents, getRecordedPapers } from '../controllers/formController.js';
import generatePaper from '../controllers/generateController.js';
import downloadController from '../controllers/downloadController.js';
import formatLatexController from '../controllers/latexController.js';
import { uploadPaper } from '../controllers/uploadController.js';
import { getEvaluatedPaperStudent, getEvaluatedPaperTeacher } from '../controllers/evaluatedController.js';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/checkRole.js';

const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({

    storage: storage,
    // max 10mb (size)
    limits: { fileSize: 1024 * 1024 * 10 },

    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('application/pdf')) {
            cb(null, true);
        } else {
            cb(new Error('Only .pdf files are allowed'), false);
        }
    }
})

router.get('/papers', authenticate, checkRole(['teacher', 'student']), getAllPapers);
router.get('/questions/:paperid', authenticate, checkRole(['teacher', 'student']), getQuestions);

router.post('/format-latex', authenticate, checkRole(['teacher']), formatLatexController);
router.post('/generate', authenticate, checkRole(['teacher']), generatePaper);
router.post('/upload', authenticate, checkRole(['teacher']), upload.single('pdf'), uploadPaper);
router.get('/students', authenticate, checkRole(['teacher']), getAllStudents);
router.get('/recorded', authenticate, checkRole(['teacher']), getRecordedPapers);
router.get('/evaluated/teacher', authenticate, checkRole(['teacher']), getEvaluatedPaperTeacher);

router.get('/evaluated/student', authenticate, checkRole(['student']), getEvaluatedPaperStudent);
router.post('/download/:paperid', authenticate, checkRole(['student']), downloadController);




export default router;
