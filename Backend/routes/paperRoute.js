import express from 'express';
import { getQuestions, getFormController, getAllPapers } from '../controllers/formController.js';
import { generatePaper } from '../template/generatePaper.js'

const router = express.Router();

router.get('/papers', getAllPapers);
router.get('/questions/:paperid', getQuestions);
router.post('/download/:paperid', getFormController);
router.post('/generate', generatePaper);


export default router;
