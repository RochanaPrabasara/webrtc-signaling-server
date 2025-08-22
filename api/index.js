import { createServer } from 'http';
import { Server } from 'socket.io';
import twilioTokenRouter from './twilio-token.js';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['https://project-kiosk-sable.vercel.app', 'https://project-counter-two.vercel.app'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(express.json());
app.use(cors({
  origin: ['https://project-kiosk-sable.vercel.app', 'https://project-counter-two.vercel.app'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use('/api', twilioTokenRouter);

const sessions = new Map();

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('create-session', ({ sessionKey, kioskId }) => {
    if (sessions.has(sessionKey)) {
      socket.emit('session-error', { message: 'Session already exists' });
      return;
    }
    sessions.set(sessionKey, { kioskId, counters: new Set() });
    socket.join(sessionKey);
    socket.emit('session-created', { kioskId });
    console.log('Kiosk session created:', { kioskId });
  });

  socket.on('join-session', ({ sessionKey, counterId }) => {
    const session = sessions.get(sessionKey);
    if (!session) {
      socket.emit('session-error', { message: 'Session not found' });
      return;
    }
    session.counters.add(counterId);
    socket.join(sessionKey);
    socket.to(sessionKey).emit('counter-joined', { counterId });
    socket.emit('session-joined', { sessionKey, kioskId: session.kioskId });
    console.log('Counter joined:', counterId);
  });

  socket.on('offer', ({ to, from, offer }) => {
    console.log(`Offer from ${from} to ${to}`);
    socket.to(to).emit('offer', { from, offer });
  });

  socket.on('answer', ({ to, from, answer }) => {
    console.log(`Answer from ${from} to ${to}`);
    socket.to(to).emit('answer', { from, answer });
  });

  socket.on('ice-candidate', ({ to, from, candidate }) => {
    console.log(`ICE candidate from ${from} to ${to}`);
    socket.to(to).emit('ice-candidate', { from, candidate });
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
    sessions.forEach((session, sessionKey) => {
      if (session.kioskId === socket.id) {
        sessions.delete(sessionKey);
        io.to(sessionKey).emit('session-error', { message: 'Kiosk disconnected' });
      } else if (session.counters.has(socket.id)) {
        session.counters.delete(socket.id);
        io.to(sessionKey).emit('counter-left', { counterId: socket.id });
      }
    });
  });
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Signaling server running on port ${PORT}`);
  });
}

export default app;