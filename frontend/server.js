import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'SOP Agent backend is running' })
})

// SOP query route
app.post('/query', async (req, res) => {
  const { question } = req.body

  // Validate input
  if (!question || question.trim().length < 3) {
    return res.status(400).json({
      message: 'Question must be at least 3 characters long'
    })
  }

  try {
    // Placeholder response until LangChain + MongoDB is connected
    res.json({
      answer: `You asked: "${question}". LangChain + MongoDB Atlas connection coming next!`
    })
  } catch (err) {
    console.error('Query error:', err)
    res.status(500).json({
      message: 'Something went wrong processing your question'
    })
  }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`✅ SOP Agent backend running on http://localhost:${PORT}`)
})