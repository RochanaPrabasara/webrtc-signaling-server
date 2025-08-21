import express from 'express';
     import Twilio from 'twilio';

     const router = express.Router();

     router.post('/twilio-token', async (req, res) => {
       try {
         const accountSid = process.env.TWILIO_ACCOUNT_SID;
         const authToken = process.env.TWILIO_AUTH_TOKEN;
         if (!accountSid || !authToken) {
           throw new Error('Twilio credentials missing in .env');
         }
         const client = new Twilio(accountSid, authToken);
         const token = await client.tokens.create();
         const iceServers = Array.isArray(token.iceServers) ? token.iceServers : [];
         res.json({ iceServers });
       } catch (err) {
         console.error('Twilio token error:', err);
         res.status(500).json({ error: 'Failed to generate Twilio token', details: err.message });
       }
     });

     export default router;