import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { getFormFields, getFormController, getAllForms } from '../controllers/formController.js';

const router = express.Router();

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const papersDbPath = path.join(uploadDir, 'papers.json');

const getPapers = () => {
  if (fs.existsSync(papersDbPath)) {
    try { 
      const data = JSON.parse(fs.readFileSync(papersDbPath, 'utf8')); 
      if (data && data.length > 0) return data;
    } catch(e) {}
  }
  
  const defaultPapers = [
    { id: 101, name: 'Factoization WS', subject: 'Mathematics', date: 'Oct 23, 2023', submissions: 15, path: '#' },
    { id: 102, name: 'Physics Kinetics', subject: 'Science', date: 'Oct 12, 2023', submissions: 22, path: '#' },
    { id: 103, name: 'Grammar Test 1', subject: 'English', date: 'Oct 05, 2023', submissions: 18, path: '#' }
  ];
  
  try { fs.writeFileSync(papersDbPath, JSON.stringify(defaultPapers, null, 2)); } catch(e) {}
  return defaultPapers;
};

const savePaper = (paper) => {
  const papers = getPapers();
  papers.unshift(paper);
  fs.writeFileSync(papersDbPath, JSON.stringify(papers, null, 2));
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})

const upload = multer({ storage: storage })

router.get('/forms', getAllForms);
router.get('/fields/:formid', getFormFields);
router.post('/download/:formid', getFormController);

router.post('/upload', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const { name, subject, assignedTo } = req.body;
  
  const newPaper = {
    id: Date.now(),
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`,
    name: name || 'Untitled',
    subject: subject || 'Unspecified',
    assignedTo: assignedTo || 'All Students',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    submissions: 0
  };

  savePaper(newPaper);
  
  res.status(200).json({
    message: 'File uploaded successfully',
    file: newPaper
  });
});

router.get('/uploaded-papers', (req, res) => {
  res.status(200).json(getPapers());
});

export default router;