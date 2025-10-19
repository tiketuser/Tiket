import { createWorker } from 'tesseract.js';

export async function performOCR(imageBuffer: Buffer) {
  const worker = await createWorker();
  
  try {
    await worker.loadLanguage('eng+heb');
    await worker.initialize('eng+heb');
    
    const { data: { text } } = await worker.recognize(imageBuffer);
    return text;
  } finally {
    await worker.terminate();
  }
}