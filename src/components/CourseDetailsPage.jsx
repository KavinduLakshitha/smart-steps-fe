import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  TextField,
  Rating,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DescriptionIcon from "@mui/icons-material/Description";
import { useNavigate } from "react-router-dom";
import config from '../config';
import { useUser } from '../contexts/UserContext';

const CourseDetailsPage = () => {
  const { id } = useParams(); // Get the course ID from the URL
  const [course, setCourse] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]); // Store user's quiz answers
  const [correctAnswers, setCorrectAnswers] = useState([]); // Store correct/incorrect results
  const [quizScore, setQuizScore] = useState(0); // Store quiz score
  const [quizSubmitted, setQuizSubmitted] = useState(false); // Track quiz submission
  const navigate = useNavigate();
  const [timeSpent, setTimeSpent] = useState(0); // Time in seconds
  const [timerActive, setTimerActive] = useState(true);
  const [hasUpdatedMarks, setHasUpdatedMarks] = useState(false); // Track if marks were updated
const { user, updateUser, isAuthenticated } = useUser();
  // Fetch course details and reviews on component mount
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        // Fetch course details
        const courseResponse = await axios.get(
          `https://research-project-theta.vercel.app/api/course/${id}`
        );
        setCourse(courseResponse.data);
        console.log(courseResponse.data.subject);

        // Fetch reviews for the course
        const reviewsResponse = await axios.get(
          `https://research-project-theta.vercel.app/api/reviews/course/${id}`
        );
        setReviews(reviewsResponse.data);
      } catch (error) {
        console.error("Error fetching course details:", error);
      }
    };

    fetchCourse();
  }, [id]);

  useEffect(() => {
    let interval;
    if (timerActive) {
      interval = setInterval(() => {
        setTimeSpent((prevTime) => prevTime + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive]);

  // Stop timer when navigating away
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (timerActive) {
        updateTimeSpent();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (timerActive) {
        updateTimeSpent();
      }
    };
  }, [timerActive, timeSpent, course?.subject]);

  const updateTimeSpent = async () => {
    try {
      if (!isAuthenticated || !course?.subject) return;
  
      const timeField = getTimeField(course.subject);
      if (!timeField) return;
  
      const updateData = {
        [timeField]: timeSpent.toString()
      };
  
      // Only include marks if quiz was submitted AND marks haven't been updated yet
      if (quizSubmitted && !hasUpdatedMarks) {
        updateData[getMarksField(course.subject)] = quizScore;
        setHasUpdatedMarks(true); // Mark that we've updated the marks
      }
  
      const success = await updateUser(updateData);
  
      console.log("Time update success:", success);
      return success;
    } catch (error) {
      console.error("Error updating time spent:", error);
      throw error;
    }
  };

  const handleComplete = async () => {
  try {
    setIsCompleted(true);
    
    // Make sure to update time spent before navigating away
    if (timerActive) {
      await updateTimeSpent();
      setTimerActive(false);
    }
    
    // Simply navigate back to the filtered courses page
    navigate('/all');
  } catch (error) {
    console.error("Error in handleComplete:", error);
    navigate('/all');
  }
};

  // Helper function to map subject to the corresponding time field
  const getTimeField = (subject) => {
    return config.fieldMappings.subjectToTime[subject] || "";
  };

  // Handle quiz answer input change
  const handleQuizAnswerChange = (index, answer) => {
    const newAnswers = [...userAnswers];
    newAnswers[index] = answer.trim(); 
    setUserAnswers(newAnswers);
  };

  // Handle quiz submission
  const handleQuizSubmit = async () => {
  try {
    if (!isAuthenticated) {
      alert("Please log in to submit the quiz.");
      return;
    }

    // Validate quiz answers
    if (!course.quizAnswers || course.quizQuestions.length !== course.quizAnswers.length) {
      alert("Quiz answers are not available. Please contact support.");
      return;
    }

    // More flexible answer checking
    const results = userAnswers.map((userAnswer, index) => {
      if (!userAnswer) return false; // No answer provided
      
      const correctAnswer = course.quizAnswers[index];
      
      // Try different ways of comparing answers
      // 1. Direct comparison (after trimming whitespace)
      if (userAnswer.trim() === correctAnswer.trim()) return true;
      
      // 2. Case-insensitive comparison
      if (userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()) return true;
      
      // 3. For numerical answers, check if the values are close enough
      // This handles different formats (e.g., "4.0" vs "4")
      const userNum = parseFloat(userAnswer.replace(/[^\d.-]/g, ''));
      const correctNum = parseFloat(correctAnswer.replace(/[^\d.-]/g, ''));
      
      if (!isNaN(userNum) && !isNaN(correctNum)) {
        // Allow a small tolerance for floating point comparisons
        const tolerance = 0.001;
        if (Math.abs(userNum - correctNum) < tolerance) return true;
      }
      
      // 4. Check for answers with units
      // Strip all non-alphanumeric except decimal point for number comparison
      const userNumWithoutUnits = userAnswer.replace(/[^\d.-]/g, '');
      const correctNumWithoutUnits = correctAnswer.replace(/[^\d.-]/g, '');
      
      if (userNumWithoutUnits === correctNumWithoutUnits) return true;
      
      // Answer is incorrect
      return false;
    });
    
    setCorrectAnswers(results);
    const score = results.reduce((acc, isCorrect) => acc + (isCorrect ? 20 : 0), 0);
    setQuizScore(score);

    // Stop the timer
    setTimerActive(false);

    // Prepare update data
    const updateData = {
      [getMarksField(course.subject)]: score,
      [getTimeField(course.subject)]: timeSpent.toString()
    };

    // Use updateUser from UserContext
    const success = await updateUser(updateData);

    if (success) {
      setQuizSubmitted(true);
      alert(`Quiz submitted! Score: ${score} | Time: ${formatTime(timeSpent)}`);
    } else {
      alert("Failed to update quiz data.");
    }
    
    // Log answers for debugging
    console.log("User answers:", userAnswers);
    console.log("Expected answers:", course.quizAnswers);
    console.log("Results:", results);
    
  } catch (error) {
    console.error("Error submitting quiz:", error);
    alert("Failed to submit quiz: " + error.message);
  }
};

  // Helper function to map subject to the corresponding marks field
  const getMarksField = (subject) => {
    return config.fieldMappings.subjectToMarks[subject] || "";
  };

  // Handle review submission
  const handleReviewSubmit = async () => {
    try {
      if (!isAuthenticated) {
        alert("Please log in to submit a review.");
        return;
      }

      const token = localStorage.getItem("token");

      // Submit the review
      await axios.post(
        `https://research-project-theta.vercel.app/api/reviews/create`,
        {
          courseId: id,
          rating,
          comment,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update the reviews state
      setReviews([...reviews, { rating, comment }]);
      setComment("");
      setRating(0);
      alert("Review submitted successfully!");
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review.");
    }
  };

  if (!course) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box sx={{ padding: 4, backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <Paper elevation={3} sx={{ padding: 3, marginBottom: 4, marginTop: 4, position: "relative" }}>
      <Box sx={{ 
    position: "absolute", 
    top: -30, 
    left: "50%", 
    transform: "translateX(-50%)",
    backgroundColor: '#f0f0f0',
    padding: '4px 16px',
    borderRadius: '4px',
    boxShadow: 1,
    zIndex: 1
  }}>
    <Typography variant="body1">
      Time spent: {formatTime(timeSpent)}
    </Typography>
  </Box>
        
        {/* Complete Button */}
        <Button
          variant="contained"
          color="secondary"
          onClick={handleComplete}
          disabled={isCompleted}
          sx={{ position: "absolute", top: 16, right: 16 }}
          startIcon={<CheckCircleIcon />}
        >
          Complete
        </Button>

        {/* Course Content Header */}
        <Box sx={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
          <DescriptionIcon sx={{ fontSize: 30, color: "primary.main", marginRight: 1 }} />
          <Typography variant="h4" sx={{ fontWeight: "bold" }}>
            {course.lessonName}
          </Typography>
        </Box>

        {!isAuthenticated && (
          <Box sx={{ backgroundColor: "#fff3e0", padding: 2, borderRadius: 1, marginBottom: 2 }}>
            <Typography variant="body1" color="warning.main">
              Please log in to track your progress and submit quiz answers.
            </Typography>
          </Box>
        )}

        {/* Divider Line */}
        <Divider sx={{ marginBottom: 2 }} />

        {/* Description Section */}
        <Box sx={{ display: "flex", alignItems: "center", marginBottom: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", marginRight: 1 }}>
            Description:
          </Typography>
        </Box>
        <Typography sx={{ color: "text.secondary", lineHeight: 1.6 }}>
          {course.description}
        </Typography>
      </Paper>

      {/* Display Course Content Based on Learning Material */}
      {course.learningMaterial === "video" && (
        <iframe
          width="100%"
          height="315"
          src={`https://www.youtube.com/embed/${course.source.split("/").pop()}`}
          title="Course Video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ marginBottom: 24, borderRadius: 8 }}
        />
      )}

      {course.learningMaterial === "audio" && (
        <audio controls style={{ width: "100%", marginBottom: 24 }}>
          <source src={course.source} type="audio/mpeg" />
          <source src={course.source} type="audio/ogg" />
          Your browser does not support the audio element.
        </audio>
      )}

      {course.learningMaterial === "pdf" && (
        <iframe src={course.source} width="100%" height="600px" style={{ marginBottom: 24 }} />
      )}

      {course.learningMaterial === "text" && (
        <>
          <Typography variant="h6">Heading:</Typography>
          <Typography>{course.heading}</Typography>
          <Typography variant="h6">Content:</Typography>
          <Typography>{course.textContent}</Typography>
        </>
      )}

      {course.learningMaterial === "assignment" && (
        <Typography variant="h6">Assignment Content: {course.assignmentContent}</Typography>
      )}

      {course.learningMaterial === "quiz" && course.quizQuestions && (
        <>
          <Typography variant="h6">Quiz Questions:</Typography>
          {course.quizQuestions.map((question, index) => (
            <Box key={index} sx={{ marginBottom: 2 }}>
              <Typography>
                {index + 1}. {question}
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Your answer"
                value={userAnswers[index] || ""}
                onChange={(e) => handleQuizAnswerChange(index, e.target.value)}
                sx={{ marginTop: 1 }}
                disabled={quizSubmitted}
              />
              {correctAnswers.length > 0 && (
                <Typography
                  variant="body2"
                  color={correctAnswers[index] ? "green" : "red"}
                  sx={{ display: "inline", marginLeft: "8px" }}
                >
                  {correctAnswers[index] ? "✓ Correct" : "✗ Incorrect"}
                </Typography>
              )}
            </Box>
          ))}
          {!quizSubmitted ? (
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleQuizSubmit}
            >
              Submit Quiz
            </Button>
          ) : (
            <>
              <Typography variant="body1" sx={{ color: "green", marginTop: 2 }}>
                Quiz submitted! Score: {quizScore} | Time: {formatTime(timeSpent)}
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleComplete}
                sx={{ marginTop: 2 }}
                startIcon={<CheckCircleIcon />}
              >
                Complete Course
              </Button>
            </>
          )}
        </>
      )}

      <Divider sx={{ margin: "24px 0" }} />

      {/* Reviews Section */}
      <Box>
        <Typography variant="h6">User Reviews:</Typography>
        {reviews.map((review, index) => (
          <Box key={index} sx={{ marginBottom: 2 }}>
            <Rating name="read-only" value={review.rating} readOnly />
            <Typography variant="body2">{review.comment}</Typography>
          </Box>
        ))}
        <Box component="form" sx={{ marginTop: 2 }} onSubmit={handleReviewSubmit}>
          <Typography variant="h6">Leave a Review:</Typography>
          <Rating
            name="simple-controlled"
            value={rating}
            onChange={(event, newValue) => setRating(newValue)}
            sx={{ marginBottom: 1 }}
          />
          <TextField
            fullWidth
            variant="outlined"
            label="Your Comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            sx={{ marginBottom: 2 }}
          />
          <Button variant="contained" color="primary" type="submit" disabled={!isAuthenticated}>
            Submit Review
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

// Helper function to format seconds into HH:MM:SS
const formatTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return [
    hrs.toString().padStart(2, '0'),
    mins.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0')
  ].join(':');
};

export default CourseDetailsPage;