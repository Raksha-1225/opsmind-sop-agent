import dns from 'dns'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

// Fix SRV DNS lookup using Google's DNS (local DNS may not support SRV)
dns.setServers(['8.8.8.8', '8.8.4.4'])
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mammoth from 'mammoth'
import { ChatGroq } from '@langchain/groq'
import { PromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(cors())
app.use(express.json())

// ── File upload setup ─────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir)

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
})
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } })

// ── MongoDB connection (works with LOCAL MongoDB) ─────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected →', process.env.MONGO_URI))
  .catch(err => console.error('❌ MongoDB error:', err.message))

// ── Schemas ───────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name:      String,
  email:     { type: String, unique: true },
  password:  String,
  createdAt: { type: Date, default: Date.now }
})
const User = mongoose.model('User', userSchema)

const sopSchema = new mongoose.Schema({
  title:      String,
  content:    String,
  category:   String,
  filename:   String,
  uploadedBy: String,
  isActive:   { type: Boolean, default: true },
  createdAt:  { type: Date, default: Date.now }
})
// Text index for keyword search on local MongoDB (no Atlas needed!)
sopSchema.index({ title: 'text', content: 'text', category: 'text' })
const SOP = mongoose.model('SOP', sopSchema)

const chatSchema = new mongoose.Schema({
  userId:    String,
  question:  String,
  answer:    String,
  sources:   [{ title: String, category: String }],
  createdAt: { type: Date, default: Date.now }
})
const Chat = mongoose.model('Chat', chatSchema)

// ── LLM (Groq — free tier) ────────────────────────────────────────────────────
const llm = new ChatGroq({
  model:   'llama-3.3-70b-versatile',
  apiKey:  process.env.GROQ_API_KEY,
  temperature: 0.3
})

// ── Auth middleware ────────────────────────────────────────────────────────────
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.query.token
  if (!token) return res.status(401).json({ message: 'No token. Please login.' })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid token. Please login again.' })
  }
}

// ── Keyword scoring (fallback if text index not ready) ────────────────────────
function keywordScore(sop, query) {
  const q = query.toLowerCase()
  const words = q.split(/\s+/).filter(w => w.length > 2)
  const text = (sop.title + ' ' + sop.content + ' ' + sop.category).toLowerCase()
  return words.reduce((s, w) => s + (text.includes(w) ? 1 : 0), 0)
}

// ── Seed sample data on first run ─────────────────────────────────────────────
async function seedIfEmpty() {
  const count = await SOP.countDocuments()
  if (count > 0) return
  const samples = [
    { title: 'Refund Process', category: 'Finance', uploadedBy: 'System', content: 'To process a refund: 1. Verify the original purchase in the billing system. 2. Check if refund is within 30 days. 3. Approve refund in billing portal. 4. Notify customer via email within 24 hours. 5. Processing takes 3-5 business days.' },
    { title: 'Employee Onboarding', category: 'HR', uploadedBy: 'System', content: 'Employee onboarding steps: 1. Send welcome email with credentials. 2. Set up laptop and required software. 3. Schedule orientation meeting. 4. Assign a buddy/mentor. 5. Complete compliance training within first week.' },
    { title: 'Customer Complaint Handling', category: 'Support', uploadedBy: 'System', content: 'To handle customer complaints: 1. Listen and acknowledge the issue. 2. Apologize sincerely. 3. Investigate root cause. 4. Offer solution within 24 hours. 5. Follow up after resolution. 6. Document in CRM system.' },
    { title: 'Data Backup Procedure', category: 'IT', uploadedBy: 'System', content: 'Data backup procedure: 1. Automated backups run every night at 2 AM. 2. Weekly full backups every Sunday. 3. Store backups in AWS S3 with encryption. 4. Test restore procedure monthly. 5. Keep backups for 90 days minimum.' },
    { title: 'Leave Application Process', category: 'HR', uploadedBy: 'System', content: 'Leave application: 1. Submit request through HR portal 3 days in advance. 2. Medical leave requires doctors certificate for 2+ days. 3. Manager must approve within 24 hours. 4. Update your team calendar. 5. Emergency leave must be notified by phone to manager.' }
  ]
  await SOP.insertMany(samples)
  console.log(`✅ Seeded ${samples.length} sample SOPs into MongoDB`)
}

// ── Health ─────────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }))

// ── Auth: Register ─────────────────────────────────────────────────────────────
app.post('/auth/register', async (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password) return res.status(400).json({ message: 'All fields required.' })
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' })
  try {
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already registered. Please login.' })
    const hashed = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, password: hashed })
    const token = jwt.sign({ userId: user._id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.status(201).json({ message: 'Account created!', token, user: { name: user.name, email: user.email } })
  } catch {
    res.status(500).json({ message: 'Registration failed.' })
  }
})

// ── Auth: Login ────────────────────────────────────────────────────────────────
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ message: 'Email and password required.' })
  try {
    const user = await User.findOne({ email })
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Invalid email or password.' })
    const token = jwt.sign({ userId: user._id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ message: 'Login successful!', token, user: { name: user.name, email: user.email } })
  } catch {
    res.status(500).json({ message: 'Login failed.' })
  }
})

// ── SOP: Upload ────────────────────────────────────────────────────────────────
app.post('/sop/upload', authenticate, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' })
  const { title, category } = req.body
  if (!title || !category) return res.status(400).json({ message: 'Title and category are required.' })
  let content = ''
  try {
    const filePath = req.file.path
    const fileName = req.file.originalname.toLowerCase()
    if (fileName.endsWith('.txt')) {
      content = fs.readFileSync(filePath, 'utf8')
    } else if (fileName.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ path: filePath })
      content = result.value
    } else if (fileName.endsWith('.pdf')) {
      const buffer = fs.readFileSync(filePath)
      const text = buffer.toString('latin1')
      const matches = text.match(/BT[\s\S]*?ET/g) || []
      content = matches.join(' ').replace(/\(([^)]+)\)\s*Tj/g, '$1 ').replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim()
      if (content.length < 50) content = `Document: ${title}`
    }
    fs.unlinkSync(filePath)
  } catch { content = `SOP: ${title} - ${category}` }

  if (!content || content.trim().length < 5) content = `SOP: ${title} - ${category}`
  const sop = await SOP.create({ title, category, content: content.trim(), filename: req.file.originalname, uploadedBy: req.user.name, isActive: true })
  res.status(201).json({ message: `SOP "${title}" uploaded successfully!`, sop: { id: sop._id, title, category } })
})

// ── SOP: List ──────────────────────────────────────────────────────────────────
app.get('/sop/list', authenticate, async (req, res) => {
  try {
    const sops = await SOP.find({ isActive: true }).select('title category filename uploadedBy createdAt').sort({ createdAt: -1 })
    res.json({ sops })
  } catch { res.status(500).json({ message: 'Failed to fetch SOPs.' }) }
})

// ── SOP: Delete ────────────────────────────────────────────────────────────────
app.delete('/sop/:id', authenticate, async (req, res) => {
  await SOP.findByIdAndUpdate(req.params.id, { isActive: false })
  res.json({ message: 'SOP deleted successfully.' })
})

// ── Chat History ───────────────────────────────────────────────────────────────
app.get('/chat/history', authenticate, async (req, res) => {
  const history = await Chat.find({ userId: req.user.userId }).sort({ createdAt: -1 }).limit(20).select('question answer sources createdAt')
  res.json({ history })
})

app.delete('/chat/history', authenticate, async (req, res) => {
  await Chat.deleteMany({ userId: req.user.userId })
  res.json({ message: 'History cleared.' })
})

// ── Stream: RAG with local MongoDB text search + Groq LLM ─────────────────────
app.get('/stream', authenticate, async (req, res) => {
  const question = req.query.question
  if (!question || question.trim().length < 3) return res.status(400).json({ message: 'Question too short.' })

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  try {
    // Try MongoDB text search first, fall back to keyword scoring
    let sops = []
    try {
      sops = await SOP.find(
        { $text: { $search: question }, isActive: true },
        { score: { $meta: 'textScore' }, title: 1, content: 1, category: 1, filename: 1 }
      ).sort({ score: { $meta: 'textScore' } }).limit(3)
    } catch {
      // Fallback: load all and rank by keyword
      const all = await SOP.find({ isActive: true })
      sops = all.map(s => ({ ...s.toObject(), _score: keywordScore(s, question) }))
        .sort((a, b) => b._score - a._score).slice(0, 3).filter(s => s._score > 0)
    }

    console.log(`🔍 Found ${sops.length} SOPs for: "${question}"`)

    const context = sops.length > 0
      ? sops.map(s => `Source: ${s.title} (${s.category})\n${s.content}`).join('\n\n')
      : 'No relevant SOP found for this query.'

    const prompt = PromptTemplate.fromTemplate(
      'You are an Enterprise SOP Agent for OpsMind AI.\n' +
      'Answer the question using ONLY the SOP context below.\n' +
      'Always cite your source at the end like: "Source: [SOP Title]"\n' +
      'If the answer is not in the context, say: "I could not find a matching SOP. Please contact your admin."\n' +
      'Be clear, professional and concise.\n\n' +
      'SOP Context:\n{context}\n\nUser Question: {question}\n\nAnswer:'
    )

    const chain = prompt.pipe(llm).pipe(new StringOutputParser())
    const stream = await chain.stream({ context, question })

    let fullAnswer = ''
    for await (const chunk of stream) {
      fullAnswer += chunk
      res.write(`data: ${JSON.stringify({ token: chunk })}\n\n`)
    }

    const sources = sops.map(s => ({ title: s.title, category: s.category, content: s.content, filename: s.filename || 'System' }))
    res.write(`data: ${JSON.stringify({ sources })}\n\n`)
    res.write('data: [DONE]\n\n')
    res.end()

    await Chat.create({ userId: req.user.userId, question, answer: fullAnswer, sources: sops.map(s => ({ title: s.title, category: s.category })) })
      .catch(err => console.error('Chat save error:', err.message))

  } catch (err) {
    console.error('Stream error:', err.message)
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
    res.end()
  }
})

// ── Start ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000
app.listen(PORT, async () => {
  console.log(`\n✅ OpsMind SOP Agent backend running → http://localhost:${PORT}`)
  await seedIfEmpty()
})