import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';

const uploadDir = path.resolve(process.cwd(), 'src', 'files');
fs.mkdirSync(uploadDir, { recursive: true });

const sanitizeFilename = (name: string): string => name.replace(/[^a-zA-Z0-9._-]/g, '_');

const diskStorage = multer.diskStorage({
  destination: (_req, _file, next) => next(null, uploadDir),
  filename: (_req, file, next) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const safe = sanitizeFilename(base);
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    next(null, `${safe}-${unique}${ext}`);
  },
});

const memoryStorage = multer.memoryStorage();

export const diskFileUpload = multer({ storage: diskStorage });
export const memoryFileUpload = multer({ storage: memoryStorage });
