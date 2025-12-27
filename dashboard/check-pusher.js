import PusherServer from 'pusher';
import PusherClient from 'pusher-js';
import dotenv from 'dotenv';

dotenv.config();

// 1. Setup Server (Publisher)
const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});

// 2. Setup Client (Subscriber)
// Note: In Node.js environment, pusher-js might need a websocket implementation if not present,
// but newer versions often handle it or we might need 'ws' package.
// Let's try to see if it works directly. If not, we might need to rely on server trigger success only.
const pusherClient = new PusherClient(process.env.PUSHER_KEY, {
  cluster: process.env.PUSHER_CLUSTER,
  forceTLS: true,
});

const channelName = 'test-channel';
const eventName = 'test-event';

console.log('🔄 Connecting to Pusher...');

const channel = pusherClient.subscribe(channelName);

channel.bind('pusher:subscription_succeeded', () => {
  console.log('✅ Client subscribed successfully!');
  
  // Trigger event after subscription
  console.log('🚀 Triggering event from server...');
  pusherServer.trigger(channelName, eventName, {
    message: 'Hello from Real-time Test!'
  }).then(() => {
    console.log('✅ Event triggered successfully from server');
  }).catch(err => {
    console.error('❌ Failed to trigger event:', err);
    process.exit(1);
  });
});

channel.bind(eventName, (data) => {
  console.log('🎉 Client RECEIVED event:', data);
  if (data.message === 'Hello from Real-time Test!') {
    console.log('✅ REAL-TIME TEST PASSED!');
    process.exit(0);
  }
});

// Timeout
setTimeout(() => {
  console.log('⚠️ Test timed out. No event received after 10 seconds.');
  process.exit(1);
}, 10000);
