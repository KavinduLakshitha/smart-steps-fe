import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, GraduationCap, Users, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import config from "../config";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    phoneNum: "",
    Gender: "",
    preferredStudyMethod: "",
    dislikedLesson: "",
  });
  const [contentPreference, setContentPreference] = useState(null);
  const [lessonPreference, setLessonPreference] = useState(null);
  const [peerPreference, setPeerPreference] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [stressLevel, setStressLevel] = useState("");
  const [stressProbability, setStressProbability] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [peerPrediction, setPeerPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cognitivePerformance, setCognitivePerformance] = useState("");
  const navigate = useNavigate();
  const [lessonPredictions, setLessonPredictions] = useState([]);
  const [freshLessonPredictions, setFreshLessonPredictions] = useState([]);

  const timeFieldMapping = {
    numberSequencesTime: "number sequences time(s)",
    ratioTime: "ratio time(s)",
    perimeterTime: "perimeter time(s)",
    fractionsDecimalsTime: "fractions/decimals time(s)",
    indicesTime: "indices time(s)",
    algebraTime: "algebra time(s)",
    anglesTime: "angles time(s)",
    volumeCapacityTime: "volume and capacity time(s)",
    areaTime: "area time(s)",
    probabilityTime: "probability time(s)",
  };

  // Utility function to fetch user profile data from API
  const fetchUserProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return null;
    }

    try {
      const response = await axios.get(
        config.api.getUrl('MAIN_API', '/api/auth/profile'),
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      if (error.response && error.response.status === 401) {
        setSnackbarMessage("Your session has expired. Please log in again.");
        localStorage.removeItem("token");
        setTimeout(() => navigate("/login"), 1000);
      }
      throw error;
    }
  };

  // Function to update stress level and cognitive performance in API
  const updateUserPerformanceData = async (updates) => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(
        config.api.getUrl('MAIN_API', '/api/auth/updatePerformanceData'),
        updates,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (error) {
      console.error("Error updating performance data:", error);
      throw error;
    }
  };

  const handleLessonPrediction = async (profileData) => {
    setLoading(true);
    try {
      // Helper function to map gender values
      const mapGender = (gender) => {
        if (!gender) return "M"; // Default
        const g = gender.toLowerCase();
        if (g.includes("male") && !g.includes("female")) return "M";
        if (g.includes("female")) return "F";
        if (g === "m") return "M";
        if (g === "f") return "F";
        return "M"; // Default fallback
      };

      // Helper function to map study method
      const mapStudyMethod = (method) => {
        if (!method) return "practicing"; // Default
        const m = method.toLowerCase();
        // Expected: ["Only school lessons", "figures", "practicing"]
        if (m.includes("school") || m.includes("lesson")) return "Only school lessons";
        if (m.includes("figure") || m.includes("visual") || m.includes("diagram")) return "figures";
        if (m.includes("practice") || m.includes("exercise")) return "practicing";
        return "practicing"; // Default fallback
      };

      // Helper function to map disliked lesson
      const mapDislikedLesson = (lesson) => {
        if (!lesson) return "none"; // Default
        const l = lesson.toLowerCase();
        // Expected: ["area", "circle theory", "decimals", "fractions", "geometry", "none", 
        //           "percentages", "probability", "roman numbers", "set theory", 
        //           "simultaneous equations", "triangle theory", "triangles", "volume and capacity"]
        
        if (l.includes("area")) return "area";
        if (l.includes("circle")) return "circle theory";
        if (l.includes("decimal")) return "decimals";
        if (l.includes("fraction")) return "fractions";
        if (l.includes("geometry")) return "geometry";
        if (l.includes("percentage")) return "percentages";
        if (l.includes("probability")) return "probability";
        if (l.includes("roman")) return "roman numbers";
        if (l.includes("set")) return "set theory";
        if (l.includes("simultaneous") || l.includes("equation")) return "simultaneous equations";
        if (l.includes("triangle")) {
          if (l.includes("theory")) return "triangle theory";
          return "triangles";
        }
        if (l.includes("volume") || l.includes("capacity")) return "volume and capacity";
        if (l.includes("none") || l.includes("nothing")) return "none";
        
        return "none"; // Default fallback
      };

      // Map profile data to the format expected by the Flask lesson prediction model
      const mappedData = {
        "Male/Female": mapGender(profileData.Gender),
        "number sequences marks": profileData.numberSequencesMarks?.slice(-1)[0] || 0,
        "number sequences time(s)": parseInt(profileData.numberSequencesTime) || 0,
        "perimeter marks": profileData.perimeterMarks?.slice(-1)[0] || 0,
        "perimeter time(s)": parseInt(profileData.perimeterTime) || 0,
        "ratio marks": profileData.ratioMarks?.slice(-1)[0] || 0,
        "ratio time(s)": parseInt(profileData.ratioTime) || 0,
        "fractions/decimals marks": profileData.fractionsDecimalsMarks?.slice(-1)[0] || 0,
        "fractions/decimals time(s)": parseInt(profileData.fractionsDecimalsTime) || 0,
        "indices marks": profileData.indicesMarks?.slice(-1)[0] || 0,
        "indices time(s)": parseInt(profileData.indicesTime) || 0,
        "algebra marks": profileData.algebraMarks?.slice(-1)[0] || 0,
        "algebra time(s)": parseInt(profileData.algebraTime) || 0,
        "angles marks": profileData.anglesMarks?.slice(-1)[0] || 0,
        "angles time(s)": parseInt(profileData.anglesTime) || 0,
        "volume and capacity marks": profileData.volumeCapacityMarks?.slice(-1)[0] || 0,
        "volume and capacity time(s)": parseInt(profileData.volumeCapacityTime) || 0,
        "area marks": profileData.areaMarks?.slice(-1)[0] || 0,
        "area time(s)": parseInt(profileData.areaTime) || 0,
        "probability marks": profileData.probabilityMarks?.slice(-1)[0] || 0,
        "probability time(s)": parseInt(profileData.probabilityTime) || 0,
        "Preferred Study Method": mapStudyMethod(profileData.preferredStudyMethod),
        "Disliked lesson": mapDislikedLesson(profileData.dislikedLesson)
      };

      // ADD DETAILED LOGGING
      console.log("🔍 Original Profile Data:", {
        Gender: profileData.Gender,
        preferredStudyMethod: profileData.preferredStudyMethod,
        dislikedLesson: profileData.dislikedLesson
      });
      
      console.log("🔍 Mapped Values:", {
        "Male/Female": mappedData["Male/Female"],
        "Preferred Study Method": mappedData["Preferred Study Method"],
        "Disliked lesson": mappedData["Disliked lesson"]
      });
      
      console.log("🔍 Full Mapped Data being sent to Flask:", mappedData);
      
      // Check for any undefined/null values
      Object.keys(mappedData).forEach(key => {
        if (mappedData[key] === undefined || mappedData[key] === null || mappedData[key] === "") {
          console.warn(`⚠️ WARNING: ${key} is ${mappedData[key]}`);
        }
      });

      // Make prediction request to your Flask API
      const response = await axios.post(config.api.getUrl('LESSON_PREDICTION_API', '/predict'), mappedData);
      const data = response.data;

      console.log("🔍 FULL Flask Response:", JSON.stringify(data, null, 2));
      console.log("🔍 Response Keys:", Object.keys(data));
      console.log("🔍 Looking for 'Top 5 Predicted Lessons':", data["Top 5 Predicted Lessons"]);

      if (data["Top 5 Predicted Lessons"] && Array.isArray(data["Top 5 Predicted Lessons"])) {
        console.log("✅ Setting lesson predictions:", data["Top 5 Predicted Lessons"]);
        setLessonPredictions(data["Top 5 Predicted Lessons"]);
        setFreshLessonPredictions(data["Top 5 Predicted Lessons"]);
        
        // Save predictions to backend
        if (profileData.email) {
          console.log("💾 Saving predictions to backend for:", profileData.email);
          await axios.post(config.api.getUrl('MAIN_API', '/api/lesson/save'), {
            email: profileData.email,
            preferences: data["Top 5 Predicted Lessons"],
          });
          console.log("✅ Predictions saved successfully");
        }
      } else {
        console.error("❌ No valid predictions array found in response");
        console.error("❌ Full response structure:", data);
        
        // Show the actual error from Flask if it exists
        if (data.error) {
          setSnackbarMessage("Flask ML Error: " + data.error);
        } else {
          setSnackbarMessage("No valid predictions found in API response");
        }
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("❌ Error making lesson prediction:", error);
      console.error("❌ Error response:", error.response?.data);
      
      // Show more specific error message
      let errorMessage = "Error making lesson prediction: ";
      if (error.response?.data?.error) {
        errorMessage += error.response.data.error;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += "Unknown error occurred";
      }
      
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Add a refresh function that can be called to reload the data
  const refreshProfileData = async () => {
    setLoading(true);
    
    try {
      // Fetch latest user data from API
      const profileData = await fetchUserProfile();
      if (!profileData) return;
      
      setUser(profileData);
      // Update form data with the latest values
      setFormData({
        name: profileData.name,
        age: profileData.age,
        phoneNum: profileData.phoneNum,
        Gender: profileData.Gender,
        preferredStudyMethod: profileData.preferredStudyMethod,
        dislikedLesson: profileData.dislikedLesson,
      });

      // Always get stress level and cognitive performance from API
      if (profileData.stressLevel) {
        setStressLevel(profileData.stressLevel);
      } else {
        // Set default if not available from API
        setStressLevel("Medium");
      }

      if (profileData.stressProbability !== undefined) {
        setStressProbability(profileData.stressProbability);
      }

      if (profileData.cognitivePerformance) {
        setCognitivePerformance(profileData.cognitivePerformance);
      } else {
        // Set default if not available from API
        setCognitivePerformance("Average");
      }

      const email = profileData.email;

      // Get the latest content preference (which includes the prediction)
      try {
        const contentPreferenceResponse = await axios.get(
          `${config.api.getUrl('MAIN_API', '/api/content')}?email=${email}`
        );
        setContentPreference(contentPreferenceResponse.data);
        
        // If there's a contentPreference, update the prediction
        if (contentPreferenceResponse.data && contentPreferenceResponse.data.preferences) {
          setPrediction(contentPreferenceResponse.data.preferences);
        }
      } catch (err) {
        console.log("Content preference not found");
      }

      // Refresh lesson preferences
      try {
        const lessonPreferenceResponse = await axios.get(
          `${config.api.getUrl('MAIN_API', '/api/lesson')}?email=${email}`
        );
        setLessonPreference(lessonPreferenceResponse.data);
      } catch (err) {
        console.log("Lesson preference not found");
      }

      // Refresh peer preferences
      try {
        const peerPreferenceResponse = await axios.get(
          `${config.api.getUrl('MAIN_API', '/api/peer')}?email=${email}`
        );
        setPeerPreference(peerPreferenceResponse.data);
      } catch (err) {
        console.log("Peer preference not found");
      }
    } catch (error) {
      console.error("Error refreshing profile data:", error);
      setSnackbarMessage("Failed to refresh profile data");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Check for updates when component mounts or when returning to this page
  useEffect(() => {
    const checkForUpdates = async () => {
      const lastPrediction = localStorage.getItem("lastPrediction");
      if (lastPrediction) {
        // If there's a lastPrediction in localStorage, refresh the profile data
        await refreshProfileData();
        // Clear the lastPrediction to avoid unnecessary refreshes
        localStorage.removeItem("lastPrediction");
      }
    };
    
    checkForUpdates();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileData = await fetchUserProfile();
        if (!profileData) return;
        
        setUser(profileData);
        setFormData({
          name: profileData.name,
          age: profileData.age,
          phoneNum: profileData.phoneNum,
          Gender: profileData.Gender,
          preferredStudyMethod: profileData.preferredStudyMethod,
          dislikedLesson: profileData.dislikedLesson,
        });

        // Always get cognitive performance from API, set default if not available
        const cogValue = profileData.cognitivePerformance || "Average";
        setCognitivePerformance(cogValue);

        // Always get stress data from API, set defaults if not available
        const dbStressLevel = profileData.stressLevel || "Medium";
        const dbStressProbability = profileData.stressProbability;
        
        setStressLevel(dbStressLevel);
        
        if (dbStressProbability !== undefined && dbStressProbability !== null) {
          setStressProbability(dbStressProbability);
        }

        console.log("Stress data loaded from API:", {
          stressLevel: dbStressLevel,
          stressProbability: dbStressProbability,
          cognitivePerformance: cogValue
        });

        const email = profileData.email;

        // Fetch existing preferences
        try {
          const contentPreferenceResponse = await axios.get(
            `${config.api.getUrl('MAIN_API', '/api/content')}?email=${email}`
          );
          setContentPreference(contentPreferenceResponse.data);
          
          // If there's a contentPreference, check if it has a prediction and update the local state
          if (contentPreferenceResponse.data && contentPreferenceResponse.data.preferences) {
            setPrediction(contentPreferenceResponse.data.preferences);
          }
        } catch (err) {
          console.log("Content preference not found");
        }

        try {
          const lessonPreferenceResponse = await axios.get(
            `${config.api.getUrl('MAIN_API', '/api/lesson')}?email=${email}`
          );
          setLessonPreference(lessonPreferenceResponse.data);
        } catch (err) {
          console.log("Lesson preference not found");
        }

        try {
          const peerPreferenceResponse = await axios.get(
            `${config.api.getUrl('MAIN_API', '/api/peer')}?email=${email}`
          );
          setPeerPreference(peerPreferenceResponse.data);
        } catch (err) {
          console.log("Peer preference not found");
        }

        // Make new predictions if applicable
        if (profileData) {
          await handleLessonPrediction(profileData);
          await handlePeerPrediction(profileData);
        }
      } catch (err) {
        console.error("Error fetching data", err);
        setSnackbarMessage("Failed to fetch data: " + (err.response?.data?.message || err.message));
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    };

    fetchData();
  }, [navigate]);
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSelectChange = (field, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const res = await axios.put(
        config.api.getUrl('MAIN_API', '/api/auth/updateProfile'),
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSnackbarMessage("Profile updated successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setUser(res.data.user);
    } catch (err) {
      console.error("Error updating profile", err);
      setSnackbarMessage("Failed to update profile");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleCognitivePerformanceChange = async (value) => {
    setCognitivePerformance(value);
    
    try {
      // Update in API instead of localStorage
      await updateUserPerformanceData({ cognitivePerformance: value });
      
      setSnackbarMessage("Cognitive performance updated successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error updating cognitive performance:", error);
      setSnackbarMessage("Failed to update cognitive performance");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleStressLevelChange = async (selectedStressLevel) => {
    setStressLevel(selectedStressLevel);
    
    setLoading(true);

    try {
      // Update stress level in API first
      await updateUserPerformanceData({ stressLevel: selectedStressLevel });

      // Fetch fresh profile data from API for predictions
      const profileData = await fetchUserProfile();
      if (!profileData) return;

      const marksFields = [
        "numberSequencesMarks",
        "perimeterMarks",
        "ratioMarks",
        "fractionsDecimalsMarks",
        "indicesMarks",
        "algebraMarks",
        "anglesMarks",
        "volumeCapacityMarks",
        "areaMarks",
        "probabilityMarks",
      ];

      const processedData = {};
      marksFields.forEach((field) => {
        const marksArray = profileData[field];
        const lastMark = marksArray && marksArray.length > 0 ? marksArray[marksArray.length - 1] : 0;
        processedData[field.replace(/([A-Z])/g, " $1").toLowerCase()] = lastMark;
      });

      processedData.stress_level = selectedStressLevel;
      processedData.cognitive_performance = cognitivePerformance;

      const response = await axios.post(config.api.getUrl('STRESS_API', '/predict'), processedData);
      const predictedLesson = response.data.predicted_lesson;
      setPrediction(predictedLesson);

      if (profileData?.email) {
        await axios.post(config.api.getUrl('MAIN_API', '/api/content/save'), {
          email: profileData.email,
          preferences: predictedLesson,
          stressLevel: selectedStressLevel,
          cognitive: cognitivePerformance,
        });
      }

      setSnackbarMessage("Stress level updated and predictions refreshed!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage("Error updating stress level or making prediction. Please try again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePeerPrediction = async (profileData) => {
    setLoading(true);
    try {
      const marksFields = [
        "numberSequencesMarks",
        "ratioMarks",
        "perimeterMarks",
        "fractionsDecimalsMarks",
        "indicesMarks",
        "algebraMarks",
        "anglesMarks",
        "volumeCapacityMarks",
        "areaMarks",
        "probabilityMarks",
      ];

      const processedData = {};
      marksFields.forEach((field) => {
        const marksArray = profileData[field];
        const lastMark = marksArray && marksArray.length > 0 ? marksArray[marksArray.length - 1] : 0;
        const mappedField =
          field === "fractionsDecimalsMarks" ? "fractions/decimals marks" :
          field === "volumeCapacityMarks" ? "volume and capacity marks" :
          field.replace(/([A-Z])/g, " $1").toLowerCase();
        processedData[mappedField] = lastMark;
      });

      Object.keys(timeFieldMapping).forEach((profileField) => {
        const flaskField = timeFieldMapping[profileField];
        const timeValue = profileData[profileField];
        processedData[flaskField] = parseInt(timeValue) || 0;
      });

      processedData["Age"] = parseInt(profileData.age) || 0;
      processedData["Male/Female"] = profileData.Gender;
      processedData["Preferred Study Method"] = profileData.preferredStudyMethod;

      const mlEndpoint = config.api.getUrl('PEER_PREDICTION_API', '/predict');
      console.log("Using ML endpoint:", mlEndpoint);
    
      let predictedClass;
      let usedFallback = false;
    
      try {
        const response = await axios.post(mlEndpoint, processedData);
        predictedClass = response.data["Predicted Class"];
      } catch (mlError) {
        console.error("ML service error:", mlError);
        usedFallback = true;
        
        if (profileData.email) {
          try {
            const fallbackResponse = await axios.get(
              `${config.api.getUrl('MAIN_API', '/api/peer')}?email=${profileData.email}`
            );
            
            if (fallbackResponse.data && fallbackResponse.data.preferences) {
              predictedClass = fallbackResponse.data.preferences;
              console.log("Using fallback prediction:", predictedClass);
            } else {
              throw new Error("No existing prediction available");
            }
          } catch (fallbackError) {
            console.error("Fallback retrieval failed:", fallbackError);
            throw new Error("Both ML service and fallback failed");
          }
        }
      }

    if (predictedClass) {
      setPeerPrediction(predictedClass);
      
      if (!usedFallback && profileData.email) {
        await axios.post(
          `${config.api.getUrl('MAIN_API', '/api/peer/save')}`, 
          {
            email: profileData.email,
            preferences: predictedClass,
          }
        );
      }
    } else {
      throw new Error("Could not determine peer prediction");
    }
    } catch (error) {
      setSnackbarMessage("Error making peer prediction. Please try again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const genderOptions = ["M", "F"];
  const studyMethodOptions = ["figures", "Only school lessons", "practicing"];
  const dislikedLessonOptions = [
    "circle theory",
    "decimals",
    "fractions",
    "geometry",
    "none",
    "percentages",
    "probability",
    "roman numbers",
    "area",
    "set theory",
    "simaltaneous equations",
    "triangle theory",
    "triangles",
    "volume and capacity",
  ];  
  const cognitivePerformanceOptions = ["Low", "Average", "High", "Very High"];

  // Display logic - prioritize fresh predictions over database ones
  const displayLessonPreferences = freshLessonPredictions.length > 0 
    ? freshLessonPredictions.map((pref, index) => ({ ...pref, rank: index + 1 }))
    : (lessonPreference 
        ? lessonPreference.preferences
            .sort((a, b) => b.probability - a.probability)
            .slice(0, 5)
            .map((pref, index) => ({ ...pref, rank: index + 1 }))
        : []);

  // Debug logging
  console.log("🔍 DISPLAY DEBUG:");
  console.log("  - freshLessonPredictions:", freshLessonPredictions);
  console.log("  - lessonPreference:", lessonPreference);
  console.log("  - displayLessonPreferences:", displayLessonPreferences);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">Student Profile</h1>
          <p className="text-blue-600">Manage your profile and view AI-powered predictions</p>
        </div>

        {/* Alert */}
        {snackbarOpen && (
          <Alert className={`mb-6 ${snackbarSeverity === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            {snackbarSeverity === 'success' ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
            <AlertDescription className={snackbarSeverity === 'success' ? 'text-green-800' : 'text-red-800'}>
              {snackbarMessage}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side: Profile Form */}
          <div className="space-y-6">
            <Card className="backdrop-blur-sm bg-white/80 border-blue-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Update Profile
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Update your personal information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {user ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-blue-900 font-medium">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="border-blue-200 focus:border-blue-400"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="age" className="text-blue-900 font-medium">Age</Label>
                        <Input
                          id="age"
                          name="age"
                          value={formData.age}
                          onChange={handleChange}
                          required
                          className="border-blue-200 focus:border-blue-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender" className="text-blue-900 font-medium">Gender</Label>
                        <Select value={formData.Gender} onValueChange={(value) => handleSelectChange('Gender', value)}>
                          <SelectTrigger className="border-blue-200 focus:border-blue-400">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            {genderOptions.map((option) => (
                              <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-blue-900 font-medium">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phoneNum"
                        value={formData.phoneNum}
                        onChange={handleChange}
                        required
                        className="border-blue-200 focus:border-blue-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="studyMethod" className="text-blue-900 font-medium">Preferred Study Method</Label>
                      <Select value={formData.preferredStudyMethod} onValueChange={(value) => handleSelectChange('preferredStudyMethod', value)}>
                        <SelectTrigger className="border-blue-200 focus:border-blue-400">
                          <SelectValue placeholder="Select study method" />
                        </SelectTrigger>
                        <SelectContent>
                          {studyMethodOptions.map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dislikedLesson" className="text-blue-900 font-medium">Disliked Lesson</Label>
                      <Select value={formData.dislikedLesson} onValueChange={(value) => handleSelectChange('dislikedLesson', value)}>
                        <SelectTrigger className="border-blue-200 focus:border-blue-400">
                          <SelectValue placeholder="Select disliked lesson" />
                        </SelectTrigger>
                        <SelectContent>
                          {dislikedLessonOptions.map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-4">
                      <Button 
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Update Profile
                      </Button>
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => navigate("/lesson")}
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        Lesson Prediction
                      </Button>
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => navigate("/")}
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        Back to Home
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lesson Predictions - Left Side */}
            {displayLessonPreferences.length > 0 && (
              <Card className="backdrop-blur-sm bg-white/80 border-blue-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Lesson Preferences (Top 5)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <div className="min-w-full">
                      <div className="grid grid-cols-3 gap-4 p-3 bg-blue-50 rounded-t-lg border-b border-blue-200">
                        <div className="font-semibold text-blue-900">Rank</div>
                        <div className="font-semibold text-blue-900">Lesson</div>
                        <div className="font-semibold text-blue-900">Probability</div>
                      </div>
                      <div className="space-y-2">
                        {displayLessonPreferences.map((pref, index) => (
                          <div key={index} className="grid grid-cols-3 gap-4 p-3 border-b border-blue-100 hover:bg-blue-50/50 transition-colors">
                            <div>
                              <Badge variant="outline" className="border-blue-300 text-blue-700">
                                #{pref.rank}
                              </Badge>
                            </div>
                            <div className="font-medium text-blue-900">{pref.lesson}</div>
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-blue-100 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                    style={{ width: `${(typeof pref.probability === 'number' ? pref.probability * 100 : parseFloat(pref.probability) || 0)}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-blue-700">
                                  {typeof pref.probability === 'number' 
                                    ? (pref.probability * 100).toFixed(1) + '%'
                                    : pref.probability}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Peer Prediction - Left Side */}
            {/* {peerPrediction && (
              <Card className="backdrop-blur-sm bg-gradient-to-r from-orange-100 to-orange-200 border-orange-300 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-orange-700" />
                    <div>
                      <h3 className="font-semibold text-orange-900">Predicted Peer Class</h3>
                      <p className="text-2xl font-bold text-orange-800">{peerPrediction}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )} */}
          </div>

          {/* Right Side: Preferences Display */}
          <div className="space-y-6">
            {/* Content Preference - Updated to include performance data */}
            <Card className="backdrop-blur-sm bg-white/80 border-blue-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Performance & Content Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Content Preference */}
                  {contentPreference && (
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium text-blue-900">Content Preferences</span>
                      <Badge className="bg-blue-600 text-white">{contentPreference.preferences}</Badge>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium text-blue-900">Cognitive Performance</span>
                    <Badge className="bg-blue-600 text-white">{cognitivePerformance}</Badge>
                  </div>

                  {/* Stress Level - Read Only Display */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium text-blue-900">Stress Level</span>
                      <Badge className="bg-blue-600 text-white">{stressLevel}</Badge>
                    </div>
                    {stressProbability !== null && (
                      <p className="text-sm text-blue-600 ml-3">Stress Probability: {(stressProbability * 100).toFixed(1)}%</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Peer Preference */}
            {peerPreference && (
              <Card className="backdrop-blur-sm bg-white/80 border-blue-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Peer Preference
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                    <span className="font-medium text-purple-900">Class Index</span>
                    <Badge className="bg-purple-600 text-white text-lg px-4 py-2">
                      Index No. {peerPreference.preferences}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Loading Indicator */}
            {loading && (
              <Card className="backdrop-blur-sm bg-white/80 border-blue-200 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center space-x-3">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="text-blue-700">Processing predictions...</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;