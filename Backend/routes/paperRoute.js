import express from 'express';
import { getQuestions, getAllPapers } from '../controllers/formController.js';
import generatePaper from '../controllers/generateController.js';
import downloadController from '../controllers/downloadController.js';
import formatLatexController from '../controllers/latexController.js';

const router = express.Router();

router.get('/papers', getAllPapers);
router.get('/questions/:paperid', getQuestions);
router.post('/download/:paperid', downloadController);
router.post('/format-latex', formatLatexController);
router.post('/generate', generatePaper);


export default router;
