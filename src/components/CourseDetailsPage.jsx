import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import config from '../config';
import { useUser } from '../contexts/UserContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, FileText, Clock, Star } from "lucide-react";

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
        const courseApiUrl = config.api.getUrl('MAIN_API', `/api/course/${id}`);
        const reviewsApiUrl = config.api.getUrl('MAIN_API', `/api/reviews/course/${id}`);
        
        if (!courseApiUrl || !reviewsApiUrl) {
          console.error("Failed to get MAIN_API URLs");
          return;
        }

        const courseResponse = await axios.get(courseApiUrl);
        setCourse(courseResponse.data);
        console.log(courseResponse.data.subject);

        const reviewsResponse = await axios.get(reviewsApiUrl);
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
      
      // Store completion status in localStorage for the step progress indicator
      const completedCourses = JSON.parse(localStorage.getItem('completedCourses') || '[]');
      if (!completedCourses.includes(id)) {
        completedCourses.push(id);
        localStorage.setItem('completedCourses', JSON.stringify(completedCourses));
      }
      
      // Simply navigate back to the filtered courses page
      navigate('/filtered');
    } catch (error) {
      console.error("Error in handleComplete:", error);
      navigate('/filtered');
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
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!isAuthenticated) {
        alert("Please log in to submit a review.");
        return;
      }

      const token = localStorage.getItem("token");
      const reviewApiUrl = config.api.getUrl('MAIN_API', '/api/reviews/create');
      
      if (!reviewApiUrl) {
        console.error("Failed to get MAIN_API URL for reviews");
        alert("Failed to submit review - API configuration error.");
        return;
      }

      await axios.post(
        reviewApiUrl,
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

  // Star rating component
  const StarRating = ({ value, onChange, readOnly = false }) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 cursor-pointer transition-colors ${
              star <= value 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300 hover:text-yellow-400'
            } ${readOnly ? 'cursor-default' : ''}`}
            onClick={readOnly ? undefined : () => onChange && onChange(star)}
          />
        ))}
      </div>
    );
  };

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <h2 className="text-xl font-semibold mt-4">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Card className="relative mb-6">
          {/* Timer Display */}
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gray-100 px-4 py-1 rounded shadow-sm z-10">
            <div className="flex items-center space-x-2 text-sm font-medium">
              <Clock className="w-4 h-4" />
              <span>Time spent: {formatTime(timeSpent)}</span>
            </div>
          </div>

          {/* Complete Button */}
          <Button
            onClick={handleComplete}
            disabled={isCompleted}
            className="absolute top-4 right-4"
            variant={isCompleted ? "secondary" : "default"}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {isCompleted ? "Completed" : "Complete"}
          </Button>

          <CardHeader className="pt-8">
            <CardTitle className="flex items-center space-x-3 text-2xl">
              <FileText className="w-8 h-8 text-primary" />
              <span>{course.lessonName}</span>
            </CardTitle>
          </CardHeader>

          <CardContent>
            {!isAuthenticated && (
              <Alert className="mb-4">
                <AlertDescription>
                  Please log in to track your progress and submit quiz answers.
                </AlertDescription>
              </Alert>
            )}

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-2">Description:</h3>
              <p className="text-gray-600 leading-relaxed">{course.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Course Content Based on Learning Material */}
        <div className="mb-6">
          {course.learningMaterial === "video" && (
            <div className="rounded-lg overflow-hidden shadow-lg">
              <iframe
                width="100%"
                height="400"
                src={`https://www.youtube.com/embed/${course.source.split("/").pop()}`}
                title="Course Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full"
              />
            </div>
          )}

          {course.learningMaterial === "audio" && (
            <Card>
              <CardContent className="p-6">
                <audio controls className="w-full">
                  <source src={course.source} type="audio/mpeg" />
                  <source src={course.source} type="audio/ogg" />
                  Your browser does not support the audio element.
                </audio>
              </CardContent>
            </Card>
          )}

          {course.learningMaterial === "pdf" && (
            <Card>
              <CardContent className="p-0">
                <iframe 
                  src={course.source} 
                  width="100%" 
                  height="600px" 
                  className="rounded-lg"
                />
              </CardContent>
            </Card>
          )}

          {course.learningMaterial === "text" && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Heading:</h3>
                <p className="mb-6">{course.heading}</p>
                <h3 className="text-xl font-semibold mb-4">Content:</h3>
                <p className="leading-relaxed">{course.textContent}</p>
              </CardContent>
            </Card>
          )}

          {course.learningMaterial === "assignment" && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Assignment Content:</h3>
                <p className="leading-relaxed">{course.assignmentContent}</p>
              </CardContent>
            </Card>
          )}

          {course.learningMaterial === "quiz" && course.quizQuestions && (
            <Card>
              <CardHeader>
                <CardTitle>Quiz Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {course.quizQuestions.map((question, index) => (
                    <div key={index} className="space-y-2">
                      <p className="font-medium">
                        {index + 1}. {question}
                      </p>
                      <Input
                        placeholder="Your answer"
                        value={userAnswers[index] || ""}
                        onChange={(e) => handleQuizAnswerChange(index, e.target.value)}
                        disabled={quizSubmitted}
                        className="w-full"
                      />
                      {correctAnswers.length > 0 && (
                        <span
                          className={`text-sm font-medium ${
                            correctAnswers[index] ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {correctAnswers[index] ? "✓ Correct" : "✗ Incorrect"}
                        </span>
                      )}
                    </div>
                  ))}
                  
                  {!quizSubmitted ? (
                    <Button onClick={handleQuizSubmit} className="w-full">
                      Submit Quiz
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <Alert>
                        <CheckCircle className="w-4 h-4" />
                        <AlertDescription>
                          Quiz submitted! Score: {quizScore} | Time: {formatTime(timeSpent)}
                        </AlertDescription>
                      </Alert>
                      <Button
                        onClick={handleComplete}
                        className="w-full"
                        variant="secondary"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Complete Course
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Reviews Section */}
        <Card>
          <CardHeader>
            <CardTitle>User Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-6">
              {reviews.map((review, index) => (
                <div key={index} className="border-b pb-4 last:border-b-0">
                  <StarRating value={review.rating} readOnly />
                  <p className="text-gray-600 mt-2">{review.comment}</p>
                </div>
              ))}
            </div>

            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold mb-4">Leave a Review</h4>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rating</label>
                  <StarRating 
                    value={rating} 
                    onChange={setRating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Your Comment</label>
                  <Textarea
                    placeholder="Share your thoughts about this course..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={!isAuthenticated}
                  className="w-full"
                >
                  Submit Review
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
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