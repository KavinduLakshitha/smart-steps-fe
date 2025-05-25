import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertCircle,
  CheckCircleIcon,
  Loader2,
  BookOpen,
  User,
  BarChart3,
  BrainCircuit
} from "lucide-react";
import axios from "axios";
import config from '../config';

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
          config.api.getUrl('MAIN_API', '/api/auth/profile'),
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
      const contentPredictUrl = config.api.getUrl('STRESS_API', '/predict');
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
      const lessonPredictUrl = config.api.getUrl('LESSON_PREDICTION_API', '/predict');
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
        await axios.post(config.api.getUrl('MAIN_API', '/api/content/save'), {
          email: user.email,
          preferences: predictedLesson,
          stressLevel: formData.stress_level,
          cognitive: formData.cognitive_performance,
        });
        
        // Save lesson preferences
        if (lessonResponse.data["Top 5 Predicted Lessons"]) {
          await axios.post(config.api.getUrl('MAIN_API', '/api/lesson/save'), {
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

  if (userLoading) {
    return (
      <div className="container mx-auto text-center mt-16">
        <div className="flex justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
        <h2 className="text-lg font-semibold mt-3 text-blue-800">
          Loading user data...
        </h2>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="bg-white rounded-lg shadow-lg p-6 border border-blue-100">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-blue-800">Lesson Prediction</h1>
          <p className="text-blue-600 text-sm">
            Get personalized lesson recommendations based on your profile data
          </p>
        </div>
        
        {/* User Information */}
        {user && (
          <div className="mb-4 text-center">
            <p className="text-sm text-gray-600">
              Logged in as: <span className="font-semibold text-blue-700">{user.email}</span>
            </p>
          </div>
        )}
        
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Profile Data Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side: Personal Information & Performance */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-blue-200 shadow-sm">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-t-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                <h2 className="font-semibold">Personal Information</h2>
              </div>
              
              <div className="p-4">
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-semibold text-blue-900">Name</TableCell>
                      <TableCell>{user?.name || "Not available"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold text-blue-900">Age</TableCell>
                      <TableCell>{user?.age || "Not available"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold text-blue-900">Gender</TableCell>
                      <TableCell>{formData["Male/Female"] || "Not specified"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold text-blue-900">Preferred Study Method</TableCell>
                      <TableCell>{formData["Preferred Study Method"] || "Not specified"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold text-blue-900">Disliked Lesson</TableCell>
                      <TableCell>{formData["Disliked lesson"] || "None"}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-blue-200 shadow-sm">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-t-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                <h2 className="font-semibold">Performance Data</h2>
              </div>
              
              <div className="p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-blue-900">Lesson</TableHead>
                      <TableHead className="text-right text-blue-900">Marks</TableHead>
                      <TableHead className="text-right text-blue-900">Time (s)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="capitalize">
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
                        <TableCell className="text-right">{formData[`${lesson} marks`]}</TableCell>
                        <TableCell className="text-right">{formData[`${lesson} time(s)`]}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          
          {/* Right Side: Assessment & Prediction */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-blue-200 shadow-sm">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-t-lg flex items-center gap-2">
                <BrainCircuit className="h-5 w-5" />
                <h2 className="font-semibold">Assessment Information</h2>
              </div>
              
              <div className="p-4">
                <Alert className="mb-4 bg-blue-50 border-blue-200">
                  <AlertDescription>
                    Your cognitive performance and stress level values are displayed below as read-only.
                  </AlertDescription>
                </Alert>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-md border border-blue-100 text-center">
                      <p className="text-sm text-gray-500 mb-1">Stress Level</p>
                      <p className="text-lg font-bold text-blue-800">{formData.stress_level || "Not specified"}</p>
                    </div>
                    <div className="bg-white p-3 rounded-md border border-blue-100 text-center">
                      <p className="text-sm text-gray-500 mb-1">Cognitive Performance</p>
                      <p className="text-lg font-bold text-blue-800">{formData.cognitive_performance || "Not specified"}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center mt-6">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                    onClick={handleSubmit}
                    disabled={loading || !formData.stress_level || !formData.cognitive_performance}
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Get Prediction
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Results Display */}
            {prediction && (
              <div className="bg-white rounded-lg border border-blue-200 shadow-sm">
                <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-3 rounded-t-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  <h2 className="font-semibold">Prediction Results</h2>
                </div>
                
                <div className="p-4">
                  <Alert className="mb-4 bg-green-50 border-green-200">
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Your content and lesson preferences have been successfully determined!
                    </AlertDescription>
                  </Alert>
                  
                  {/* Content-based prediction */}
                  <Card className="mb-4 border-blue-200 bg-blue-50">
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-bold text-blue-800 mb-2">
                        Recommended Content Type:
                      </h3>
                      <div className="bg-white p-3 rounded-md border border-blue-100 text-center mb-2">
                        <p className="text-xl font-bold text-blue-700">
                          {prediction.contentBased}
                        </p>
                      </div>
                      <p className="text-sm text-blue-600">
                        Based on your cognitive performance ({formData.cognitive_performance}) 
                        and current stress level ({formData.stress_level}).
                      </p>
                    </CardContent>
                  </Card>
                  
                  {/* Top 5 lessons */}
                  {prediction.topLessons && prediction.topLessons.length > 0 && (
                    <Card className="mb-4 border-blue-200">
                      <CardContent className="pt-6">
                        <h3 className="text-lg font-bold text-blue-800 mb-2">
                          Top 5 Recommended Lessons:
                        </h3>
                        
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-blue-900">Rank</TableHead>
                              <TableHead className="text-blue-900">Lesson</TableHead>
                              <TableHead className="text-right text-blue-900">Score</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {prediction.topLessons.map((lesson, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{index + 1}</TableCell>
                                <TableCell>{lesson.lesson}</TableCell>
                                <TableCell className="text-right">
                                  {typeof lesson.probability === 'number' 
                                    ? lesson.probability.toFixed(2) 
                                    : lesson.probability}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                  
                  <div className="flex flex-col sm:flex-row justify-between gap-4 mt-4">
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => navigate("/filtered")}
                    >
                      View Recommended Courses
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      onClick={() => navigate("/profile")}
                    >
                      Back to Profile
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonPrediction;