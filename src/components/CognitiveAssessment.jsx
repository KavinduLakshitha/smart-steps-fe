import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { submitCognitiveData } from '../services/api';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

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
        
        // Handle unauthorized errors
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
        gameEx: formData.gameEx,
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

  if (loading && !user) {
    return (
      <div className="container max-w-4xl mx-auto px-4">
        <div className="flex justify-center items-center h-[80vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-lg">Loading user data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4">
      <div className="my-10 text-center">
        <h1 className="text-4xl font-bold mb-4">Cognitive Assessment</h1>
        {user && (
          <p className="text-muted-foreground">
            Logged in as: <strong>{user.email || user.username}</strong>
          </p>
        )}
      </div>
      
      {/* Game Completion Progress */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Assessment Progress</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm mb-2">Speed Match</p>
            <Progress value={formData.speedMatchPoints ? 100 : 0} className="h-2" />
          </div>
          <div className="text-center">
            <p className="text-sm mb-2">Memory Matrix</p>
            <Progress value={formData.memoryMatrixPoints ? 100 : 0} className="h-2" />
          </div>
          <div className="text-center">
            <p className="text-sm mb-2">Rain Drops</p>
            <Progress value={formData.rainDropsScore ? 100 : 0} className="h-2" />
          </div>
        </div>
      </div>
      
      {/* Instructions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>How to Complete Your Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2">
            <li>Your age and gender are automatically loaded from your profile</li>
            <li>Fill in your sleep hours and gaming experience</li>
            <li>Play each of the three cognitive games by clicking the "Play" buttons</li>
            <li>Your game scores will automatically be loaded into the form</li>
            <li>Click "Submit Assessment" to view personalized recommendations</li>
          </ol>
        </CardContent>
      </Card>
      
      <Card className="mb-10">
        <CardHeader>
          <CardTitle>Assessment Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      name="age"
                      type="number"
                      value={formData.age}
                      onChange={handleChange}
                      required
                      min="1"
                      readOnly
                      className="read-only:bg-muted read-only:text-muted-foreground"
                    />
                    <p className="text-xs text-muted-foreground">Age is loaded from your profile</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sleep_hours">Sleep Hours</Label>
                    <Input
                      id="sleep_hours"
                      name="sleep_hours"
                      type="number"
                      value={formData.sleep_hours}
                      onChange={handleChange}
                      required
                      min="0"
                      max="24"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      name="gender"
                      value={formData.gender}
                      onValueChange={(value) => setFormData({...formData, gender: value})}
                      disabled
                    >
                      <SelectTrigger className="disabled:bg-muted disabled:text-muted-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Female</SelectItem>
                        <SelectItem value="0">Male</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Gender is loaded from your profile</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gameEx">Previous Gaming Experience</Label>
                    <Select
                      name="gameEx"
                      value={formData.gameEx}
                      onValueChange={(value) => setFormData({...formData, gameEx: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Yes</SelectItem>
                        <SelectItem value="0">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Game section with cards */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Cognitive Games</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Speed Match Game */}
                  <Card className="flex flex-col">
                    <CardHeader>
                      <CardTitle>Speed Match</CardTitle>
                      <CardDescription>
                        Test your processing speed by matching shapes quickly.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="speedMatchCards">Cards</Label>
                          <Input
                            id="speedMatchCards"
                            name="speedMatchCards"
                            type="number"
                            value={formData.speedMatchCards}
                            onChange={handleChange}
                            required
                            min="0"
                            disabled
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="speedMatchPoints">Points</Label>
                          <Input
                            id="speedMatchPoints"
                            name="speedMatchPoints"
                            type="number"
                            value={formData.speedMatchPoints}
                            onChange={handleChange}
                            required
                            min="0"
                            disabled
                          />
                        </div>
                      </div>
                      <Button 
                        variant={formData.speedMatchPoints ? "outline" : "default"}
                        onClick={() => navigate("/speed-match")}
                        className="w-full mt-4"
                        type="button"
                      >
                        {formData.speedMatchPoints ? "Play Again" : "Play Game"}
                      </Button>
                    </CardContent>
                  </Card>
                  
                  {/* Memory Matrix Game */}
                  <Card className="flex flex-col">
                    <CardHeader>
                      <CardTitle>Memory Matrix</CardTitle>
                      <CardDescription>
                        Test your visual memory by recalling patterns of tiles.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="memoryMatrixPoints">Points</Label>
                          <Input
                            id="memoryMatrixPoints"
                            name="memoryMatrixPoints"
                            type="number"
                            value={formData.memoryMatrixPoints}
                            onChange={handleChange}
                            required
                            min="0"
                            disabled
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="timeMemoryMatrix">Time (minutes)</Label>
                          <Input
                            id="timeMemoryMatrix"
                            name="timeMemoryMatrix"
                            type="number"
                            step="0.01"
                            value={formData.timeMemoryMatrix}
                            onChange={handleChange}
                            required
                            min="0"
                            disabled
                          />
                        </div>
                      </div>
                      <Button 
                        variant={formData.memoryMatrixPoints ? "outline" : "default"}
                        onClick={() => navigate("/memory-matrix")}
                        className="w-full mt-4"
                        type="button"
                      >
                        {formData.memoryMatrixPoints ? "Play Again" : "Play Game"}
                      </Button>
                    </CardContent>
                  </Card>
                  
                  {/* Rain Drops Game */}
                  <Card className="flex flex-col">
                    <CardHeader>
                      <CardTitle>Rain Drops</CardTitle>
                      <CardDescription>
                        Test your math skills by solving equations in falling raindrops.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="rainDropsScore">Score</Label>
                          <Input
                            id="rainDropsScore"
                            name="rainDropsScore"
                            type="number"
                            value={formData.rainDropsScore}
                            onChange={handleChange}
                            required
                            min="0"
                            disabled
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="timeRainDrops">Time (minutes)</Label>
                          <Input
                            id="timeRainDrops"
                            name="timeRainDrops"
                            type="number"
                            step="0.01"
                            value={formData.timeRainDrops}
                            onChange={handleChange}
                            required
                            min="0"
                            disabled
                          />
                        </div>
                      </div>
                      <Button 
                        variant={formData.rainDropsScore ? "outline" : "default"}
                        onClick={() => navigate("/rain-drops")}
                        className="w-full mt-4"
                        type="button"
                      >
                        {formData.rainDropsScore ? "Play Again" : "Play Game"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <div className="mt-8">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading || !formData.speedMatchPoints || !formData.memoryMatrixPoints || !formData.rainDropsScore}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Submit Assessment"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CognitiveAssessment;