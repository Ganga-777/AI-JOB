import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import InterviewAvatar from '@/components/InterviewAvatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import {
  PlayCircle, PauseCircle, StopCircle, Clock, Award, Mic, Settings,
  BookOpen, BrainCircuit, MessageSquare, BarChart, Save, Download,
  Volume2, RefreshCw, CheckCircle2, XCircle, Video, VideoOff
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/facemesh';
import { Tensor2D } from '@tensorflow/tfjs';

// Fix type definition for facemesh keypoints
type Coords3D = Array<[number, number, number]>;
type FaceMeshKeypoints = Coords3D | Tensor2D;

interface InterviewQuestion {
  id: number;
  text: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  expectedKeywords: string[];
  followUpQuestions: string[];
  tips: string[];
  sampleAnswer?: string;
}

interface InterviewSession {
  id: string;
  date: Date;
  duration: number;
  score: number;
  type: string;
  questions: number;
  confidence: number;
  feedback: string[];
  improvement_areas: string[];
}

interface ResponseFeedback {
  strengths: string[];
  improvements: string[];
  keywords: string[];
  score: number;
}

interface FacialExpression {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
}

interface FacialAnalysis {
  expressions: FacialExpression;
  eyeContact: number;
  confidence: number;
}

const sampleQuestions: InterviewQuestion[] = [
  {
    id: 1,
    text: "Tell me about your most challenging project and how you overcame the obstacles.",
    category: "behavioral",
    difficulty: "medium",
    expectedKeywords: ["challenge", "project", "solution", "team", "outcome"],
    followUpQuestions: [
      "What was the key learning from this experience?",
      "How would you handle a similar situation differently now?"
    ],
    tips: [
      "Use the STAR method to structure your response",
      "Focus on your specific contributions",
      "Highlight the positive outcome"
    ],
    sampleAnswer: "In my previous role, I led a critical project that was falling behind schedule. I identified the bottlenecks, reorganized the team structure, and implemented daily stand-ups. This resulted in completing the project on time and under budget."
  },
  {
    id: 2,
    text: "How do you handle conflicts within a team?",
    category: "behavioral",
    difficulty: "medium",
    expectedKeywords: ["communication", "resolution", "mediate", "understand", "compromise"],
    followUpQuestions: [
      "Can you give a specific example?",
      "How do you prevent conflicts from escalating?"
    ],
    tips: [
      "Emphasize your communication skills",
      "Show your ability to remain neutral",
      "Highlight positive outcomes"
    ],
    sampleAnswer: "I believe in addressing conflicts early through open communication. I once mediated a disagreement between team members by organizing a meeting, letting each person express their concerns, and facilitating a discussion to find common ground."
  },
  {
    id: 3,
    text: "Explain your approach to problem-solving in a technical context.",
    category: "technical",
    difficulty: "hard",
    expectedKeywords: ["analyze", "debug", "test", "optimize", "document"],
    followUpQuestions: [
      "How do you prioritize different solutions?",
      "How do you validate your solution?"
    ],
    tips: [
      "Break down your problem-solving process",
      "Include specific tools or methods you use",
      "Mention how you document solutions"
    ],
    sampleAnswer: "I follow a systematic approach: first understanding the problem thoroughly, breaking it down into smaller components, researching potential solutions, implementing the most efficient one, and thoroughly testing it. I also document my process and solutions for future reference."
  }
];

const Interview = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // State management
  const [interviewState, setInterviewState] = useState<'idle' | 'preparing' | 'in-progress' | 'paused' | 'completed'>('idle');
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedRole, setSelectedRole] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [interviewType, setInterviewType] = useState('technical');
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState(75);
  const [confidence, setConfidence] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Array<{ question: string; answer: string; feedback: string; score: number }>>([]);
  const [pastSessions, setPastSessions] = useState<InterviewSession[]>([]);
  const [settings, setSettings] = useState({
    voiceFeedback: true,
    autoFollowUp: true,
    strictMode: false,
    duration: 30, // minutes
  });
  const [showTips, setShowTips] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [showSampleAnswer, setShowSampleAnswer] = useState(false);
  const [interviewTips, setInterviewTips] = useState<string[]>([
    "Maintain good eye contact with the camera",
    "Speak clearly and at a moderate pace",
    "Use the STAR method for behavioral questions",
    "Take a brief pause before answering to gather your thoughts",
    "Keep your responses focused and concise"
  ]);
  const [currentTip, setCurrentTip] = useState(0);
  const [showTimer, setShowTimer] = useState(true);
  const [answerFeedback, setAnswerFeedback] = useState<ResponseFeedback | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);

  // Add new state variables for facial analysis
  const [facialAnalysisEnabled, setFacialAnalysisEnabled] = useState(false);
  const [facialModel, setFacialModel] = useState<facemesh.FaceMesh | null>(null);
  const [facialAnalysis, setFacialAnalysis] = useState<FacialAnalysis>({
    expressions: {
      neutral: 0,
      happy: 0,
      sad: 0,
      angry: 0,
      fearful: 0,
      disgusted: 0,
      surprised: 0
    },
    eyeContact: 0,
    confidence: 0
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const interviewTypes = [
    { id: 'technical', name: 'Technical Interview', icon: BrainCircuit },
    { id: 'behavioral', name: 'Behavioral Interview', icon: MessageSquare },
    { id: 'general', name: 'General Interview', icon: BookOpen },
  ];

  const roles = [
    { id: 'software-engineer', name: 'Software Engineer', levels: ['Junior', 'Mid-Level', 'Senior'] },
    { id: 'data-scientist', name: 'Data Scientist', levels: ['Entry Level', 'Mid-Level', 'Senior'] },
    { id: 'product-manager', name: 'Product Manager', levels: ['Associate', 'Senior', 'Lead'] },
    { id: 'ux-designer', name: 'UX Designer', levels: ['Junior', 'Mid-Level', 'Senior'] },
  ];

  // Questions based on role and type
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (interviewState === 'in-progress') {
      timer = setInterval(() => {
        setDuration(prev => prev + 1);
        setProgress(prev => Math.min(prev + 0.5, 100));
        // Simulate confidence changes
        setConfidence(prev => {
          const change = Math.random() * 2 - 1; // Random change between -1 and 1
          return Math.min(Math.max(prev + change, 0), 100);
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [interviewState]);

  useEffect(() => {
    // Rotate interview tips every 10 seconds
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % interviewTips.length);
    }, 10000);

    return () => clearInterval(tipInterval);
  }, [interviewTips.length]);

  useEffect(() => {
    // Load questions based on role and type
    if (selectedRole && interviewType) {
      const filteredQuestions = sampleQuestions.filter(q => 
        (interviewType === 'technical' && q.category === 'technical') ||
        (interviewType === 'behavioral' && q.category === 'behavioral') ||
        interviewType === 'general'
      );
      setQuestions(filteredQuestions);
    }
  }, [selectedRole, interviewType]);

  // Load facial analysis model
  useEffect(() => {
    const loadFacialModel = async () => {
      await tf.ready();
      const model = await facemesh.load({
        maxFaces: 1,
        detectionConfidence: 0.8,
      });
      setFacialModel(model);
      console.log("Facial analysis model loaded");
    };

    if (facialAnalysisEnabled) {
      loadFacialModel();
    }
  }, [facialAnalysisEnabled]);

  // Setup webcam for facial analysis
  useEffect(() => {
    let animationFrameId: number;
    
    const setupWebcam = async () => {
      if (!videoRef.current || !facialAnalysisEnabled || !facialModel) return;
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        // Start facial analysis loop
        const analyzeFace = async () => {
          if (!videoRef.current || !canvasRef.current || !facialModel) return;
          
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          
          if (video.readyState === 4 && ctx) {
            // Get video dimensions
            const videoWidth = video.videoWidth;
            const videoHeight = video.videoHeight;
            
            // Set canvas dimensions to match video
            canvas.width = videoWidth;
            canvas.height = videoHeight;
            
            // Detect faces
            const faces = await facialModel.estimateFaces(video);
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (faces.length > 0) {
              // Draw facial landmarks
              const face = faces[0];
              const keypoints = face.scaledMesh;
              
              // Simple analysis based on facial landmarks
              // This is a simplified version - in a real app you'd use a more sophisticated model
              const eyeContactScore = calculateEyeContact(keypoints);
              const expressionScores = analyzeExpressions(keypoints);
              
              setFacialAnalysis({
                expressions: expressionScores,
                eyeContact: eyeContactScore,
                confidence: face.faceInViewConfidence
              });
              
              // Draw facial mesh (optional - for debugging)
              if (interviewState === 'in-progress') {
                drawFacialMesh(ctx, keypoints);
              }
            }
          }
          
          animationFrameId = requestAnimationFrame(analyzeFace);
        };
        
        analyzeFace();
      } catch (error) {
        console.error("Error accessing webcam:", error);
        toast({
          title: "Webcam access error",
          description: "Could not access your camera for facial analysis.",
          variant: "destructive"
        });
        setFacialAnalysisEnabled(false);
      }
    };
    
    if (facialAnalysisEnabled && facialModel) {
      setupWebcam();
    }
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      // Stop webcam stream when component unmounts
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facialAnalysisEnabled, facialModel, interviewState]);

  // Helper functions for facial analysis
  const calculateEyeContact = (keypoints: FaceMeshKeypoints): number => {
    // Convert Tensor2D to array if needed
    if (keypoints instanceof tf.Tensor) {
      // This is a simplified conversion - in a real app, you'd need a proper tensor handling
      console.log("Tensor keypoints detected, converting to array");
      return 0.85; // Default value for tensor input
    }
    
    // For Coords3D array
    // Simplified eye contact calculation
    // In a real implementation, you would analyze eye landmarks and gaze direction
    return Math.random() * 0.3 + 0.7; // Placeholder value between 0.7-1.0
  };
  
  const analyzeExpressions = (keypoints: FaceMeshKeypoints): FacialExpression => {
    // Convert Tensor2D to array if needed
    if (keypoints instanceof tf.Tensor) {
      // This is a simplified conversion - in a real app, you'd need a proper tensor handling
      console.log("Tensor keypoints detected, using default expressions");
      return {
        neutral: 0.8,
        happy: 0.1,
        sad: 0.0,
        angry: 0.0,
        fearful: 0.05,
        disgusted: 0.0,
        surprised: 0.05
      };
    }
    
    // Simplified expression analysis
    // In a real implementation, you would use a proper emotion classification model
    return {
      neutral: Math.random() * 0.5 + 0.5, // Dominant during interview
      happy: Math.random() * 0.3,
      sad: Math.random() * 0.1,
      angry: Math.random() * 0.1,
      fearful: Math.random() * 0.2,
      disgusted: Math.random() * 0.05,
      surprised: Math.random() * 0.15
    };
  };
  
  const drawFacialMesh = (ctx: CanvasRenderingContext2D, keypoints: FaceMeshKeypoints) => {
    // Handle tensor keypoints
    if (keypoints instanceof tf.Tensor) {
      console.log("Cannot draw tensor keypoints directly");
      return;
    }
    
    // Draw facial keypoints for Coords3D array
    ctx.fillStyle = '#32CD32';
    keypoints.forEach(point => {
      ctx.beginPath();
      ctx.arc(point[0], point[1], 1, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  // Toggle facial analysis
  const toggleFacialAnalysis = () => {
    setFacialAnalysisEnabled(!facialAnalysisEnabled);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResponseFeedback = (feedback: ResponseFeedback) => {
    setAnswerFeedback({
      strengths: feedback.strengths,
      improvements: feedback.improvements,
      keywords: feedback.keywords,
      score: feedback.score
    });

    // Update progress
    const progressIncrement = (1 / questions.length) * 100;
    setProgress(prev => Math.min(prev + progressIncrement, 100));
  };

  const askQuestion = (question: InterviewQuestion) => {
    // Update current question and prepare follow-up questions
    const questionText = isPracticeMode
      ? `${question.text}\n\nTips: ${question.tips.join(', ')}`
      : question.text;

    setCurrentQuestion(question);
  };

  const handleStartInterview = () => {
    if (!selectedRole) {
      toast({
        title: "Role Required",
        description: "Please select a role to begin the interview.",
        variant: "destructive",
      });
      return;
    }

    // Enhanced interview start with practice mode option
    if (isPracticeMode) {
      toast({
        title: "Practice Mode Enabled",
        description: "You'll see sample answers and tips after each response.",
      });
    }

    setInterviewState('in-progress');
    setProgress(0);
    setDuration(0);
    setCurrentQuestionIndex(0);
    setResponses([]);
    setShowTimer(true);
    setIsRecording(true);

    // Ask the first question
    if (questions.length > 0) {
      askQuestion(questions[0]);
    }
  };

  const handlePauseInterview = () => {
    setInterviewState(prev => prev === 'in-progress' ? 'paused' : 'in-progress');
    setIsRecording(prev => !prev);
    toast({
      title: interviewState === 'in-progress' ? "Interview Paused" : "Interview Resumed",
      description: interviewState === 'in-progress' 
        ? "Take a moment to prepare your thoughts." 
        : "Continue with your interview.",
    });
  };

  const handleEndInterview = () => {
    setInterviewState('completed');
    setIsRecording(false);
    
    // Save session
    const newSession: InterviewSession = {
      id: Date.now().toString(),
      date: new Date(),
      duration,
      score: Math.round(confidence),
      type: interviewType,
      questions: responses.length,
      confidence: Math.round(confidence),
      feedback: [],
      improvement_areas: [],
    };
    setPastSessions(prev => [newSession, ...prev]);

    toast({
      title: "Interview Completed",
      description: "Your detailed feedback report is ready for review.",
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      askQuestion(questions[nextIndex]);

      // Reset feedback for new question
      setAnswerFeedback(null);
      
      toast({
        title: "Next Question",
        description: "Moving on to the next question. Listen carefully.",
      });
    } else {
      handleEndInterview();
    }
  };

  const handleDownloadReport = () => {
    // Implement report generation and download
    toast({
      title: "Report Downloaded",
      description: "Your interview feedback report has been downloaded.",
    });
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const renderInterviewPrep = () => {
    if (interviewState !== 'idle' && interviewState !== 'preparing') return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Interview Preparation
          </CardTitle>
          <CardDescription>
            Get ready for your interview with these helpful resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-primary/5 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Current Tip:</h4>
              <p className="text-muted-foreground">{interviewTips[currentTip]}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsPracticeMode(!isPracticeMode)}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {isPracticeMode ? 'Disable Practice Mode' : 'Enable Practice Mode'}
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowTips(!showTips)}
              >
                <BrainCircuit className="mr-2 h-4 w-4" />
                {showTips ? 'Hide Interview Tips' : 'Show Interview Tips'}
              </Button>
            </div>

            {showTips && (
              <div className="mt-4 space-y-2">
                <h4 className="font-semibold">Interview Tips:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {interviewTips.map((tip, index) => (
                    <li key={index} className="text-sm text-muted-foreground">{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderQuestionFeedback = () => {
    if (!answerFeedback || interviewState !== 'in-progress') return null;

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg">Response Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-green-600">Strengths</h4>
              <ul className="list-disc list-inside mt-2">
                {answerFeedback.strengths.map((strength, index) => (
                  <li key={index} className="text-sm">{strength}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-yellow-600">Areas for Improvement</h4>
              <ul className="list-disc list-inside mt-2">
                {answerFeedback.improvements.map((improvement, index) => (
                  <li key={index} className="text-sm">{improvement}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-medium">Keywords Detected</h4>
              <div className="flex flex-wrap gap-2 mt-2">
                {answerFeedback.keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary">{keyword}</Badge>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Response Score</span>
                <span className={`font-bold ${getConfidenceColor(answerFeedback.score)}`}>
                  {answerFeedback.score}%
                </span>
              </div>
              <Progress value={answerFeedback.score} className="mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div>
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-24 w-full rounded-lg mb-4" />
            <Skeleton className="h-12 w-48 rounded-full mb-4" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* External Interview Simulator Banner */}
      <div className="bg-primary/10 p-4 flex flex-col sm:flex-row items-center justify-between">
        <div className="mb-4 sm:mb-0">
          <h3 className="text-lg font-semibold">Try our Advanced AI Interview Simulator</h3>
          <p className="text-sm text-muted-foreground">Practice with intelligent, role-specific questions and get detailed feedback</p>
        </div>
        <a 
          href="https://f61497aa-ee70-4e5c-89a8-f89385ab5572-00-1lf0kaaplig90.picard.replit.dev/start_interview/1" 
          target="_blank" 
          rel="noopener noreferrer"
          className="no-underline"
        >
          <Button className="bg-primary hover:bg-primary/90">
            <MessageSquare className="mr-2 h-4 w-4" />
            Launch Interview Simulator
          </Button>
        </a>
      </div>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {renderInterviewPrep()}
          
          {/* Main Interview Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">AI Interview Session</CardTitle>
                  <CardDescription>Practice your interview skills with our advanced AI assistant</CardDescription>
                </div>
                <Badge variant={interviewState === 'in-progress' ? 'default' : 'secondary'}>
                  {interviewState === 'idle' && 'Ready to Start'}
                  {interviewState === 'preparing' && 'Select Options'}
                  {interviewState === 'in-progress' && 'In Progress'}
                  {interviewState === 'paused' && 'Paused'}
                  {interviewState === 'completed' && 'Completed'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Interview Setup */}
                {(interviewState === 'idle' || interviewState === 'preparing') && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Select Role</label>
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map(role => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Interview Type</label>
                        <Select value={interviewType} onValueChange={setInterviewType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select interview type" />
                          </SelectTrigger>
                          <SelectContent>
                            {interviewTypes.map(type => (
                              <SelectItem key={type.id} value={type.id}>
                                <div className="flex items-center gap-2">
                                  <type.icon className="h-4 w-4" />
                                  {type.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Difficulty Level</label>
                        <Select value={difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setDifficulty(value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Interview Duration</label>
                        <Select value={settings.duration.toString()} onValueChange={(value) => setSettings({ ...settings, duration: parseInt(value) })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="45">45 minutes</SelectItem>
                            <SelectItem value="60">60 minutes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Interview Settings */}
                    <Card className="bg-gray-50">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Settings className="h-5 w-5" />
                          Interview Settings
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Voice Feedback</span>
                            <Button
                              variant={settings.voiceFeedback ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSettings(s => ({ ...s, voiceFeedback: !s.voiceFeedback }))}
                            >
                              {settings.voiceFeedback ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Auto Follow-up Questions</span>
                            <Button
                              variant={settings.autoFollowUp ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSettings(s => ({ ...s, autoFollowUp: !s.autoFollowUp }))}
                            >
                              {settings.autoFollowUp ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Strict Mode</span>
                            <Button
                              variant={settings.strictMode ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSettings(s => ({ ...s, strictMode: !s.strictMode }))}
                            >
                              {settings.strictMode ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">AI Voice Volume</span>
                              <span className="text-sm text-gray-500">{volume}%</span>
                            </div>
                            <Slider
                              value={[volume]}
                              onValueChange={(value) => setVolume(value[0])}
                              max={100}
                              step={1}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Progress and Timer */}
                {interviewState !== 'idle' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Progress</span>
                        <Badge variant="outline">{Math.round(progress)}%</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-mono">{formatTime(duration)}</span>
                      </div>
                    </div>
                    <Progress value={progress} />
                  </div>
                )}

                {/* Interview Controls */}
                <div className="flex justify-center gap-4">
                  {interviewState === 'idle' && (
                    <Button onClick={handleStartInterview} className="w-40">
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Start Interview
                    </Button>
                  )}
                  {(interviewState === 'in-progress' || interviewState === 'paused') && (
                    <>
                      <Button onClick={handlePauseInterview} variant="outline" className="w-40">
                        {interviewState === 'in-progress' ? (
                          <>
                            <PauseCircle className="mr-2 h-4 w-4" />
                            Pause
                          </>
                        ) : (
                          <>
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Resume
                          </>
                        )}
                      </Button>
                      <Button onClick={handleEndInterview} variant="destructive" className="w-40">
                        <StopCircle className="mr-2 h-4 w-4" />
                        End Interview
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interview Content */}
          {interviewState === 'in-progress' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* AI Avatar and Current Question */}
              <Card>
                <CardContent className="pt-6">
                  <InterviewAvatar
                    question={currentQuestion}
                    onFeedback={handleResponseFeedback}
                    isPracticeMode={isPracticeMode}
                  />
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">Current Question</h3>
                      </div>
                      {isPracticeMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSampleAnswer(!showSampleAnswer)}
                        >
                          {showSampleAnswer ? 'Hide Sample' : 'Show Sample'}
                        </Button>
                      )}
                    </div>
                    <p className="text-gray-600">
                      {currentQuestion?.text || "Loading next question..."}
                    </p>
                    {showSampleAnswer && isPracticeMode && currentQuestion?.sampleAnswer && (
                      <div className="mt-4 p-4 bg-primary/5 rounded-lg">
                        <h4 className="font-medium mb-2">Sample Answer:</h4>
                        <p className="text-sm text-muted-foreground">
                          {currentQuestion.sampleAnswer}
                        </p>
                      </div>
                    )}
                    {isRecording && (
                      <div className="flex items-center gap-2 text-red-500">
                        <Mic className="h-4 w-4 animate-pulse" />
                        <span className="text-sm">Recording your answer...</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button onClick={handleNextQuestion} className="w-full">
                    Next Question
                  </Button>
                </CardFooter>
              </Card>

              {/* Real-time Feedback */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Real-time Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Confidence Score</span>
                      <span className={`text-lg font-semibold ${getConfidenceColor(confidence)}`}>
                        {Math.round(confidence)}%
                      </span>
                    </div>
                    <Progress value={confidence} className="h-2" />
                    
                    {/* Keywords Detected */}
                    <div className="space-y-2">
                      <h4 className="font-medium">Keywords Detected</h4>
                      <div className="flex flex-wrap gap-2">
                        {['React', 'TypeScript', 'API', 'Testing'].map((keyword) => (
                          <Badge key={keyword} variant="secondary">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Voice Analysis */}
                    <div className="space-y-2">
                      <h4 className="font-medium">Voice Analysis</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-500">Clarity</span>
                          <Progress value={85} className="h-2" />
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Pace</span>
                          <Progress value={75} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {renderQuestionFeedback()}

          {/* Interview Results */}
          {interviewState === 'completed' && (
            <Card>
              <CardHeader>
                <CardTitle>Interview Results</CardTitle>
                <CardDescription>
                  Review your performance and get detailed feedback
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="summary">
                  <TabsList>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="questions">Questions & Answers</TabsTrigger>
                    <TabsTrigger value="feedback">Detailed Feedback</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  </TabsList>

                  <TabsContent value="summary" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Overall Score</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-primary">
                            {Math.round(confidence)}%
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Questions Answered</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">
                            {responses.length}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Duration</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">
                            {formatTime(duration)}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Button onClick={handleDownloadReport} className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Download Detailed Report
                    </Button>
                  </TabsContent>

                  <TabsContent value="questions">
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-4">
                        {responses.map((response, index) => (
                          <Card key={index}>
                            <CardHeader>
                              <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <p className="font-medium">{response.question}</p>
                                <p className="text-gray-600">{response.answer}</p>
                                <div className="flex items-center justify-between">
                                  <Badge variant="outline">Score: {response.score}%</Badge>
                                  <p className="text-sm text-gray-500">{response.feedback}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="feedback">
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Strengths</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc list-inside space-y-2">
                            <li>Clear communication and articulation</li>
                            <li>Strong technical knowledge demonstration</li>
                            <li>Good examples provided for behavioral questions</li>
                          </ul>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Areas for Improvement</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc list-inside space-y-2">
                            <li>Consider providing more specific examples</li>
                            <li>Work on pace of speech - sometimes too fast</li>
                            <li>Expand on technical implementation details</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="analytics">
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Performance Trends</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[200px] flex items-center justify-center text-gray-500">
                            Performance graph visualization would go here
                          </div>
                        </CardContent>
                      </Card>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Keyword Usage</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {['Technical Skills', 'Soft Skills', 'Industry Knowledge'].map((category) => (
                                <div key={category} className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span>{category}</span>
                                    <span>{Math.round(Math.random() * 100)}%</span>
                                  </div>
                                  <Progress value={Math.random() * 100} className="h-2" />
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Response Quality</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {['Clarity', 'Relevance', 'Depth', 'Structure'].map((aspect) => (
                                <div key={aspect} className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span>{aspect}</span>
                                    <span>{Math.round(Math.random() * 100)}%</span>
                                  </div>
                                  <Progress value={Math.random() * 100} className="h-2" />
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Past Sessions */}
          {pastSessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  Past Interview Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {pastSessions.map((session) => (
                      <Card key={session.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{session.type} Interview</h4>
                              <p className="text-sm text-gray-500">
                                {new Date(session.date).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant={session.score >= 70 ? "default" : "secondary"}>
                              Score: {session.score}%
                            </Badge>
                          </div>
                          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Duration</span>
                              <p>{formatTime(session.duration)}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Questions</span>
                              <p>{session.questions}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Confidence</span>
                              <p>{session.confidence}%</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Add hidden video elements for facial analysis */}
      <div className="hidden">
        <video ref={videoRef} autoPlay playsInline muted />
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default Interview;