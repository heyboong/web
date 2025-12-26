import Pusher from 'pusher-js';

export const pusherConfig = {
  appId: import.meta.env.VITE_PUSHER_APP_ID,
  key: import.meta.env.VITE_PUSHER_KEY,
  cluster: import.meta.env.VITE_PUSHER_CLUSTER,
  useTLS: true
};

// Create Pusher instance for client
export const pusher = pusherConfig.key && pusherConfig.cluster
  ? new Pusher(pusherConfig.key, {
      cluster: pusherConfig.cluster,
      useTLS: pusherConfig.useTLS
    })
  : null;

export default pusher;
