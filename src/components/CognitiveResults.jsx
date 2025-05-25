import React, { useState, useEffect } from "react";
import {
  Typography,
  Container,
  Box,
  Button,
  Paper,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import config from '../config';
import axios from "axios";
import { useUser } from "../contexts/UserContext";

const CognitiveResults = () => {
  const { user, getUserId } = useUser();
  const navigate = useNavigate();
  const [mathScore, setMathScore] = useState(0);
  const [memoryScore, setMemoryScore] = useState(0);
  const [speedScore, setSpeedScore] = useState(0);
  const [userId, setUserId] = useState("");
  const [cognitiveLevel, setCognitiveLevel] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  
  // Maximum possible score for normalization
  const maxScoreValue = config.cognitive.maxScoreValue;

  const ensureScoreInAssessmentResult = () => {
  try {
    // Get math score from RainDrops game
    const rainDropsScore = localStorage.getItem('Rain_drops_score');
    
    // Get the assessment result
    const assessmentResultString = localStorage.getItem('assessmentResult');
    
    if (assessmentResultString && rainDropsScore) {
      // Parse the assessment result
      const assessmentResult = JSON.parse(assessmentResultString);
      
      // Check if p_M is missing or 0
      if (!assessmentResult.p_M || assessmentResult.p_M === '0') {
        // Add the math score to the assessment result
        assessmentResult.p_M = rainDropsScore;
        
        // Save the updated assessment result
        localStorage.setItem('assessmentResult', JSON.stringify(assessmentResult));
        console.log('Added math score to assessmentResult:', rainDropsScore);
      }
    }
  } catch (error) {
    console.error('Error ensuring score in assessment result:', error);
  }
};
  
  useEffect(() => {
    setUserId(getUserId());
    ensureScoreInAssessmentResult();
    // Get assessment result from localStorage
    const resultData = localStorage.getItem('assessmentResult');
    
    if (resultData) {
      try {
        const parsedData = JSON.parse(resultData);
        
        // Update state with backend data
        setCognitiveLevel(parsedData.cognitive_performance || "");
        setMathScore(parseInt(parsedData.p_M) || 0);
        setMemoryScore(parseInt(parsedData.person_memory) || 0);
        setSpeedScore(parseInt(parsedData.person_speed) || 0);
        
        // Update recommendations from backend - ensure it's an array
        if (parsedData.prediction) {
          // Handle if prediction is an array
          if (Array.isArray(parsedData.prediction)) {
            setRecommendations(parsedData.prediction);
          } 
          // Handle if prediction is a string - convert to array
          else if (typeof parsedData.prediction === 'string') {
            setRecommendations([parsedData.prediction]);
          }
          // If it's something else unexpected, set empty array
          else {
            setRecommendations([]);
          }
        }
      } catch (error) {
        console.error('Error parsing assessment result:', error);
        // Ensure we set a default empty array if parsing fails
        setRecommendations([]);
      }
    } else {
      // No result data found, ensure recommendations is an empty array
      setRecommendations([]);
    }    
    
  }, [getUserId]);  

  useEffect(() => {
    const clearGameData = () => {
      console.log("Clearing game data from localStorage after results have been displayed");
      setTimeout(() => {
        localStorage.removeItem("speed_match_score");
        localStorage.removeItem("speed_match_cards");
        localStorage.removeItem("memory_matrix_score");
        localStorage.removeItem("memory_matrix_time");
        localStorage.removeItem("Rain_drops_score");
        localStorage.removeItem("Rain_Drops_Time");
        console.log("Game data cleared from localStorage");
      }, 2000);
    };
    
    clearGameData();
    
  }, []);
  
  // Get color for progress bar based on score
  const getProgressColor = (score) => {
    const percentage = (score / maxScoreValue) * 100;
    if (percentage < 30) return "#f44336"; // Red
    if (percentage < 60) return "#ff9800"; // Orange
    return "#4caf50"; // Green
  };  
  
  const handleReturnToAssessment = () => {
    navigate("/cognitive");
  };
  
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 5, textAlign: "center" }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Assessment Results
        </Typography>
      </Box>
      
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2, mb: 5 }}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            ID: {userId}
          </Typography>
          <Typography variant="body1">
            Your assessment results have been processed. Based on your performance, we've created personalized recommendations.
          </Typography>
          {cognitiveLevel && (
            <Typography variant="h6" color="primary" sx={{ mt: 2 }} style={{ textTransform: 'capitalize' }}>
              Cognitive Level: <strong>{cognitiveLevel}</strong>
            </Typography>
          )}
        </Box>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          Your Performance
        </Typography>
        
        {/* Mathematics Progress Bar */}
        <Box sx={{ my: 3 }}>
          <Typography variant="h6" gutterBottom>
            Mathematics: {mathScore}
          </Typography>
          <Box sx={{ width: '100%', mr: 1 }}>
            <LinearProgress 
              variant="determinate" 
              value={(mathScore / maxScoreValue) * 100} 
              sx={{ 
                height: 20, 
                borderRadius: 5,
                backgroundColor: "#e0e0e0",
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getProgressColor(mathScore)
                }
              }} 
            />
          </Box>
        </Box>
        
        {/* Memory Progress Bar */}
        <Box sx={{ my: 3 }}>
          <Typography variant="h6" gutterBottom>
            Memory: {memoryScore}
          </Typography>
          <Box sx={{ width: '100%', mr: 1 }}>
            <LinearProgress 
              variant="determinate" 
              value={(memoryScore / maxScoreValue) * 100} 
              sx={{ 
                height: 20, 
                borderRadius: 5,
                backgroundColor: "#e0e0e0",
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getProgressColor(memoryScore)
                }
              }} 
            />
          </Box>
        </Box>
        
        {/* Speed Progress Bar */}
        <Box sx={{ my: 3 }}>
          <Typography variant="h6" gutterBottom>
            Processing Speed: {speedScore}
          </Typography>
          <Box sx={{ width: '100%', mr: 1 }}>
            <LinearProgress 
              variant="determinate" 
              value={(speedScore / maxScoreValue) * 100} 
              sx={{ 
                height: 20, 
                borderRadius: 5,
                backgroundColor: "#e0e0e0",
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getProgressColor(speedScore)
                }
              }} 
            />
          </Box>
        </Box>
        
        <Divider sx={{ my: 4 }} />
        
        <Typography variant="h5" gutterBottom>
          Recommendations
        </Typography>
        
        {recommendations.length > 0 ? (
          <List>
            {recommendations.map((recommendation, index) => (
              <ListItem key={index}>
                <ListItemText primary={recommendation} />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body1" color="text.secondary">
            No specific recommendations available. Try taking the assessment again.
          </Typography>
        )}
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Button 
            variant="outlined" 
            color="primary" 
            size="large"
            onClick={handleReturnToAssessment}
          >
            Return to Assessment
          </Button>          
        </Box>
      </Paper>
      
      <Card sx={{ mb: 5 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            What These Results Mean:
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Mathematics Score:</strong> Measures your ability to process numerical information and solve math problems quickly. This is relevant for courses involving calculations, statistics, or logical reasoning.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Memory Score:</strong> Reflects your ability to remember and recall visual patterns. This skill is important for courses that require memorization of facts, concepts, or procedures.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Processing Speed:</strong> Indicates how quickly you can process information and make decisions. This is valuable for fast-paced courses or those requiring real-time problem solving.
          </Typography>
          <Typography variant="body2">
            Based on these scores, we've curated a personalized set of courses that match your cognitive strengths and learning style. Continue to see your recommended educational content.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default CognitiveResults;