import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import config from '../config';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, Play, ArrowRight } from "lucide-react";

const StressDetection = () => {
  const navigate = useNavigate();
  const [videoFile, setVideoFile] = useState(null);
  const [showVideo, setShowVideo] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [probability, setProbability] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [showProceedButton, setShowProceedButton] = useState(false);
  const [savingToDatabase, setSavingToDatabase] = useState(false);
  const videoRef = useRef(null);
  
  // Get user email from JWT token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        // If your JWT contains email directly, use it
        // If it contains user ID, you might need to make an API call to get email
        // For now, let's assume you store email in localStorage or get it from the token
        const email = localStorage.getItem("userEmail"); // or decodedToken.email if available
        if (email) {
          setUserEmail(email);
        } else {
          // If email not in localStorage, you might need to fetch user profile
          console.warn("User email not found in localStorage");
        }
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);
  
  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setVideoFile(file);
      setShowVideo(true);
      setError("");
      setResult("");
      setShowProceedButton(false);
      
      // Create a URL for the video preview
      const videoURL = URL.createObjectURL(file);
      if (videoRef.current) {
        videoRef.current.src = videoURL;
      }
    }
  };

  // Function to save stress data to database
  const saveStressDataToDatabase = async (stressLevel, stressProbability, recommendations) => {
    try {
      setSavingToDatabase(true);
      console.log(`Saving stress data to database for user: ${userEmail}`);
      
      const mainApiUrl = config.api.getUrl('MAIN_API', '/api/stress-predictions');
      
      const response = await fetch(mainApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          stressLevel: stressLevel,
          probability: stressProbability,
          recommendations: recommendations
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log("✅ Successfully saved stress data to database:", data);
        return { success: true, data };
      } else {
        console.error("❌ Failed to save stress data to database:", data);
        return { success: false, error: data.message || "Failed to save to database" };
      }
    } catch (error) {
      console.error("❌ Error saving stress data to database:", error);
      return { success: false, error: error.message };
    } finally {
      setSavingToDatabase(false);
    }
  };
  
  // Handle video analysis
  const handleAnalyzeVideo = async () => {
    if (!videoFile) {
      setError("Please upload a video first");
      return;
    }
    
    if (!userEmail) {
      setError("User email not found. Please log in again.");
      return;
    }
    
    setAnalyzing(true);
    setResult("Analyzing video...");
    setError("");
    
    try {
      // Create form data to send the video file
      const formData = new FormData();
      formData.append("video", videoFile);
      formData.append("email", userEmail);
      
      console.log(`Analyzing video for user: ${userEmail}`);
      
      // Use config to get the API URL
      const apiUrl = config.api.getUrl('STRESS_API', '/upload');
      
      // Make API call to backend
      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const stressLevel = data.stress_level;
        const stressProbability = data.probability;
        const recommendations = data.recommendations;
        
        setResult(`Analysis complete! Detected stress level: ${stressLevel}`);
        setProbability(stressProbability);
        
        // Save stress level and probability to localStorage for other components
        localStorage.setItem("stressLevel", stressLevel);
        localStorage.setItem("stressProbability", stressProbability.toString());
        
        // Save to database
        const saveResult = await saveStressDataToDatabase(stressLevel, stressProbability, recommendations);
        
        if (!saveResult.success) {
          // Show warning but don't prevent user from proceeding
          console.warn("Database save failed but analysis succeeded:", saveResult.error);
          setError(`Analysis complete, but failed to save to database: ${saveResult.error}. You can still proceed.`);
        }
        
        // Show proceed button after analysis (regardless of database save result)
        setShowProceedButton(true);
      } else {
        setError(data.error || "Failed to analyze video. Please try again.");
        setResult("");
      }
    } catch (err) {
      console.error("Error analyzing video:", err);
      setError("An error occurred while analyzing the video. Please try again.");
      setResult("");
    } finally {
      setAnalyzing(false);
    }
  };
  
  // Handle proceeding to songs page
  const handleProceedToSongs = () => {
    navigate("/songs");
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.src) {
        URL.revokeObjectURL(videoRef.current.src);
      }
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Stress Detection System
        </h1>
        <p className="text-xl text-gray-600 mb-4">
          Upload a video and analyze stress levels through facial expressions
        </p>
        {userEmail && (
          <p className="text-sm text-gray-500">
            Analyzing for: {userEmail}
          </p>
        )}
      </div>
      
      {/* Main Analysis Card */}
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Upload Video for Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Select Video File
            </label>
            <div className="relative">
              <Input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <Upload className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
            </div>
          </div>
          
          {/* Analyze Button */}
          <Button 
            onClick={handleAnalyzeVideo}
            disabled={analyzing || !videoFile || !userEmail || savingToDatabase}
            className="w-full text-lg py-6"
            size="lg"
          >
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyzing...
              </>
            ) : savingToDatabase ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving to Database...
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" />
                Analyze Video
              </>
            )}
          </Button>
          
          {/* Warning for no user email */}
          {!userEmail && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertDescription className="text-amber-800">
                Please log in to analyze your stress level
              </AlertDescription>
            </Alert>
          )}
          
          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Result Display */}
          {result && (
            <div className="text-center space-y-2">
              <p className={`text-lg font-medium ${
                result.includes("complete") 
                  ? "text-green-600" 
                  : "text-blue-600"
              }`}>
                {result}
              </p>
              {probability !== null && (
                <p className="text-sm text-gray-600">
                  Probability: {probability.toFixed(2)}
                </p>
              )}
              {savingToDatabase && (
                <p className="text-sm text-blue-600">
                  Saving stress data to your profile...
                </p>
              )}
            </div>
          )}
          
          {/* Video Preview */}
          {showVideo && (
            <div className="space-y-4">
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-center mb-4">
                  Uploaded Video Preview
                </h3>
                <div className="flex justify-center">
                  <video 
                    ref={videoRef}
                    controls 
                    className="w-full max-w-md rounded-lg shadow-md"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Proceed Button */}
          {showProceedButton && (
            <div className="text-center pt-4 border-t">
              <Button
                onClick={handleProceedToSongs}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                disabled={savingToDatabase}
              >
                Proceed to Song Recommendations
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* How It Works Card */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle>How it works:</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-sm font-medium rounded-full mr-3 mt-0.5">1</span>
              Upload a short video of yourself (10-30 seconds)
            </li>
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-sm font-medium rounded-full mr-3 mt-0.5">2</span>
              Our AI analyzes your facial expressions to detect stress indicators
            </li>
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-sm font-medium rounded-full mr-3 mt-0.5">3</span>
              Receive a stress level assessment and save to your profile
            </li>
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-sm font-medium rounded-full mr-3 mt-0.5">4</span>
              Get personalized song recommendations based on your stress level
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default StressDetection;