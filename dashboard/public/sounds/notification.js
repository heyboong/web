// Web Audio API notification sound generator
function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create oscillator for the sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Configure sound
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1); // 1000Hz
    oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.2); // 1200Hz
    
    // Configure volume envelope
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    // Play sound
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
    
  } catch (error) {
    console.log('Could not play notification sound:', error);
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = playNotificationSound;
} else {
  window.playNotificationSound = playNotificationSound;
}
