import React, { useEffect, useState } from "react";
import {
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  Paper,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import config from "../config";
import { useUser } from "../contexts/UserContext";

const FilteredCourses = () => {
  const [courses, setCourses] = useState([]);
  const [completedMaterials, setCompletedMaterials] = useState([]);
  const [sortedCourses, setSortedCourses] = useState([]);
  const [subject, setSubject] = useState("");
  const [cognitivePerformance, setCognitivePerformance] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user, loading: userLoading, isAuthenticated } = useUser();
  const learningPaths = config.learningPaths;

  // Sort courses based on cognitive performance
  const sortCourses = (courses, performance) => {
    const path = learningPaths[performance] || learningPaths["Low"];
    return [...courses].sort((a, b) => {
      return path.indexOf(a.learningMaterial) - path.indexOf(b.learningMaterial);
    });
  };

  // Get current learning path
  const getCurrentPath = () => {
    if (["High", "Very High"].includes(cognitivePerformance)) {
      return learningPaths["High"];
    }
    return learningPaths["Low"];
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      // Use UserContext to check authentication instead of localStorage
      if (userLoading) return; // Wait for user context to load
      
      if (!isAuthenticated) {
        navigate("/login");
        return;
      }

      try {
        // Use user data from context instead of making a separate API call
        const email = user.email;
        
        const contentPreferenceResponse = await axios.get(
          `https://research-project-theta.vercel.app/api/content?email=${email}`
        );
        
        const subjectName = contentPreferenceResponse.data.preferences;
        const cognitive = contentPreferenceResponse.data.cognitive || 'Low'; // Default to Low
        
        setSubject(subjectName);
        setCognitivePerformance(cognitive);

        // First, try with the original subject name
        console.log(`Trying to fetch courses for subject: "${subjectName}"`);
        let coursesResponse = await axios.get(
          `https://research-project-theta.vercel.app/api/course/filter/${encodeURIComponent(subjectName)}`
        );
        
        // If no courses found with original subject name, try the alternative
        if (!coursesResponse.data || coursesResponse.data.length === 0) {
          // Create the alternative subject name (add/remove 's')
          const alternativeSubject = subjectName.endsWith('s') 
            ? subjectName.slice(0, -1)  // Remove 's' if it ends with 's'
            : subjectName + 's';        // Add 's' if it doesn't end with 's'
          
          console.log(`No courses found for "${subjectName}", trying alternative: "${alternativeSubject}"`);
          
          // Try the API request with the alternative subject name
          coursesResponse = await axios.get(
            `https://research-project-theta.vercel.app/api/course/filter/${encodeURIComponent(alternativeSubject)}`
          );
          
          // If courses were found with the alternative, update the displayed subject
          if (coursesResponse.data && coursesResponse.data.length > 0) {
            console.log(`Found ${coursesResponse.data.length} courses with "${alternativeSubject}"`);
            setSubject(`${subjectName} (${alternativeSubject})`); // Show both for clarity
          }
        } else {
          console.log(`Found ${coursesResponse.data.length} courses with "${subjectName}"`);
        }
        
        // Whether we got courses with the original or alternative name, 
        // we now have our best result in coursesResponse
        const fetchedCourses = coursesResponse.data || [];
        setCourses(fetchedCourses);
        setSortedCourses(sortCourses(fetchedCourses, cognitive));
        
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, user, userLoading, isAuthenticated]);

  // Re-sort when cognitivePerformance changes
  useEffect(() => {
    if (courses.length > 0 && cognitivePerformance) {
      setSortedCourses(sortCourses(courses, cognitivePerformance));
    }
  }, [cognitivePerformance, courses]);

  // Handle card click
  const handleCardClick = (id) => {
    navigate(`/lesson/${id}`);
  };

  if (loading) {
    return (
      <Container sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ textAlign: "center", mt: 5 }}>
        <Typography variant="h6" color="error">
          {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ textAlign: "center", mt: 5, mb: 5 }}>
      <Typography variant="h3" gutterBottom>
        Filtered Courses
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Showing courses for subject: <strong>{subject}</strong>
      </Typography>      

      {/* Course Cards with Material Type Indicators */}
      <Grid container spacing={3}>
        {sortedCourses.length > 0 ? (
          sortedCourses.map((course) => (
            <Grid item key={course._id} xs={12} sm={6} md={4}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  borderLeft: `4px solid ${
                    course.learningMaterial === 'quiz' ? '#ff5722' :
                    course.learningMaterial === 'assignment' ? '#4caf50' :
                    course.learningMaterial === 'video' ? '#2196f3' :
                    course.learningMaterial === 'audio' ? '#9c27b0' : '#607d8b'
                  }`
                }}
                onClick={() => handleCardClick(course._id)}
              >
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="140"
                    image={course.image}
                    alt={course.lessonName}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      px: 1,
                      borderRadius: 1,
                      textTransform: 'capitalize'
                    }}
                  >
                    {course.learningMaterial}
                  </Box>
                </Box>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h6" component="div">
                    {course.lessonName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {course.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Typography variant="h6" sx={{ mt: 4, width: '100%' }}>
            No courses found for this subject.
          </Typography>
        )}
      </Grid>
    </Container>
  );
};

export default FilteredCourses;