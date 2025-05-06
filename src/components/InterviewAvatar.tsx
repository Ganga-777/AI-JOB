import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mic, Square, Play, MessageCircle, ThumbsUp, ThumbsDown, Loader2,
  Video, Camera, Volume2, Smile, Eye, Gauge, BrainCircuit, 
  Wand2, Settings2, RefreshCcw, AlertCircle, CheckCircle
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { 
  calculateClarityScore,
  calculatePitchVariation,
  detectFillerWords,
  calculateEyeContact,
  calculateCompositeScore,
  analyzeSentiment
} from '@/lib/analysisUtils';

// Add TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    FaceDetector: any;
  }
}

interface EmotionAnalysis {
  confidence: number;
  engagement: number;
  expressions: {
    smile: number;
    neutral: number;
    concern: number;
    enthusiasm: number;
    professionalism: number;
    eyeContactDuration: number;
    facialSymmetry: number;
  };
  eyeContact: number;
  gestures: {
    handMovements: number;
    posture: number;
    headMovements: number;
  };
}

interface VoiceAnalysis {
  clarity: number;
  pace: number;
  tone: number;
  volume: number;
  fillers: string[];
  enthusiasm: number;
  confidence: number;
  pronunciation: number;
  grammar: number;
}

interface InterviewFeedback {
  score: number;
  strengths: string[];
  improvements: string[];
  keywords: string[];
  sentiment: number;
  energyLevel: number;
  cognitiveLoad: number;
}

// Add speech synthesis and recognition interfaces
interface SpeechConfig {
  voice: SpeechSynthesisVoice | null;
  rate: number;
  pitch: number;
  volume: number;
}

interface InterviewAvatarProps {
  question: InterviewQuestion | null;
  onFeedback: (feedback: InterviewFeedback) => void;
  isPracticeMode: boolean;
}

const InterviewAvatar: React.FC<InterviewAvatarProps> = ({
  question,
  onFeedback,
  isPracticeMode
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [responses, setResponses] = useState<Array<{ question: string; answer: string; feedback: string }>>([]);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  const [emotionAnalysis, setEmotionAnalysis] = useState<EmotionAnalysis>({
    confidence: 0,
    engagement: 0,
    expressions: { 
      smile: 0, 
      neutral: 0, 
      concern: 0,
      enthusiasm: 0,
      professionalism: 0,
      eyeContactDuration: 0,
      facialSymmetry: 0
    },
    eyeContact: 0,
    gestures: { handMovements: 0, posture: 0, headMovements: 0 }
  });
  const [voiceAnalysis, setVoiceAnalysis] = useState<VoiceAnalysis>({
    clarity: 0,
    pace: 0,
    tone: 0,
    volume: 0,
    fillers: [],
    enthusiasm: 0,
    confidence: 0,
    pronunciation: 0,
    grammar: 0
  });
  const [settings, setSettings] = useState({
    camera: true,
    microphone: true,
    emotionDetection: true,
    voiceAnalysis: true,
    autoFeedback: true,
    avatarStyle: 'professional',
    responseDelay: 1000,
  });
  const [interviewMode, setInterviewMode] = useState<'standard' | 'intensive' | 'coaching'>('standard');
  const [avatarState, setAvatarState] = useState<'neutral' | 'speaking' | 'listening' | 'thinking'>('neutral');
  const [performanceMetrics, setPerformanceMetrics] = useState({
    technicalAccuracy: 0,
    communicationSkills: 0,
    problemSolving: 0,
    overallImpression: 0
  });
  const [avatarMood, setAvatarMood] = useState<'neutral' | 'happy' | 'thoughtful' | 'encouraging'>('neutral');
  const [gestureGuide, setGestureGuide] = useState(false);
  const [showEmotionDetails, setShowEmotionDetails] = useState(false);
  const [showVoiceDetails, setShowVoiceDetails] = useState(false);
  const [interactionTips, setInteractionTips] = useState<string[]>([
    "Keep your hands visible but avoid excessive gesturing",
    "Maintain a straight posture and lean slightly forward to show engagement",
    "Use natural facial expressions to convey enthusiasm",
    "Nod occasionally to show active listening",
    "Keep your movements calm and professional"
  ]);

  // Add speech-related state
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [speechRecognition, setSpeechRecognition] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechConfig, setSpeechConfig] = useState<SpeechConfig>({
    voice: null,
    rate: 1,
    pitch: 1,
    volume: 1
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Add these to your component's state
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentProcessingStage, setCurrentProcessingStage] = useState('');

  // Initialize audio and video streams
  useEffect(() => {
    if (settings.camera || settings.microphone) {
      initializeMediaStreams();
    }
    return () => {
      cleanupMediaStreams();
    };
  }, [settings.camera, settings.microphone]);

  // Initialize speech synthesis and recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize speech synthesis
      const synth = window.speechSynthesis;
      setSpeechSynthesis(synth);

      // Load and set default voice
      const loadVoices = () => {
        const voices = synth.getVoices();
        const defaultVoice = voices.find(voice => voice.lang === 'en-US');
        setSpeechConfig(prev => ({ ...prev, voice: defaultVoice }));
      };

      synth.onvoiceschanged = loadVoices;
      loadVoices();

      // Initialize speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map(result => result.transcript)
            .join('');
          setTranscript(transcript);
          
          // Process the transcript for keywords and analysis
          if (event.results[0].isFinal) {
            analyzeResponse(transcript);
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          toast({
            title: "Speech Recognition Error",
            description: "There was an error with speech recognition. Please try again.",
            variant: "destructive"
          });
        };

        setSpeechRecognition(recognition);
      }
    }
  }, []);

  const initializeMediaStreams = async () => {
    try {
      const constraints = {
        video: settings.camera,
        audio: settings.microphone
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current && settings.camera) {
        videoRef.current.srcObject = stream;
      }
      if (settings.microphone) {
        audioContextRef.current = new AudioContext();
        // Set up audio analysis nodes here
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast({
        title: "Media Access Error",
        description: "Unable to access camera or microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const cleanupMediaStreams = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current?.state !== 'closed') {
      audioContextRef.current?.close();
    }
  };

  const analyzeFacialExpressions = async (videoFrame: HTMLVideoElement) => {
    try {
      const faceDetector = new window.FaceDetector();
      const faces = await faceDetector.detect(videoFrame);
      
      if (faces.length > 0) {
        const face = faces[0];
        const expressions = {
          smile: face.expressions.smiling * 100,
          neutral: face.expressions.neutral * 100,
          eyeContact: calculateEyeContact(face.landmarks),
          // Add more expression analysis
        };
        setEmotionAnalysis(prev => ({
          ...prev,
          expressions: { ...prev.expressions, ...expressions }
        }));
      }
    } catch (error) {
      console.error('Face detection error:', error);
    }
  };

  const analyzeEmotions = () => {
    // Simulate emotion analysis with random values
    setEmotionAnalysis({
      confidence: Math.random() * 100,
      engagement: Math.random() * 100,
      expressions: {
        smile: Math.random() * 100,
        neutral: Math.random() * 100,
        concern: Math.random() * 100,
        enthusiasm: Math.random() * 100,
        professionalism: Math.random() * 100,
        eyeContactDuration: Math.random() * 100,
        facialSymmetry: Math.random() * 100
      },
      eyeContact: Math.random() * 100,
      gestures: {
        handMovements: Math.random() * 100,
        posture: Math.random() * 100,
        headMovements: Math.random() * 100
      }
    });
  };

  const analyzeVoicePatterns = (audioStream: MediaStream) => {
    const audioContext = new AudioContext();
    const analyzer = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(audioStream);
    source.connect(analyzer);

    const dataArray = new Uint8Array(analyzer.frequencyBinCount);
    
    const analyze = () => {
      analyzer.getByteFrequencyData(dataArray);
      
      // Calculate speech metrics
      const metrics = {
        clarity: calculateClarityScore(dataArray),
        pace: calculateWordsPerMinute(transcript),
        tone: calculatePitchVariation(dataArray),
        // Add vocal fillers detection
        fillers: detectFillerWords(transcript)
      };

      setVoiceAnalysis(prev => ({ ...prev, ...metrics }));
      
      if (isRecording) requestAnimationFrame(analyze);
    };

    analyze();
  };

  const generateAIFeedback = (): InterviewFeedback => {
    const { expressions, engagement } = emotionAnalysis;
    const { clarity, pace, fillers } = voiceAnalysis;

    const strengths = [];
    const improvements = [];
    
    if (expressions.smile > 60) strengths.push("Great use of positive facial expressions");
    if (clarity > 75) strengths.push("Clear and articulate speech");
    
    if (fillers.length > 5) improvements.push("Reduce use of filler words");
    if (engagement < 50) improvements.push("Try to maintain better eye contact");

    return {
      score: calculateCompositeScore(),
      strengths,
      improvements,
      keywords: extractKeyConcepts(transcript),
      sentiment: analyzeSentiment(transcript),
      // New metrics
      energyLevel: calculateEnergyLevel(voiceAnalysis.tone),
      cognitiveLoad: detectCognitiveStress(transcript, voiceAnalysis.pace)
    };
  };

  // Function to speak text
  const speak = (text: string) => {
    if (speechSynthesis && speechConfig.voice) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = speechConfig.voice;
      utterance.rate = speechConfig.rate;
      utterance.pitch = speechConfig.pitch;
      utterance.volume = speechConfig.volume;

      utterance.onstart = () => {
        setAvatarState('speaking');
      };

      utterance.onend = () => {
        setAvatarState('listening');
        // Start listening for response after speaking
        if (isRecording) {
          startListening();
        }
      };

      speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    if (speechRecognition) {
      speechRecognition.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (speechRecognition) {
      speechRecognition.stop();
      setIsListening(false);
    }
  };

  const analyzeResponse = (response: string) => {
    // Analyze the response for keywords and sentiment
    const words = response.toLowerCase().split(' ');
    const fillerWords = ['um', 'uh', 'like', 'you know'].filter(word => 
      words.includes(word)
    );

    // Update voice analysis with actual transcript data
    setVoiceAnalysis(prev => ({
      ...prev,
      fillers: fillerWords,
      clarity: calculateClarity(response),
      confidence: calculateConfidence(response),
      grammar: calculateGrammar(response)
    }));

    // Generate feedback based on the response
    const feedback = generateAIFeedback();
    setFeedback(JSON.stringify(feedback, null, 2));
  };

  const calculateClarity = (text: string): number => {
    // Simple clarity calculation based on word length and common patterns
    const words = text.split(' ');
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    return Math.min(100, avgWordLength * 10);
  };

  const calculateConfidence = (text: string): number => {
    // Confidence calculation based on sentence structure and length
    const sentences = text.split(/[.!?]+/);
    const avgSentenceLength = sentences.reduce((sum, sent) => sum + sent.trim().split(' ').length, 0) / sentences.length;
    return Math.min(100, avgSentenceLength * 5);
  };

  const calculateGrammar = (text: string): number => {
    // Simple grammar check based on sentence structure
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const wellFormedCount = sentences.filter(s => {
      const words = s.trim().split(' ');
      return words.length > 2 && words[0].charAt(0) === words[0].charAt(0).toUpperCase();
    }).length;
    return (wellFormedCount / sentences.length) * 100;
  };

  const generateFeedbackFromResponse = (response: string): InterviewFeedback => {
    // Generate feedback based on actual response
    const feedback: InterviewFeedback = {
      score: calculateConfidence(response),
      strengths: [],
      improvements: [],
      keywords: [],
      sentiment: 0,
      energyLevel: 0,
      cognitiveLoad: 0
    };

    // Extract keywords from response
    const words = response.toLowerCase().split(' ');
    const technicalKeywords = ['algorithm', 'database', 'api', 'framework', 'testing'];
    const softSkillKeywords = ['team', 'collaborate', 'lead', 'manage', 'solve'];
    
    feedback.keywords = [...technicalKeywords, ...softSkillKeywords].filter(
      keyword => words.includes(keyword)
    );

    // Analyze response structure
    if (response.length > 100) {
      feedback.strengths.push('Provided detailed response');
    } else {
      feedback.improvements.push('Consider providing more detailed examples');
    }

    if (words.includes('example') || words.includes('instance')) {
      feedback.strengths.push('Good use of specific examples');
    }

    return feedback;
  };

  // Modify existing handlers to use speech
  const handleStartRecording = async () => {
    try {
      setIsRecording(true);
      setAvatarState('listening');
      
      // Start with an introduction
      speak("Hello! I'm your AI interviewer today. I'll be asking you some questions about your experience and skills. Please speak clearly and take your time with your responses.");
      
      // Start media analysis
      if (settings.emotionDetection) {
        const emotionAnalysisInterval = setInterval(analyzeEmotions, 1000);
        return () => clearInterval(emotionAnalysisInterval);
      }
      if (settings.voiceAnalysis) {
        const voiceAnalysisInterval = setInterval(analyzeVoicePatterns, 1000);
        return () => clearInterval(voiceAnalysisInterval);
      }

      toast({
        title: "Interview Started",
        description: "The AI interviewer is speaking. Listen carefully and respond when prompted.",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Failed to start recording. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleStopRecording = async () => {
    try {
      setIsRecording(false);
      setIsProcessing(true);
      setAvatarState('thinking');
      
      // Stop listening for response
      stopListening();
      
      // Provide verbal feedback
      speak("Thank you for your response. Let me analyze that for a moment.");
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const feedback = generateAIFeedback();
      setConfidenceScore(feedback.score);
      setFeedback(JSON.stringify(feedback, null, 2));
      
      // Send feedback to parent component
      onFeedback(feedback);
      
      // Provide verbal feedback summary
      speak(`Great! Here's my feedback. ${feedback.strengths[0]}. However, ${feedback.improvements[0]}. Would you like to move on to the next question?`);
      
      // Save interview data
      if (user?.id) {
        await saveInterviewData(feedback);
      }

      setIsProcessing(false);
      setAvatarState('neutral');
      
      toast({
        title: "Analysis Complete",
        description: "Your detailed feedback is ready for review",
      });
    } catch (error) {
      console.error('Error processing recording:', error);
      setIsProcessing(false);
      toast({
        title: "Processing Error",
        description: "Failed to analyze response. Please try again.",
        variant: "destructive"
      });
    }
  };

  const saveInterviewData = async (feedback: InterviewFeedback) => {
    try {
      // Store interview data in local storage instead since we don't have the correct table
      const interviewData = {
        user_id: user?.id,
        question: currentQuestion,
        feedback: feedback,
        metrics: {
          emotion: emotionAnalysis,
          voice: voiceAnalysis,
          performance: performanceMetrics
        },
        created_at: new Date().toISOString()
      };
      
      const existingData = localStorage.getItem('interview_responses');
      const responses = existingData ? JSON.parse(existingData) : [];
      responses.push(interviewData);
      localStorage.setItem('interview_responses', JSON.stringify(responses));
      
    } catch (error) {
      console.error('Error saving interview data:', error);
      throw error;
    }
  };

  const getEmotionColor = (value: number) => {
    if (value >= 80) return 'text-green-500';
    if (value >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getAvatarExpression = () => {
    if (emotionAnalysis.expressions.enthusiasm > 80) return 'happy';
    if (emotionAnalysis.expressions.concern > 60) return 'thoughtful';
    if (emotionAnalysis.confidence > 70) return 'encouraging';
    return 'neutral';
  };

  useEffect(() => {
    if (isRecording) {
      const expressionInterval = setInterval(() => {
        setAvatarMood(getAvatarExpression());
      }, 2000);
      return () => clearInterval(expressionInterval);
    }
  }, [isRecording, emotionAnalysis]);

  const renderGestureGuide = () => {
    if (!gestureGuide) return null;

    return (
      <div className="mt-4 p-4 bg-primary/5 rounded-lg">
        <h4 className="font-medium mb-2">Gesture Guidelines</h4>
        <ul className="space-y-2 text-sm">
          {interactionTips.map((tip, index) => (
            <li key={index} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Add speech configuration controls to the settings panel
  const renderSpeechSettings = () => {
    if (!speechSynthesis) return null;

    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Voice Speed</label>
          <Slider
            value={[speechConfig.rate * 100]}
            onValueChange={(value) => setSpeechConfig(prev => ({ ...prev, rate: value[0] / 100 }))}
            max={200}
            step={10}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Voice Pitch</label>
          <Slider
            value={[speechConfig.pitch * 100]}
            onValueChange={(value) => setSpeechConfig(prev => ({ ...prev, pitch: value[0] / 100 }))}
            max={200}
            step={10}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Voice Volume</label>
          <Slider
            value={[speechConfig.volume * 100]}
            onValueChange={(value) => setSpeechConfig(prev => ({ ...prev, volume: value[0] / 100 }))}
            max={100}
            step={10}
          />
        </div>
      </div>
    );
  };

  // Speak the question when it changes
  useEffect(() => {
    if (question && speechSynthesis && speechConfig.voice) {
      const questionText = isPracticeMode
        ? `${question.text}. Here are some tips: ${question.tips.join('. ')}`
        : question.text;
      speak(questionText);
    }
  }, [question, isPracticeMode]);

  // Add question type detection
  const analyzeQuestionType = (question: string) => {
    const technicalKeywords = ['algorithm', 'framework', 'debug'];
    const behavioralKeywords = ['experience', 'situation', 'challenge'];
    
    return {
      isTechnical: technicalKeywords.some(kw => question.includes(kw)),
      isBehavioral: behavioralKeywords.some(kw => question.includes(kw))
    };
  };

  // Adaptive analysis based on question type
  const performAdaptiveAnalysis = () => {
    const { isTechnical, isBehavioral } = analyzeQuestionType(currentQuestion);
    
    if (isTechnical) {
      focusAnalysisOn('technicalAccuracy', 'problemSolving');
    }
    if (isBehavioral) {
      focusAnalysisOn('communication', 'emotionalIntelligence');
    }
  };

  return (
    <div className="space-y-6">
      {/* Avatar and Video Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Avatar className="w-32 h-32 mx-auto">
                <AvatarImage 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=interview-ai-${avatarMood}`} 
                  className="animate-pulse"
                />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <Badge 
                variant={avatarState === 'listening' ? 'default' : 'secondary'}
                className="absolute top-0 right-0"
              >
                {avatarState.charAt(0).toUpperCase() + avatarState.slice(1)}
              </Badge>
              <div className="absolute bottom-0 right-0">
                <Badge variant="outline" className="bg-white">
                  {avatarMood.charAt(0).toUpperCase() + avatarMood.slice(1)}
                </Badge>
              </div>
            </div>
            {settings.camera && (
              <div className="mt-4 relative rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-48 object-cover"
                />
                <div className="absolute bottom-2 right-2 flex gap-2">
                  <Badge variant="secondary">
                    <Eye className="w-4 h-4 mr-1" />
                    {Math.round(emotionAnalysis.eyeContact)}%
                  </Badge>
                  <Badge variant="secondary">
                    <Smile className="w-4 h-4 mr-1" />
                    {Math.round(emotionAnalysis.expressions.smile)}%
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setGestureGuide(!gestureGuide)}
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              </div>
            )}
            {renderGestureGuide()}
          </CardContent>
        </Card>

        {/* Real-time Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Real-time Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Enhanced Emotion Analysis */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <BrainCircuit className="h-4 w-4" />
                  Emotion Analysis
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEmotionDetails(!showEmotionDetails)}
                >
                  {showEmotionDetails ? 'Less' : 'More'} Details
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Confidence</span>
                  <Progress 
                    value={emotionAnalysis.confidence} 
                    className="h-2"
                  />
                </div>
                <div>
                  <span className="text-sm text-gray-500">Engagement</span>
                  <Progress 
                    value={emotionAnalysis.engagement} 
                    className="h-2"
                  />
                </div>
              </div>
              
              {showEmotionDetails && (
                <div className="mt-4 space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">Professionalism</span>
                    <Progress value={emotionAnalysis.expressions.professionalism} className="h-2" />
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Enthusiasm</span>
                    <Progress value={emotionAnalysis.expressions.enthusiasm} className="h-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Posture</span>
                      <Progress value={emotionAnalysis.gestures.posture} className="h-2" />
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Hand Gestures</span>
                      <Progress value={emotionAnalysis.gestures.handMovements} className="h-2" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Voice Analysis */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Voice Analysis
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVoiceDetails(!showVoiceDetails)}
                >
                  {showVoiceDetails ? 'Less' : 'More'} Details
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Clarity</span>
                  <Progress value={voiceAnalysis.clarity} className="h-2" />
                </div>
                <div>
                  <span className="text-sm text-gray-500">Pace</span>
                  <Progress value={voiceAnalysis.pace} className="h-2" />
                </div>
              </div>
              
              {showVoiceDetails && (
                <div className="mt-4 space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">Pronunciation</span>
                    <Progress value={voiceAnalysis.pronunciation} className="h-2" />
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Grammar</span>
                    <Progress value={voiceAnalysis.grammar} className="h-2" />
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Voice Confidence</span>
                    <Progress value={voiceAnalysis.confidence} className="h-2" />
                  </div>
                  {voiceAnalysis.fillers.length > 0 && (
                    <div className="mt-2">
                      <span className="text-sm text-gray-500">Filler Words Used:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {voiceAnalysis.fillers.map((word, index) => (
                          <Badge key={index} variant="outline" className="text-yellow-600">
                            {word}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Performance Metrics */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Overall Performance
              </h4>
              <div className="space-y-3">
                {Object.entries(performanceMetrics).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className={getEmotionColor(value)}>{Math.round(value)}%</span>
                    </div>
                    <Progress value={value} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interview Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center gap-4">
            {!isRecording ? (
              <Button
                onClick={handleStartRecording}
                className="flex items-center gap-2"
                disabled={isProcessing}
              >
                <Mic className="w-4 h-4" />
                Start Recording
              </Button>
            ) : (
              <Button
                onClick={handleStopRecording}
                variant="destructive"
                className="flex items-center gap-2"
                disabled={isProcessing}
              >
                <Square className="w-4 h-4" />
                Stop Recording
              </Button>
            )}
          </div>

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="ai-processing-overlay">
              <div className="ai-processing-details">
                <Loader2 className="w-4 h-4 animate-spin" />
                <div className="processing-metrics">
                  <span>Analyzing speech patterns...</span>
                  <Progress value={processingProgress} />
                  <span>Detecting key concepts: {currentProcessingStage}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Avatar Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Camera</span>
                <Button
                  variant={settings.camera ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSettings(s => ({ ...s, camera: !s.camera }))}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Microphone</span>
                <Button
                  variant={settings.microphone ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSettings(s => ({ ...s, microphone: !s.microphone }))}
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Emotion Detection</span>
                <Button
                  variant={settings.emotionDetection ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSettings(s => ({ ...s, emotionDetection: !s.emotionDetection }))}
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Voice Analysis</span>
                <Button
                  variant={settings.voiceAnalysis ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSettings(s => ({ ...s, voiceAnalysis: !s.voiceAnalysis }))}
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {renderSpeechSettings()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InterviewAvatar;