import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import axios from "axios";
import config from "../config";

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
          config.api.getUrl('MAIN_API', '/api/course')
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
          config.api.getUrl('MAIN_API', '/api/auth/profile'),
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
      <div className="container mx-auto text-center mt-16">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
        <h2 className="text-lg font-semibold mt-3 text-blue-800">
          Loading courses...
        </h2>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 text-center">
      <h1 className="text-3xl font-bold mb-2 text-blue-800">Smart Steps</h1>
      <p className="text-blue-600 mb-6 text-sm">
        Welcome to the best online education platform!
      </p>

      {/* Banner for quiz completion status */}
      {isLoggedIn && (
        <div className={`rounded-lg shadow-md p-4 mb-6 ${
          quizProgress.completed === quizProgress.total ? "bg-blue-50 border border-blue-200" : "bg-blue-50 border border-blue-200"
        }`}>
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h2 className="text-lg font-semibold mb-1 text-blue-800">
                {quizProgress.completed === quizProgress.total 
                  ? "All quizzes completed! You can now get personalized lesson predictions." 
                  : `Complete all ${quizProgress.total} quizzes to unlock personalized lesson predictions.`}
              </h2>
              <div>
                <p className="mb-1 text-sm text-blue-700">Progress: {quizProgress.completed} / {quizProgress.total} quizzes</p>
                <div className="flex items-center">
                  <div className="w-full bg-blue-100 rounded-full h-2 mr-2">
                    <Progress 
                      value={(quizProgress.completed / quizProgress.total) * 100} 
                      className="h-2 rounded-full" 
                      indicatorClassName="bg-blue-600"
                    />
                  </div>
                  <span className="text-xs min-w-[40px] text-blue-700">
                    {Math.round((quizProgress.completed / quizProgress.total) * 100)}%
                  </span>
                </div>
              </div>
            </div>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleLessonPredictionClick}
              disabled={quizProgress.completed !== quizProgress.total}
            >
              {quizProgress.completed === quizProgress.total ? "Get Lesson Prediction" : "Complete All Quizzes First"}
            </Button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <Input
          className="max-w-md mx-auto border-blue-200 focus:border-blue-400"
          placeholder="Search quizzes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Display Quizzes Only */}
      <h2 className="text-xl font-bold mt-6 mb-4 text-blue-800">Quizzes</h2>
      
      {filteredQuizzes.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-lg text-blue-600">
            No quizzes found matching your search criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
              <Card
                key={course._id}
                className={`overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  isLoggedIn ? "opacity-100 hover:-translate-y-1" : "opacity-70"
                } ${isCompleted ? "border-blue-400 border" : ""}`}
                onClick={() => handleCardClick(course._id, false)}
              >
                {/* Completed badge */}
                {isCompleted && (
                  <Badge 
                    className="absolute top-2 right-2 bg-blue-600 z-10"
                  >
                    Completed
                  </Badge>
                )}
                
                <div className="h-24 bg-blue-100 relative overflow-hidden">
                  {course.image ? (
                    <img 
                      src={course.image} 
                      alt={course.lessonName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white font-semibold p-2 text-center">
                      {course.lessonName}
                    </div>
                  )}
                </div>
                
                <CardContent className="p-3">
                  <h3 className="text-base font-semibold mb-1 text-blue-900">
                    {course.lessonName}
                  </h3>
                  <p className="text-xs text-gray-600 line-clamp-2 h-8">
                    {course.description}
                  </p>
                  
                  <div className="mt-2 flex justify-center">
                    <Badge 
                      className={`${
                        isCompleted 
                          ? "bg-white text-blue-600 border border-blue-600" 
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {isCompleted ? "Retry Quiz" : "Start Quiz"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AllCourse;