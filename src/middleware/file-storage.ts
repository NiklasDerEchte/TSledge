import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';

/**
 * Sanitizes a filename by replacing any characters that are not alphanumeric, dot, underscore, or hyphen with an underscore.
 * @param name 
 * @returns 
 */
const sanitizeFilename = (name: string): string => name.replace(/[^a-zA-Z0-9._-]/g, '_');

/**
 * Creates a multer disk storage configuration that saves uploaded files to a specified directory.
 * @param directory 
 * @returns 
 */
const diskStorage = (directory: string = 'files') => {
  let uploadDir = path.resolve(process.cwd(), 'src', directory);
  fs.mkdirSync(uploadDir, { recursive: true });
  return multer.diskStorage({
    destination: (_req, _file, next) => next(null, uploadDir),
    filename: (_req, file, next) => {
      const ext = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext);
      const safe = sanitizeFilename(base);
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      next(null, `${safe}-${unique}${ext}`);
    },
  });
}

/**
 * Creates a multer memory storage configuration that keeps uploaded files in memory as Buffer objects.
 */
const memoryStorage = multer.memoryStorage();

/**
 * Exports two multer configurations: one for disk storage and one for memory storage. The disk storage configuration saves files to a specified directory, while the memory storage configuration keeps files in memory.
 * @param directory 
 * @returns 
 */
export const diskFileUpload = (directory: string = 'files') => multer({ storage: diskStorage(directory) });

/**
 * Exports a multer configuration that uses memory storage, which keeps uploaded files in memory as Buffer objects. This is useful for scenarios where you want to process files without saving them to disk.
 */
export const memoryFileUpload = multer({ storage: memoryStorage });
