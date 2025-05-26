import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import axios from "axios";
import config from "../config/index";

// shadcn/ui components
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Brain, Heart, BookOpen, Target, Trophy, TrendingUp, Shield, CheckCircle, Clock, Lock, Play, Eye, ArrowRight, Sparkles } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const { user, loading: userLoading, isAuthenticated } = useUser();
  const [assessmentStatus, setAssessmentStatus] = useState({
    cognitive: { completed: false, data: null },
    stress: { completed: false, data: null },
    content: { completed: false, data: null },
    lesson: { completed: false, data: null }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cognitivePerformance, setCognitivePerformance] = useState("");
  const [stressLevel, setStressLevel] = useState("");
  const [stressProbability, setStressProbability] = useState(null);

  const getDisplayLabel = (dbValue) => {
    const displayMapping = {
      "Low": "Beginner",
      "Average": "Intermediate", 
      "High": "Great",
      "Very High": "Expert"
    };
    return displayMapping[dbValue] || dbValue;
  };

  useEffect(() => {
    const fetchAssessmentData = async () => {
      if (userLoading) return;
      
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        if (!token) {
          navigate("/login");
          return;
        }

        // Fetch fresh profile data from API
        const profileResponse = await axios.get(
          config.api.getUrl('MAIN_API', '/api/auth/profile'),
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const userData = profileResponse.data;
        const email = userData.email;

        // Handle cognitive performance from database only
        const cogValue = userData.cognitivePerformance;
        setCognitivePerformance(cogValue || "");

        // Handle stress data from database only
        const dbStressLevel = userData.stressLevel;
        const dbStressProbability = userData.stressProbability;
        
        setStressLevel(dbStressLevel || "");
        setStressProbability(dbStressProbability || null);

        console.log("Home - Stress data loaded:", {
          dbStressLevel,
          dbStressProbability
        });

        // Check if cognitive assessment is completed
        const cognitiveCompleted = !!cogValue;
        
        // Check stress level completion
        const stressCompleted = !!dbStressLevel;
        
        // Fetch content preferences
        let contentData = null;
        let contentCompleted = false;
        try {
          const contentResponse = await axios.get(
            `${config.api.getUrl('MAIN_API', '/api/content')}?email=${email}`
          );
          contentData = contentResponse.data;
          contentCompleted = true;
        } catch (err) {
          console.log("Content preference not found");
        }
        
        // Fetch lesson preferences
        let lessonData = null;
        let lessonCompleted = false;
        try {
          const lessonResponse = await axios.get(
            `${config.api.getUrl('MAIN_API', '/api/lesson')}?email=${email}`
          );
          lessonData = lessonResponse.data;
          lessonCompleted = lessonData && lessonData.preferences && lessonData.preferences.length > 0;
        } catch (err) {
          console.log("Lesson preference not found");
        }
        
        // Update assessment status with the latest data
        setAssessmentStatus({
          cognitive: { 
            completed: cognitiveCompleted, 
            data: cognitiveCompleted ? { level: cogValue } : null 
          },
          stress: { 
            completed: stressCompleted, 
            data: stressCompleted ? { level: dbStressLevel } : null 
          },
          content: { 
            completed: contentCompleted, 
            data: contentData 
          },
          lesson: { 
            completed: lessonCompleted, 
            data: lessonData 
          }
        });
        
      } catch (error) {
        console.error("Error fetching assessment data:", error);
        setError("Failed to fetch your assessment data. Please try again.");
        
        // Handle authentication errors
        if (error.response && error.response.status === 401) {
          localStorage.removeItem("token");
          setTimeout(() => navigate("/login"), 1000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAssessmentData();
  }, [user, userLoading, isAuthenticated, navigate]);

  // Calculate overall completion percentage
  const calculateCompletionPercentage = () => {
    const assessments = Object.values(assessmentStatus);
    const completed = assessments.filter(a => a.completed).length;
    return (completed / assessments.length) * 100;
  };

  // Determine current step and what's accessible
  const getCurrentStep = () => {
    if (!assessmentStatus.cognitive.completed) return 1;
    if (!assessmentStatus.stress.completed) return 2;
    if (!assessmentStatus.content.completed) return 3;
    if (!assessmentStatus.lesson.completed) return 4;
    return 5; // All completed
  };

  const assessmentSteps = [
    {
      id: 1,
      title: "Cognitive Assessment",
      // description: "Measure your cognitive abilities and identify your learning strengths.",
      image: "https://images.unsplash.com/photo-1565022536102-f7645c84354a?auto=format&fit=crop&q=80&w=500",
      path: "/cognitive",
      status: assessmentStatus.cognitive,
      icon: Brain,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
      borderColor: "border-purple-200"
    },
    {
      id: 2,
      title: "Stress Assessment", 
      // description: "Evaluate your current stress levels with our scientifically validated assessment tool.",
      image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=500",
      path: "/stress",
      status: assessmentStatus.stress,
      icon: Heart,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      borderColor: "border-green-200"
    },
    {
      id: 3,
      title: "Content Preference",
      // description: "Tell us about your learning preferences to get personalized recommendations.",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=500",
      path: "/all",
      status: assessmentStatus.content,
      icon: BookOpen,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      borderColor: "border-blue-200"
    },
    {
      id: 4,
      title: "Lesson Prediction",
      // description: "Get customized lesson recommendations based on your profile.",
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=500",
      path: "/lesson-prediction",
      status: assessmentStatus.lesson,
      icon: Target,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-700",
      borderColor: "border-orange-200"
    }
  ];

  const currentStep = getCurrentStep();
  const completionPercentage = calculateCompletionPercentage();

  if (loading || userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto" />
          <p className="text-slate-600 font-medium text-lg">Loading your journey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="w-full px-8 py-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-6 shadow-lg">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-6xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-6">
            Welcome to Smart Steps
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Your personalized journey to stress management and enhanced learning. 
            Discover your potential with our scientifically-backed assessments.
          </p>
          
          {isAuthenticated && (
            <Card className="max-w-lg mx-auto backdrop-blur-sm bg-white/90 border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xl font-bold">
                        {user?.name?.charAt(0) || "L"}
                      </span>
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-bold text-slate-900">
                        Welcome back, {user?.name || "Learner"}!
                      </h3>
                      <p className="text-slate-500 text-sm">Continue your learning journey</p>
                      {/* Debug info to see current values */}
                      {cognitivePerformance && (
                        <p className="text-xs text-blue-600">Cognitive: {cognitivePerformance}</p>
                      )}
                      {stressLevel && (
                        <p className="text-xs text-green-600">Stress: {stressLevel}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-3xl">👋</div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 font-medium">Overall Progress</span>
                  <Badge variant="secondary" className="font-semibold">
                    {Math.round(completionPercentage)}% complete
                  </Badge>
                </div>
                <Progress value={completionPercentage} className="h-3" />
                
                {currentStep <= 4 && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <p className="text-blue-800 font-medium text-sm">
                        Next: Complete Step {currentStep} to unlock new features
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Assessment Steps */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Your Learning Journey
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Complete each step to unlock personalized content and reach your full potential
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {assessmentSteps.map((step, index) => {
              const isAccessible = isAuthenticated && (step.id <= currentStep);
              const isCompleted = step.status.completed;
              const isCurrent = step.id === currentStep && !isCompleted;
              const StepIcon = step.icon;
              
              return (
                <Card
                  key={step.id}
                  className={`
                    relative overflow-hidden transition-all duration-300 cursor-pointer group
                    flex flex-col h-full
                    ${isAccessible ? 'hover:shadow-2xl hover:-translate-y-3 hover:scale-105' : 'opacity-60 cursor-not-allowed'}
                    ${isCurrent ? 'ring-4 ring-blue-400 ring-opacity-50 shadow-xl' : ''}
                    ${isCompleted ? 'ring-2 ring-green-400' : ''}
                    border-0 shadow-md
                  `}
                  onClick={isAccessible ? () => navigate(step.path) : undefined}
                >
                  {/* Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
                  
                  {/* Step Number Badge */}
                  <div className="absolute top-4 left-4 z-20">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-lg
                      ${isCompleted 
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                        : isCurrent 
                          ? `bg-gradient-to-r ${step.color} text-white`
                          : 'bg-white text-slate-600 border-2 border-slate-200'
                      }
                    `}>
                      {isCompleted ? <CheckCircle className="h-5 w-5" /> : step.id}
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4 z-20">
                    {isCompleted && (
                      <Badge className="bg-green-500 hover:bg-green-600 shadow-sm">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                    {isCurrent && (
                      <Badge variant="outline" className="animate-pulse shadow-sm border-orange-300 text-orange-700">
                        <Clock className="h-3 w-3 mr-1" />
                        Current
                      </Badge>
                    )}
                  </div>
                  
                  <div className="h-48 overflow-hidden flex-shrink-0">
                    <img 
                      src={step.image} 
                      alt={step.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  
                  <CardContent className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center mb-4">
                      <StepIcon className="h-6 w-6 mr-3 text-slate-700" />
                      <h3 className="text-xl font-bold text-slate-900">{step.title}</h3>
                    </div>
                    
                    <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                      {step.description}
                    </p>
                    
                  <div className="min-h-[80px] mb-6"> {/* Fixed minimum height */}
                    {isCompleted && step.status.data && (
                      <div className={`p-4 ${step.bgColor} rounded-lg border ${step.borderColor}`}>
                        {step.id === 1 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Performance Level</span>
                            <Badge variant="secondary" className={step.textColor}>
                              {getDisplayLabel(step.status.data.level)}
                            </Badge>
                          </div>
                        )}
                        {step.id === 2 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Stress Level</span>
                            <Badge variant="secondary" className={step.textColor}>
                              {step.status.data.level}
                            </Badge>
                          </div>
                        )}
                        {step.id === 3 && assessmentStatus.content.data && assessmentStatus.content.data.preferences && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Content Preference</span>
                            <Badge variant="secondary" className={`${step.textColor} max-w-[120px] truncate`}> {/* Add max-width and truncate */}
                              {typeof assessmentStatus.content.data.preferences === 'string' 
                                ? assessmentStatus.content.data.preferences
                                : assessmentStatus.content.data.preferences?.lesson || "No recommendation"
                              }
                            </Badge>
                          </div>
                        )}
                        {step.id === 4 && assessmentStatus.lesson.data && assessmentStatus.lesson.data.preferences && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Top Lesson</span>
                            <Badge variant="secondary" className={`${step.textColor} max-w-[120px] truncate`}> {/* Add max-width and truncate */}
                              {Array.isArray(assessmentStatus.lesson.data.preferences) 
                                ? assessmentStatus.lesson.data.preferences[0]?.lesson || "No preference"
                                : typeof assessmentStatus.lesson.data.preferences === 'string' 
                                  ? assessmentStatus.lesson.data.preferences
                                  : assessmentStatus.lesson.data.preferences?.lesson || "No preference"
                              }
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                    
                    <Button
                      variant={isCompleted ? "outline" : "default"}
                      className="w-full group mt-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isAuthenticated) {
                          navigate("/login");
                        } else if (isAccessible) {
                          navigate(step.path);
                        }
                      }}
                      disabled={!isAccessible && isAuthenticated}
                    >
                      {!isAuthenticated ? (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Login to Access
                        </>
                      ) : isCompleted ? (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          View or Redo
                        </>
                      ) : isAccessible ? (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Start Assessment
                          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Complete Previous Steps
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>        

        {/* Benefits Section */}
        <Card className="p-12 bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-12">
            Why Take Our Assessments?
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Target className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Personalized Learning
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Receive educational content tailored to your unique cognitive style, 
                learning preferences, and stress level for maximum effectiveness.
              </p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Stress Management
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Learn evidence-based techniques to manage stress effectively while 
                optimizing your learning capabilities and mental well-being.
              </p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Trophy className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Track Your Progress
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Monitor your improvement over time with comprehensive analytics 
                and insights into your learning journey and stress management.
              </p>
            </div>
          </div>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert className="mt-8 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800 flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              {error}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default Home;