import React, { useEffect, useState } from "react";
import {
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  TextField,
  Box,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Chip
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AllCourse = () => {
  const [courses, setCourses] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quizProgress, setQuizProgress] = useState({
    completed: 0,
    total: 10
  });
  const navigate = useNavigate();
  
  // Check if user has completed all quizzes and return completion status
  const hasCompletedQuizzes = () => {
    if (!user) return false;
    
    // Check if user has marks data for all the lessons
    const requiredFields = [
      "numberSequencesMarks",
      "perimeterMarks",
      "ratioMarks",
      "fractionsDecimalsMarks",
      "indicesMarks",
      "algebraMarks",
      "anglesMarks",
      "volumeCapacityMarks",
      "areaMarks",
      "probabilityMarks"
    ];
    
    // Count how many fields have at least one mark recorded
    let completedCount = 0;
    requiredFields.forEach(field => {
      if (user[field] && user[field].length > 0) {
        completedCount++;
      }
    });
    
    // Note: We're NOT setting state here, just returning the value!
    return {
      isComplete: completedCount === requiredFields.length,
      completed: completedCount,
      total: requiredFields.length
    };
  };

  // Fetch courses data
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get(
          "https://research-project-theta.vercel.app/api/course"
        );
        setCourses(response.data);
        console.log("Courses fetched:", response.data);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    if (user) {
      const quizStatus = hasCompletedQuizzes();
      setQuizProgress({
        completed: quizStatus.completed,
        total: quizStatus.total
      });
    }
  }, [user]);

  // Fetch user profile if token exists
  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoggedIn(false);
        setLoading(false);
        console.log("No token found. User is not logged in.");
        return;
      }

      try {
        // Fetch user profile to verify authentication
        const profileResponse = await axios.get(
          "https://research-project-theta.vercel.app/api/auth/profile",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setIsLoggedIn(true);
        setUser(profileResponse.data);
        console.log("User is logged in:", profileResponse.data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Handle card click
  const handleCardClick = (id, isSpecialization) => {
    if (!isLoggedIn) {
      console.log("User is not logged in. Cannot navigate.");
      return;
    }
    navigate(isSpecialization ? `/specialization/${id}` : `/lesson/${id}`);
  };
  
  // Navigate to lesson prediction page
  const handleLessonPredictionClick = () => {
    navigate("/lesson");
  };

  const filteredQuizzes = courses.filter((course) => {
    // Check if it's a quiz - need to check for both "quiz" and "Quiz" due to possible inconsistencies
    return (course.learningMaterial?.toLowerCase() === "quiz" || 
            course.type?.toLowerCase() === "quiz") && 
           course.lessonName.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  // Loading state
  if (loading) {
    return (
      <Container sx={{ textAlign: "center", mt: 10 }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading courses...
        </Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ textAlign: "center", mt: 5 }}>
      <Typography variant="h3" gutterBottom>
        Edu Platform
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Welcome to the best online education platform!
      </Typography>

      {/* Banner for quiz completion status */}
      {isLoggedIn && (
        <Paper 
          elevation={3} 
          sx={{ 
            mt: 4, 
            p: 3, 
            backgroundColor: quizProgress.completed === quizProgress.total ? "#e8f5e9" : "#fff3e0",
            borderRadius: 2
          }}
        >
          <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ mb: { xs: 2, md: 0 } }}>
              <Typography variant="h6" gutterBottom>
                {quizProgress.completed === quizProgress.total 
                  ? "All quizzes completed! You can now get personalized lesson predictions." 
                  : `Complete all ${quizProgress.total} quizzes to unlock personalized lesson predictions.`}
              </Typography>
              <Typography variant="body1" component="div">
                Progress: {quizProgress.completed} / {quizProgress.total} quizzes
                <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                  <Box
                    sx={{
                      width: "100%",
                      bgcolor: "grey.300",
                      borderRadius: 1,
                      mr: 2,
                      height: 10
                    }}
                  >
                    <Box
                      sx={{
                        width: `${(quizProgress.completed / quizProgress.total) * 100}%`,
                        bgcolor: quizProgress.completed === quizProgress.total ? "success.main" : "warning.main",
                        height: 10,
                        borderRadius: 1
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ minWidth: 40 }}>
                    {Math.round((quizProgress.completed / quizProgress.total) * 100)}%
                  </Typography>
                </Box>
              </Typography>
            </Box>
            <Button
              variant="contained"
              color={quizProgress.completed === quizProgress.total ? "primary" : "inherit"}
              onClick={handleLessonPredictionClick}
              disabled={quizProgress.completed !== quizProgress.total}
              sx={{ 
                px: 3, 
                py: 1.5,
                boxShadow: quizProgress.completed === quizProgress.total ? 2 : 0
              }}
            >
              {quizProgress.completed === quizProgress.total ? "Get Lesson Prediction" : "Complete All Quizzes First"}
            </Button>
          </Box>
        </Paper>
      )}

      {/* Search Bar */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search quizzes..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mt: 4, mb: 4 }}
      />

      {/* Display debug information during development */}
      {/* <Box sx={{ mb: 4, textAlign: "left", p: 2, border: "1px solid #ddd" }}>
        <Typography variant="subtitle2">Debug Info:</Typography>
        <Typography variant="body2">Total courses: {courses.length}</Typography>
        <Typography variant="body2">Filtered quizzes: {filteredQuizzes.length}</Typography>
      </Box> */}

      {/* Display Quizzes Only */}
      <Typography variant="h4" sx={{ mt: 4, mb: 2 }}>
        Quizzes
      </Typography>
      {filteredQuizzes.length === 0 ? (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary">
            No quizzes found matching your search criteria.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredQuizzes.map((course) => {
            // Determine if this quiz has been completed by checking the user's marks
            let quizFieldName = null;
            
            // Map course lesson name to the corresponding field in user profile
            switch(course.lessonName.toLowerCase()) {
              case "number sequences": quizFieldName = "numberSequencesMarks"; break;
              case "perimeter": quizFieldName = "perimeterMarks"; break;
              case "ratio": quizFieldName = "ratioMarks"; break;
              case "fractions/decimals": 
              case "fractions and decimals":
                quizFieldName = "fractionsDecimalsMarks"; break;
              case "indices": quizFieldName = "indicesMarks"; break;
              case "algebra": quizFieldName = "algebraMarks"; break;
              case "angles": quizFieldName = "anglesMarks"; break;
              case "volume and capacity": quizFieldName = "volumeCapacityMarks"; break;
              case "area": quizFieldName = "areaMarks"; break;
              case "probability": quizFieldName = "probabilityMarks"; break;
              default: quizFieldName = null;
            }
            
            // Check if this quiz has been completed by the user
            const isCompleted = user && quizFieldName && user[quizFieldName] && user[quizFieldName].length > 0;
            
            return (
              <Grid item key={course._id} xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    cursor: isLoggedIn ? "pointer" : "default",
                    opacity: isLoggedIn ? 1 : 0.7,
                    position: "relative",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    border: isCompleted ? "1px solid #4caf50" : "1px solid transparent",
                    "&:hover": {
                      transform: isLoggedIn ? "translateY(-4px)" : "none",
                      boxShadow: isLoggedIn ? 4 : 1
                    }
                  }}
                  onClick={() => handleCardClick(course._id, false)}
                >
                  {/* Completed badge */}
                  {isCompleted && (
                    <Chip
                      label="Completed"
                      color="success"
                      size="small"
                      sx={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        zIndex: 1
                      }}
                    />
                  )}
                  <CardMedia
                    component="img"
                    height="120"
                    image={course.image || `https://via.placeholder.com/300/2196f3/ffffff?text=${encodeURIComponent(course.lessonName)}`}
                    alt={course.lessonName}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h6" component="div">
                      {course.lessonName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {course.description}
                    </Typography>
                    <Box 
                      sx={{ 
                        mt: 2,
                        display: "flex",
                        justifyContent: "center"
                      }}
                    >
                      <Chip
                        label={isCompleted ? "Retry Quiz" : "Start Quiz"}
                        color={isCompleted ? "secondary" : "primary"}
                        variant={isCompleted ? "outlined" : "filled"}
                        size="small"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
};

export default AllCourse;