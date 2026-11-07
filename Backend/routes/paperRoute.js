import express from 'express';
import { getQuestions, getAllPapers, getAllStudents } from '../controllers/formController.js';
import generatePaper from '../controllers/generateController.js';
import downloadController from '../controllers/downloadController.js';
import formatLatexController from '../controllers/latexController.js';
import { uploadPaper } from '../controllers/uploadController.js';
import { getEvaluatedPaper } from '../controllers/evaluatedController.js';
import multer from 'multer';

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

router.get('/papers', getAllPapers);
router.get('/questions/:paperid', getQuestions);
router.post('/download/:paperid', downloadController);
router.post('/format-latex', formatLatexController);
router.post('/generate', generatePaper);
router.post('/upload', upload.single('pdf'), uploadPaper);
router.get('/students', getAllStudents);
router.get('/evaluated/:studentid', getEvaluatedPaper);


export default router;
