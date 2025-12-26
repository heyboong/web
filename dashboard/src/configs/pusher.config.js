import Pusher from 'pusher';

export const pusherConfig = {
  appId: "2056311",
  key: "049ee983c4ec4cecf834",
  secret: "6ee5cb53d3b09e78a6a1",
  cluster: "ap1",
  useTLS: true
};

// Create Pusher instance
export const pusher = new Pusher(pusherConfig);

export default pusher;
