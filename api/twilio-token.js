import express from 'express';
import Twilio from 'twilio';

const router = express.Router();

router.post('/twilio-token', async (req, res) => {
  console.log('Received request to /api/twilio-token');
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    console.log('TWILIO_ACCOUNT_SID:', accountSid ? 'Set' : 'Missing');
    console.log('TWILIO_AUTH_TOKEN:', authToken ? 'Set' : 'Missing');
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials missing in .env');
    }
    const client = new Twilio(accountSid, authToken);
    console.log('Twilio client initialized');
    const token = await client.tokens.create();
    console.log('Twilio token created:', token);
    const iceServers = Array.isArray(token.iceServers) ? token.iceServers : [];
    res.json({ iceServers });
  } catch (err) {
    console.error('Twilio token error:', err);
    res.status(500).json({ error: 'Failed to generate Twilio token', details: err.message });
  }
});

export default router;