import Pusher from 'pusher';
import dotenv from 'dotenv';

dotenv.config();

export const pusherConfig = {
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER || "ap1",
  useTLS: true
};

// Create Pusher instance
export const pusher = new Pusher(pusherConfig);

export default pusher;
