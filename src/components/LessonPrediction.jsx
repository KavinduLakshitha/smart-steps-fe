
import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Container,
  Typography,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import config from '../config/index.js';

const LessonPrediction = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    stress_level: "",
    cognitive_performance: "",
    // Fields for marks
    "number sequences marks": 0,
    "perimeter marks": 0,
    "ratio marks": 0,
    "fractions/decimals marks": 0,
    "indices marks": 0,
    "algebra marks": 0,
    "angles marks": 0,
    "volume and capacity marks": 0,
    "area marks": 0,
    "probability marks": 0,
    // Fields for times
    "number sequences time(s)": 0,
    "perimeter time(s)": 0,
    "ratio time(s)": 0,
    "fractions/decimals time(s)": 0,
    "indices time(s)": 0,
    "algebra time(s)": 0,
    "angles time(s)": 0,
    "volume and capacity time(s)": 0,
    "area time(s)": 0,
    "probability time(s)": 0,
    // User profile data
    "Male/Female": "",
    "Preferred Study Method": "",
    "Disliked lesson": ""
  });

  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Define categorical options
  const stressLevelOptions = ["Low", "Medium", "High"];
  const cognitivePerformanceOptions = ["Low", "Average", "High", "Very High"];

  useEffect(() => {
    const fetchUserData = async () => {
      setUserLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        // Fetch user profile data
        const profileResponse = await axios.get(
          "https://research-project-theta.vercel.app/api/auth/profile",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        setUser(profileResponse.data);
        
        // Map user profile data to form data
        const userData = profileResponse.data;
        
        // Get stress level from localStorage
        const stressLevel = localStorage.getItem("stressLevel") || "Medium";
        
        // Get cognitive performance
        const cogValue = userData.cognitivePerformance || localStorage.getItem("cognitivePerformance") || "Average";
        
        // Create an updated form data object
        const updatedFormData = { ...formData };
        
        // Set basic form values
        updatedFormData.stress_level = stressLevel;
        updatedFormData.cognitive_performance = cogValue;
        updatedFormData["Male/Female"] = userData.Gender || "";
        updatedFormData["Preferred Study Method"] = userData.preferredStudyMethod || "";
        updatedFormData["Disliked lesson"] = userData.dislikedLesson || "";
        
        // Map marks
        const marksFields = [
          { userField: "numberSequencesMarks", formField: "number sequences marks" },
          { userField: "perimeterMarks", formField: "perimeter marks" },
          { userField: "ratioMarks", formField: "ratio marks" },
          { userField: "fractionsDecimalsMarks", formField: "fractions/decimals marks" },
          { userField: "indicesMarks", formField: "indices marks" },
          { userField: "algebraMarks", formField: "algebra marks" },
          { userField: "anglesMarks", formField: "angles marks" },
          { userField: "volumeCapacityMarks", formField: "volume and capacity marks" },
          { userField: "areaMarks", formField: "area marks" },
          { userField: "probabilityMarks", formField: "probability marks" },
        ];

        // Extract the last value from each marks array in user profile
        marksFields.forEach(({ userField, formField }) => {
          const marksArray = userData[userField] || [];
          const lastMark = marksArray.length > 0 ? marksArray[marksArray.length - 1] : 0;
          updatedFormData[formField] = lastMark;
        });
        
        // Map time fields
        const timeFieldMapping = {
          "numberSequencesTime": "number sequences time(s)",
          "perimeterTime": "perimeter time(s)",
          "ratioTime": "ratio time(s)",
          "fractionsDecimalsTime": "fractions/decimals time(s)",
          "indicesTime": "indices time(s)",
          "algebraTime": "algebra time(s)",
          "anglesTime": "angles time(s)",
          "volumeCapacityTime": "volume and capacity time(s)",
          "areaTime": "area time(s)",
          "probabilityTime": "probability time(s)",
        };
        
        // Set time values from user profile
        Object.entries(timeFieldMapping).forEach(([userField, formField]) => {
          updatedFormData[formField] = parseInt(userData[userField]) || 0;
        });
        
        setFormData(updatedFormData);
      } catch (err) {
        console.error("Error fetching user data", err);
        if (err.response && err.response.status === 401) {
          setError("Your session has expired. Please log in again.");
          localStorage.removeItem("token");
          setTimeout(() => navigate("/login"), 1000);
        } else {
          setError("Failed to fetch data: " + (err.response?.data?.message || err.message));
        }
      } finally {
        setUserLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  // Handle form submission - now just a function to trigger predictions
  const handleSubmit = async () => {
    setError(null);
    setPrediction(null);
    setLoading(true);

    try {
      // Validate and convert form data
      const processedData = { ...formData };
      
      // Convert numerical fields to numbers
      const numericalFields = [
        "number sequences marks",
        "perimeter marks",
        "ratio marks",
        "fractions/decimals marks",
        "indices marks",
        "algebra marks",
        "angles marks",
        "volume and capacity marks",
        "area marks",
        "probability marks",
        "number sequences time(s)",
        "perimeter time(s)",
        "ratio time(s)",
        "fractions/decimals time(s)",
        "indices time(s)",
        "algebra time(s)",
        "angles time(s)",
        "volume and capacity time(s)",
        "area time(s)",
        "probability time(s)",
      ];

      for (const field of numericalFields) {
        if (processedData[field] === "" || isNaN(processedData[field])) {
          processedData[field] = 0; // Default to 0 if empty or invalid
        } else {
          processedData[field] = parseFloat(processedData[field]);
        }
      }

      // We're using both APIs for predictions
      // 1. First, use the content preference API (stress + cognitive based)
      const contentPredictUrl = "http://127.0.0.1:5003/predict";
      const contentResponse = await axios.post(contentPredictUrl, {
        stress_level: processedData.stress_level,
        cognitive_performance: processedData.cognitive_performance,
        "number sequences marks": processedData["number sequences marks"],
        "perimeter marks": processedData["perimeter marks"],
        "ratio marks": processedData["ratio marks"],
        "fractions/decimals marks": processedData["fractions/decimals marks"],
        "indices marks": processedData["indices marks"],
        "algebra marks": processedData["algebra marks"],
        "angles marks": processedData["angles marks"],
        "volume and capacity marks": processedData["volume and capacity marks"],
        "area marks": processedData["area marks"],
        "probability marks": processedData["probability marks"],
      });
      
      // 2. Then, use the lesson prediction API (all data)
      const lessonPredictUrl = "http://127.0.0.1:5001/predict";
      const lessonResponse = await axios.post(lessonPredictUrl, processedData);
      
      // Set the content-based prediction
      const predictedLesson = contentResponse.data.predicted_lesson;
      setPrediction({
        contentBased: predictedLesson,
        topLessons: lessonResponse.data["Top 5 Predicted Lessons"] || []
      });

      // Save predictions if user is available
      if (user && user.email) {
        // Save content preference
        await axios.post("https://research-project-theta.vercel.app/api/content/save", {
          email: user.email,
          preferences: predictedLesson,
          stressLevel: formData.stress_level,
          cognitive: formData.cognitive_performance,
        });
        
        // Save lesson preferences
        if (lessonResponse.data["Top 5 Predicted Lessons"]) {
          await axios.post("https://research-project-theta.vercel.app/api/lesson/save", {
            email: user.email,
            preferences: lessonResponse.data["Top 5 Predicted Lessons"],
          });
        }
        
        // Set a flag in localStorage to trigger profile refresh when returning
        localStorage.setItem("lastPrediction", "true");
      }
    } catch (error) {
      setError("Error making prediction or saving data. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  console.log("🔍 Current prediction state:", prediction);
  console.log("🔍 prediction.topLessons:", prediction?.topLessons);
  console.log("🔍 topLessons length:", prediction?.topLessons?.length);
  if (prediction?.topLessons) {
    prediction.topLessons.forEach((lesson, index) => {
      console.log(`🔍 Lesson ${index}:`, lesson);
    });
  }

  if (userLoading) {
    return (
      <Container sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading user data...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 5, mb: 5 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Lesson Prediction
        </Typography>
        
        <Typography variant="subtitle1" align="center" sx={{ mb: 4 }}>
          Get personalized lesson recommendations based on your profile data
        </Typography>
        
        {/* User Information */}
        {user && (
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="body2">
              Logged in as: <strong>{user.email}</strong>
            </Typography>
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* Profile Data Display */}
        <Grid container spacing={4}>
          {/* Personal Information */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              
              <TableContainer>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell><strong>Name</strong></TableCell>
                      <TableCell>{user?.name || "Not available"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Age</strong></TableCell>
                      <TableCell>{user?.age || "Not available"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Gender</strong></TableCell>
                      <TableCell>{formData["Male/Female"] || "Not specified"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Preferred Study Method</strong></TableCell>
                      <TableCell>{formData["Preferred Study Method"] || "Not specified"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Disliked Lesson</strong></TableCell>
                      <TableCell>{formData["Disliked lesson"] || "None"}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
            
            {/* Performance Data Table */}
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Performance Data
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Lesson</strong></TableCell>
                      <TableCell align="right"><strong>Marks</strong></TableCell>
                      <TableCell align="right"><strong>Time (s)</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody style={{ textTransform: "capitalize" }}>
                    {[
                      "number sequences",
                      "perimeter",
                      "ratio",
                      "fractions/decimals",
                      "indices",
                      "algebra",
                      "angles",
                      "volume and capacity",
                      "area",
                      "probability",
                    ].map((lesson) => (
                      <TableRow key={lesson}>
                        <TableCell>{lesson}</TableCell>
                        <TableCell align="right">{formData[`${lesson} marks`]}</TableCell>
                        <TableCell align="right">{formData[`${lesson} time(s)`]}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
          
          {/* Assessment Information & Prediction */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Assessment Information
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                Your cognitive performance and stress level values are displayed below as read-only.
              </Alert>
              
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={3}>
                  {/* Stress Level */}
                  <Grid item>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell><strong>Stress Level</strong></TableCell>
                            <TableCell>{formData.stress_level || "Not specified"}</TableCell>
                          </TableRow>
                          <TableCell style={{whiteSpace:"nowrap"}}><strong>Cognitive Performance</strong></TableCell>
                          <TableCell style={{whiteSpace:"nowrap"}}>{formData.cognitive_performance || "Not specified"}</TableCell>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>                  
                </Grid>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  disabled={loading || !formData.stress_level || !formData.cognitive_performance}
                  sx={{ minWidth: 150 }}
                >
                  {loading ? <CircularProgress size={24} /> : "Get Prediction"}
                </Button>
              </Box>
            </Paper>
            
            {/* Results Display */}
            {prediction && (
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Prediction Results
                </Typography>
                
                <Alert severity="success" sx={{ mb: 3 }}>
                  Your content and lesson preferences have been successfully determined!
                </Alert>
                
                {/* Content-based prediction */}
                <Card sx={{ mb: 3, bgcolor: '#e8f5e9' }}>
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      Recommended Content Type:
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                      {prediction.contentBased}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Based on your cognitive performance ({formData.cognitive_performance}) 
                      and current stress level ({formData.stress_level}).
                    </Typography>
                  </CardContent>
                </Card>
                
                {/* Top 5 lessons */}
                {prediction.topLessons && prediction.topLessons.length > 0 && (
                  <Card sx={{ mb: 3, bgcolor: '#e3f2fd' }}>
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom>
                        Top 5 Recommended Lessons:
                      </Typography>
                      
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell><strong>Rank</strong></TableCell>
                              <TableCell><strong>Lesson</strong></TableCell>
                              <TableCell align="right"><strong>Score</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {prediction.topLessons.map((lesson, index) => (
                              <TableRow key={index}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{lesson.lesson}</TableCell>
                                <TableCell align="right">
                                  {typeof lesson.probability === 'number' 
                                    ? lesson.probability.toFixed(2) 
                                    : lesson.probability}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate("/filtered")}
                  >
                    View Recommended Courses
                  </Button>
                  
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => navigate("/profile")}
                  >
                    Back to Profile
                  </Button>
                </Box>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default LessonPrediction;