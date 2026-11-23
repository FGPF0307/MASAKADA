import 'dotenv/config'
import { pastikanBucket } from '../services/storage.js'

// Membuat bucket foto di Supabase Storage bila belum ada: npm run storage:setup
const dibuat = await pastikanBucket()
console.log(dibuat ? 'Bucket foto dibuat.' : 'Bucket foto sudah ada.')
