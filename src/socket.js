import { io } from 'socket.io-client';
import { BASE } from './api';
export const connect = token => io(BASE, { auth: { token }, transports: ['websocket', 'polling'] });
