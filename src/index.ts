import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import sharp from 'sharp';
import { createChallenge, verifyChallenge, imageTokenStore } from './data';
import { CaptchaVerifyRequest } from './types';

const app = express();
const port = 3001;

// Trust proxy if you are behind a reverse proxy (e.g. Nginx, Vercel)
app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." }
});

const verifyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 15, // allow slightly more attempts to account for user mistakes
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many verification attempts, please wait." }
});

// Configure CORS for production safety
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-production-domain.com'] 
    : '*',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json({ limit: '100kb' })); // Limit JSON body size to prevent payload attacks

app.get('/api/captcha', limiter, (req, res) => {
  try {
    const challenge = createChallenge();
    const challengeWithFullUrl = {
      ...challenge,
      images: challenge.images.map(path => `http://localhost:${port}${path}`)
    };
    res.json(challengeWithFullUrl);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate captcha' });
  }
});

app.get('/api/img/:token', async (req, res) => {
  const token = req.params.token;
  const localPath = imageTokenStore.get(token);

  if (!localPath) {
    res.status(404).send('Image expired');
    return;
  }

  try {
    const image = sharp(localPath);

    const brightness = 0.9 + Math.random() * 0.2;
    const saturation = 0.9 + Math.random() * 0.2;

    image.modulate({
      brightness: brightness,
      saturation: saturation
    });

    const processedBuffer = await image
      .jpeg({
        quality: 60 + Math.floor(Math.random() * 20),
        mozjpeg: true
      })
      .toBuffer();

    res.set('Content-Type', 'image/jpeg');
    res.send(processedBuffer);
  } catch (error) {
    console.error(`Proxy error for path: ${localPath}`, error);
    res.status(500).send('Image load failed');
  }
});

app.post('/api/verify', verifyLimiter, (req, res) => {
  try {
    const body = req.body as CaptchaVerifyRequest;
    if (!body || !body.id || !Array.isArray(body.selectedIndexes)) {
      res.status(400).json({ success: false, message: "Invalid request" });
      return;
    }

    const result = verifyChallenge(
      body.id,
      body.selectedIndexes,
      body.traceData,
      body.startTime
    );

    if (result.isValid) {
      res.json({
        success: true,
        message: "阿里嘎多~验证通过!",
        duration: result.duration
      });
    } else {
      res.json({
        success: false,
        message: result.reason || "验证失败",
        duration: result.duration
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
