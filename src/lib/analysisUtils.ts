// Helper functions for voice and text analysis
export const calculateClarityScore = (audioData: Uint8Array): number => {
  // Calculate clarity based on audio frequency distribution
  const average = audioData.reduce((sum, val) => sum + val, 0) / audioData.length;
  return Math.min(100, (average / 255) * 100);
};

export const calculatePitchVariation = (audioData: Uint8Array): number => {
  // Measure pitch variation through frequency changes
  const variations = audioData.filter((val, i, arr) => i > 0 && Math.abs(val - arr[i-1]) > 5).length;
  return Math.min(100, (variations / audioData.length) * 1000);
};

export const detectFillerWords = (transcript: string): string[] => {
  const fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'literally'];
  return [...new Set(
    transcript.toLowerCase().split(' ')
      .filter(word => fillerWords.includes(word))
  )];
};

export const calculateEyeContact = (landmarks: any): number => {
  // Simplified eye contact calculation using face landmarks
  if (!landmarks || landmarks.length < 10) return 0;
  const eyeLeft = landmarks[0];
  const eyeRight = landmarks[1];
  const noseTip = landmarks[2];
  
  const eyeDistance = Math.abs(eyeLeft.x - eyeRight.x);
  const noseOffset = Math.abs(noseTip.y - (eyeLeft.y + eyeRight.y)/2);
  return Math.min(100, 100 - (noseOffset / eyeDistance) * 50);
};

export const calculateCompositeScore = (): number => {
  // Weighted average of various metrics
  return Math.floor(
    (emotionAnalysis.confidence * 0.3) +
    (voiceAnalysis.clarity * 0.25) +
    (voiceAnalysis.grammar * 0.2) +
    (performanceMetrics.technicalAccuracy * 0.25)
  );
};

export const analyzeSentiment = (text: string): number => {
  // Simple sentiment analysis using keyword scoring
  const positiveWords = ['success', 'achieved', 'improved', 'excited'];
  const negativeWords = ['challenge', 'difficult', 'issue', 'problem'];
  
  const words = text.toLowerCase().split(' ');
  const positive = words.filter(w => positiveWords.includes(w)).length;
  const negative = words.filter(w => negativeWords.includes(w)).length;
  
  return Math.min(100, Math.max(0, 
    ((positive - negative) / words.length) * 100 + 50
  ));
}; 