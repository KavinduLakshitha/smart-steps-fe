import React, { useState, useEffect } from "react";
import {
  Typography,
  Container,
  Box,
  Button,
  Paper,
  Grid as MuiGrid,
  TextField,
  MenuItem,
  Divider,
  LinearProgress,
  CircularProgress
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { submitCognitiveData } from '../services/api';

const CognitiveAssessment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    age: "",
    sleep_hours: "",
    gender: "1", // Default to Female
    gameEx: "0", // Default to No
    speedMatchCards: "",
    speedMatchPoints: "",
    memoryMatrixPoints: "",
    timeMemoryMatrix: "",
    rainDropsScore: "",
    timeRainDrops: ""
  });

  // Fetch user data from backend
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          // If no token, redirect to login
          navigate('/login');
          return;
        }
        
        // Make API call to get user profile data
        const profileResponse = await axios.get(
          "https://research-project-theta.vercel.app/api/auth/profile",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        // Set user data
        setUser(profileResponse.data);
        
        // Pre-fill form with user data if available
        if (profileResponse.data) {
          setFormData(prevData => ({
            ...prevData,
            age: profileResponse.data.age || "",
            gender: profileResponse.data.Gender === "M" ? "0" : "1",
            sleep_hours: profileResponse.data.sleep_hours || ""
          }));
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
        
        // Handle unauthorized errorsupdatedProblems.forEach(problem
        if (error.response && error.response.status === 401) {
          localStorage.removeItem("token");
          navigate('/login');
        }
      }
    };
    
    fetchUserData();
  }, [navigate]);

  // Load saved game data from localStorage if available
  useEffect(() => {
    const speedMatchScore = localStorage.getItem("speed_match_score");
    const speedMatchCards = localStorage.getItem("speed_match_cards");
    const memoryMatrixScore = localStorage.getItem("memory_matrix_score");
    const memoryMatrixTime = localStorage.getItem("memory_matrix_time");
    const rainDropsScore = localStorage.getItem("Rain_drops_score");
    const rainDropsTime = localStorage.getItem("Rain_Drops_Time");

    setFormData(prevData => {
      const updatedFormData = { ...prevData };
      
      if (speedMatchScore && speedMatchCards) {
        updatedFormData.speedMatchPoints = speedMatchScore;
        updatedFormData.speedMatchCards = speedMatchCards;
      }
      
      if (memoryMatrixScore && memoryMatrixTime) {
        updatedFormData.memoryMatrixPoints = memoryMatrixScore;
        updatedFormData.timeMemoryMatrix = memoryMatrixTime;
      }
      
      if (rainDropsScore && rainDropsTime) {
        updatedFormData.rainDropsScore = rainDropsScore;
        updatedFormData.timeRainDrops = rainDropsTime;
      }
      
      return updatedFormData;
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Check if all games have been played
  if (!formData.speedMatchPoints || !formData.memoryMatrixPoints || !formData.rainDropsScore) {
    alert("Please complete all three cognitive games before submitting your assessment.");
    return;
  }
  
  try {
    setLoading(true);
    
    // Create consistent data object
    const backendData = {
      age: formData.age,
      sleep_hours: formData.sleep_hours,
      gender: formData.gender,
      gameEx: formData.gameEx, // This should match your form field name
      speed_match_cards: formData.speedMatchCards,
      speed_match_points: formData.speedMatchPoints,
      memory_matrix_points: formData.memoryMatrixPoints,
      time_memory_matrix: formData.timeMemoryMatrix,
      rain_drops_score: formData.rainDropsScore,
      time_rain_drops: formData.timeRainDrops
    };
    
    // Add user identifier if available
    if (user && user.id) {
      backendData.user_id = user.id;
    } else if (user && user.email) {
      backendData.user_email = user.email;
    }
    
    console.log('Form data being submitted:', backendData);
    
    // Submit data to backend
    const result = await submitCognitiveData(backendData);
    
    // IMPORTANT FIX: Make sure math score is included in the assessmentResult
    if (result && !result.p_M && formData.rainDropsScore) {
      result.p_M = formData.rainDropsScore;
    }
    
    // Store result in localStorage for the results page
    localStorage.setItem('assessmentResult', JSON.stringify(result));
    
    // Update cognitive performance in user profile if possible
    if (result && result.cognitive_performance && user && user.email) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(
          "https://research-project-theta.vercel.app/api/auth/updateProfile",
          { cognitivePerformance: result.cognitive_performance },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (error) {
        console.error('Error updating cognitive performance in profile:', error);
      }
    }
    
    setLoading(false);    
    navigate("/results");    
    
  } catch (error) {
    console.error('Error submitting assessment:', error);
    setLoading(false);
    
    // Show more specific error message
    let errorMessage = 'There was an error submitting your assessment. Please try again.';
    if (error.message.includes('Server error')) {
      errorMessage = 'Server error occurred. Please check your data and try again.';
    } else if (error.message.includes('No response')) {
      errorMessage = 'Cannot connect to server. Please check your internet connection.';
    }
    
    alert(errorMessage);
  }
};

  const checkAndRefreshToken = async () => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      navigate("/login");
      return null;
    }
    
    try {
      // Try to use the profile endpoint to verify the token
      await axios.get(
        "https://research-project-theta.vercel.app/api/auth/profile",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      return token; // Token is valid if we get here
    } catch (error) {
      // Clear token and redirect to login
      localStorage.removeItem("token");
      navigate("/login");
      return null;
    }
  };

  if (loading && !user) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Loading user data...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 5, textAlign: "center" }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Cognitive Assessment
        </Typography>
        {user && (
          <Typography variant="subtitle1" gutterBottom>
            Logged in as: <strong>{user.email || user.username}</strong>
          </Typography>
        )}
      </Box>
      
      {/* Game Completion Progress */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Assessment Progress
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <Box sx={{ textAlign: 'center', width: '30%' }}>
            <Typography variant="body2">
              Speed Match
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={formData.speedMatchPoints ? 100 : 0} 
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>
          <Box sx={{ textAlign: 'center', width: '30%' }}>
            <Typography variant="body2">
              Memory Matrix
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={formData.memoryMatrixPoints ? 100 : 0} 
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>
          <Box sx={{ textAlign: 'center', width: '30%' }}>
            <Typography variant="body2">
              Rain Drops
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={formData.rainDropsScore ? 100 : 0} 
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>
        </Box>
      </Box>
      
      {/* Instructions */}
      <Box sx={{ mb: 4, p: 3, bgcolor: '#f5f5f5', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          How to Complete Your Assessment
        </Typography>
        <Typography variant="body1" component="div">
          <ol>
            <li>Fill in your personal information (age, sleep hours, etc.)</li>
            <li>Play each of the three cognitive games by clicking the "Play" buttons</li>
            <li>Your game scores will automatically be loaded into the form</li>
            <li>Click "Submit Assessment" to view personalized recommendations</li>
          </ol>
        </Typography>
      </Box>
      
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2, mb: 5 }}>
        <form onSubmit={handleSubmit}>
          <MuiGrid container spacing={3}>
            {/* Personal Information */}
            <MuiGrid item xs={12}>
              <Typography variant="h5" gutterBottom>
                Personal Information
              </Typography>
            </MuiGrid>
            
            <MuiGrid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Age"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleChange}
                required
                inputProps={{ min: 1 }}
              />
            </MuiGrid>
            
            <MuiGrid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Sleep Hours"
                name="sleep_hours"
                type="number"
                value={formData.sleep_hours}
                onChange={handleChange}
                required
                inputProps={{ min: 0, max: 24 }}
              />
            </MuiGrid>
            
            <MuiGrid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <MenuItem value="1">Female</MenuItem>
                <MenuItem value="0">Male</MenuItem>
              </TextField>
            </MuiGrid>
            
            <MuiGrid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Previous Gaming Experience"
                name="gameEx"
                value={formData.gameEx}
                onChange={handleChange}
                required
              >
                <MenuItem value="1">Yes</MenuItem>
                <MenuItem value="0">No</MenuItem>
              </TextField>
            </MuiGrid>
            
            <MuiGrid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </MuiGrid>
            
            {/* Game section with cards */}
            <MuiGrid item xs={12}>
              <Typography variant="h5" gutterBottom>
                Cognitive Games
              </Typography>
            </MuiGrid>
            
            {/* Speed Match Game */}
            <MuiGrid item xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <Typography variant="h6" gutterBottom>
                    Speed Match
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Test your processing speed by matching shapes quickly.
                  </Typography>
                </div>
                
                <Box>
                  <TextField
                    fullWidth
                    label="Cards"
                    name="speedMatchCards"
                    type="number"
                    value={formData.speedMatchCards}
                    onChange={handleChange}
                    required
                    inputProps={{ min: 0 }}
                    size="small"
                    margin="normal"
                    disabled={true}                    
                  />
                  <TextField
                    fullWidth
                    label="Points"
                    name="speedMatchPoints"
                    type="number"
                    value={formData.speedMatchPoints}
                    onChange={handleChange}
                    required
                    inputProps={{ min: 0 }}
                    size="small"
                    margin="normal"
                    disabled={true}
                  />
                  <Button 
                    variant={formData.speedMatchPoints ? "outlined" : "contained"}
                    color="primary"
                    onClick={() => navigate("/speed-match")}
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    {formData.speedMatchPoints ? "Play Again" : "Play Game"}
                  </Button>
                </Box>
              </Paper>
            </MuiGrid>
            
            {/* Memory Matrix Game */}
            <MuiGrid item xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <Typography variant="h6" gutterBottom>
                    Memory Matrix
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Test your visual memory by recalling patterns of tiles.
                  </Typography>
                </div>
                
                <Box>
                  <TextField
                    fullWidth
                    label="Points"
                    name="memoryMatrixPoints"
                    type="number"
                    value={formData.memoryMatrixPoints}
                    onChange={handleChange}
                    required
                    inputProps={{ min: 0 }}
                    size="small"
                    margin="normal"
                    disabled={true}
                  />
                  <TextField
                    fullWidth
                    label="Time (minutes)"
                    name="timeMemoryMatrix"
                    type="number"
                    step="0.01"
                    value={formData.timeMemoryMatrix}
                    onChange={handleChange}
                    required
                    inputProps={{ min: 0, step: 0.01 }}
                    size="small"
                    margin="normal"
                    disabled={true}
                  />
                  <Button 
                    variant={formData.memoryMatrixPoints ? "outlined" : "contained"}
                    color="primary"
                    onClick={() => navigate("/memory-matrix")}
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    {formData.memoryMatrixPoints ? "Play Again" : "Play Game"}
                  </Button>
                </Box>
              </Paper>
            </MuiGrid>
            
            {/* Rain Drops Game */}
            <MuiGrid item xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <Typography variant="h6" gutterBottom>
                    Rain Drops
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Test your math skills by solving equations in falling raindrops.
                  </Typography>
                </div>
                
                <Box>
                  <TextField
                    fullWidth
                    label="Score"
                    name="rainDropsScore"
                    type="number"
                    value={formData.rainDropsScore}
                    onChange={handleChange}
                    required
                    inputProps={{ min: 0 }}
                    size="small"
                    margin="normal"
                    disabled={true} 
                  />
                  <TextField
                    fullWidth
                    label="Time (minutes)"
                    name="timeRainDrops"
                    type="number"
                    step="0.01"
                    value={formData.timeRainDrops}
                    onChange={handleChange}
                    required
                    inputProps={{ min: 0, step: 0.01 }}
                    size="small"
                    margin="normal"
                    disabled={true} 
                  />
                  <Button 
                    variant={formData.rainDropsScore ? "outlined" : "contained"}
                    color="primary"
                    onClick={() => navigate("/rain-drops")}
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    {formData.rainDropsScore ? "Play Again" : "Play Game"}
                  </Button>
                </Box>
              </Paper>
            </MuiGrid>
            
            <MuiGrid item xs={12} sx={{ mt: 5 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={loading || !formData.speedMatchPoints || !formData.memoryMatrixPoints || !formData.rainDropsScore}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Submit Assessment"}
              </Button>
            </MuiGrid>
          </MuiGrid>
        </form>
      </Paper>
    </Container>
  );
};

export default CognitiveAssessment;