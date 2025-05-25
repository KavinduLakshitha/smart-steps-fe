import React, { useState, useEffect } from "react";
import {
  Typography,
  Container,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Chip,
  LinearProgress
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUser } from "../contexts/UserContext";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SchoolIcon from "@mui/icons-material/School";
import MoodIcon from "@mui/icons-material/Mood";
import PsychologyIcon from "@mui/icons-material/Psychology";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: userLoading, isAuthenticated } = useUser();
  const [assessmentStatus, setAssessmentStatus] = useState({
    cognitive: { completed: false, data: null },
    stress: { completed: false, data: null },
    lesson: { completed: false, data: null },
    content: { completed: false, data: null }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  // Fetch all user assessment data
  useEffect(() => {
    const fetchAssessmentData = async () => {
      // Skip if user context is still loading or user is not authenticated
      if (userLoading) return;
      
      if (!isAuthenticated) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        const email = user.email;
        
        // Check if cognitive assessment is completed
        const cognitiveCompleted = user.cognitivePerformance ? true : false;
        
        // Check stress level from local storage (from stress detection)
        const stressLevel = localStorage.getItem("stressLevel");
        const stressCompleted = stressLevel ? true : false;
        
        // Fetch content preferences
        let contentData = null;
        let contentCompleted = false;
        try {
          const contentResponse = await axios.get(
            `https://research-project-theta.vercel.app/api/content?email=${email}`
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
            `https://research-project-theta.vercel.app/api/lesson?email=${email}`
          );
          lessonData = lessonResponse.data;
          lessonCompleted = lessonData && lessonData.preferences && lessonData.preferences.length > 0;
        } catch (err) {
          console.log("Lesson preference not found");
        }
        
        // Update assessment status
        setAssessmentStatus({
          cognitive: { 
            completed: cognitiveCompleted, 
            data: cognitiveCompleted ? { level: user.cognitivePerformance } : null 
          },
          stress: { 
            completed: stressCompleted, 
            data: stressCompleted ? { level: stressLevel } : null 
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
        
        // Get course recommendations based on completed assessments
        if (contentCompleted) {
          try {
            const coursesResponse = await axios.get(
              `https://research-project-theta.vercel.app/api/course/filter/${encodeURIComponent(contentData.preferences)}`
            );
            setRecommendations(coursesResponse.data || []);
          } catch (error) {
            console.error("Error fetching recommended courses:", error);
          }
        }
        
      } catch (error) {
        console.error("Error fetching assessment data:", error);
        setError("Failed to fetch your assessment data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAssessmentData();
  }, [navigate, user, userLoading, isAuthenticated]);

  // Helper function to render assessment status
  const renderAssessmentStatus = (type, title, icon, route) => {
    const status = assessmentStatus[type];
    return (
      <Card 
        elevation={3} 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          borderLeft: `4px solid ${status.completed ? '#4caf50' : '#ff9800'}` 
        }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {icon}
            <Typography variant="h6" sx={{ ml: 1 }}>
              {title}
            </Typography>
          </Box>
          
          {status.completed ? (
            <Box>
              <Chip 
                icon={<CheckCircleIcon />} 
                label="Completed" 
                color="success" 
                size="small" 
                sx={{ mb: 2 }} 
              />
              
              {type === 'cognitive' && status.data && (
                <Typography variant="body2">
                  Your cognitive performance: <strong>{status.data.level}</strong>
                </Typography>
              )}
              
              {type === 'stress' && status.data && (
                <Typography variant="body2">
                  Your stress level: <strong>{status.data.level}</strong>
                </Typography>
              )}
              
              {type === 'content' && status.data && (
                <Typography variant="body2">
                  Recommended content: <strong>{status.data.preferences}</strong>
                </Typography>
              )}
              
              {type === 'lesson' && status.data && status.data.preferences && (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Top recommended lesson:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {status.data.preferences[0]?.lesson || "No recommendation"}
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Box>
              <Chip 
                icon={<ErrorOutlineIcon />} 
                label="Not Completed" 
                color="warning" 
                size="small" 
                sx={{ mb: 2 }} 
              />
              <Typography variant="body2">
                You haven't completed this assessment yet. Complete it to get personalized recommendations.
              </Typography>
            </Box>
          )}
        </CardContent>
        
        <CardActions sx={{ p: 2, pt: 0 }}>
          <Button 
            variant={status.completed ? "outlined" : "contained"}
            color={status.completed ? "primary" : "warning"}
            fullWidth
            onClick={() => navigate(route)}
          >
            {status.completed ? "View or Redo" : "Complete Now"}
          </Button>
        </CardActions>
      </Card>
    );
  };

  // Calculate overall completion percentage
  const calculateCompletionPercentage = () => {
    const assessments = Object.values(assessmentStatus);
    const completed = assessments.filter(a => a.completed).length;
    return (completed / assessments.length) * 100;
  };

  // Determine next recommended assessment
  const getNextRecommendedAssessment = () => {
    if (!assessmentStatus.cognitive.completed) {
      return {
        type: "cognitive",
        title: "Cognitive Assessment",
        route: "/cognitive"
      };
    } else if (!assessmentStatus.stress.completed) {
      return {
        type: "stress",
        title: "Stress Assessment",
        route: "/stress"
      };
    } else if (!assessmentStatus.content.completed) {
      return {
        type: "content",
        title: "Content Preference",
        route: "/content-prediction"
      };
    } else if (!assessmentStatus.lesson.completed) {
      return {
        type: "lesson",
        title: "Lesson Prediction",
        route: "/lesson-prediction"
      };
    }
    return null;
  };

  if (loading || userLoading) {
    return (
      <Container sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading your dashboard...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ textAlign: "center", mt: 5 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const completionPercentage = calculateCompletionPercentage();
  const nextAssessment = getNextRecommendedAssessment();

  return (
    <Container maxWidth="lg" sx={{ mt: 5, mb: 8 }}>
      <Typography variant="h4" gutterBottom>
        Your Learning Dashboard
      </Typography>
      
      {/* Welcome and Progress Section */}
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          Welcome, {user?.name || "Learner"}!
        </Typography>
        
        <Box sx={{ mt: 3, mb: 1 }}>
          <Typography variant="body1" gutterBottom>
            Assessment Progress
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={completionPercentage} 
            sx={{ height: 10, borderRadius: 5 }} 
          />
          <Typography variant="body2" sx={{ mt: 1 }}>
            {Math.round(completionPercentage)}% complete
          </Typography>
        </Box>
        
        {nextAssessment ? (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body1">
              Next Recommended Step:
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              sx={{ mt: 1 }}
              onClick={() => navigate(nextAssessment.route)}
            >
              Complete {nextAssessment.title}
            </Button>
          </Box>
        ) : (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body1" color="success.main">
              Great job! You've completed all assessments. View your recommended courses below.
            </Typography>
          </Box>
        )}
      </Paper>
      
      {/* Assessments Status Grid */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Your Assessments
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          {renderAssessmentStatus(
            'cognitive', 
            'Cognitive Assessment', 
            <PsychologyIcon color="primary" />, 
            '/cognitive'
          )}
        </Grid>
        
        <Grid item xs={12} sm={6}>
          {renderAssessmentStatus(
            'stress', 
            'Stress Assessment', 
            <MoodIcon color="primary" />, 
            '/stress'
          )}
        </Grid>
        
        <Grid item xs={12} sm={6}>
          {renderAssessmentStatus(
            'content', 
            'Content Preference', 
            <SchoolIcon color="primary" />, 
            '/content-prediction'
          )}
        </Grid>
        
        <Grid item xs={12} sm={6}>
          {renderAssessmentStatus(
            'lesson', 
            'Lesson Prediction', 
            <TrendingUpIcon color="primary" />, 
            '/lesson-prediction'
          )}
        </Grid>
      </Grid>
      
      {/* Course Recommendations Section */}
      <Typography variant="h5" gutterBottom sx={{ mt: 5, mb: 2 }}>
        Recommended Courses
      </Typography>
      
      {recommendations.length > 0 ? (
        <Grid container spacing={3}>
          {recommendations.slice(0, 3).map((course) => (
            <Grid item key={course._id} xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 3
                  }
                }}
                onClick={() => navigate(`/lesson/${course._id}`)}
              >
                <Box sx={{ position: 'relative' }}>
                  <img 
                    src={course.image} 
                    alt={course.lessonName} 
                    style={{ width: '100%', height: '140px', objectFit: 'cover' }}
                  />
                  <Chip
                    label={course.learningMaterial}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      textTransform: 'capitalize',
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      color: 'white'
                    }}
                  />
                </Box>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="div" gutterBottom>
                    {course.lessonName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {course.description?.substring(0, 100)}
                    {course.description?.length > 100 ? '...' : ''}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small">View Course</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', p: 4 }}>
          {assessmentStatus.content.completed ? (
            <Typography>
              No courses found matching your preferences. Try updating your preferences.
            </Typography>
          ) : (
            <Typography>
              Complete the Content Preference assessment to get personalized course recommendations.
            </Typography>
          )}
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mt: 2 }}
            onClick={() => navigate("/all")}
          >
            Browse All Courses
          </Button>
        </Box>
      )}
      
      {recommendations.length > 3 && (
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button 
            variant="outlined" 
            onClick={() => navigate("/filtered")}
          >
            View All Recommendations
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default Dashboard;