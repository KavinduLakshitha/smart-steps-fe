import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import config from '../config';
import axios from "axios";
import { useUser } from "../contexts/UserContext";

const CognitiveResults = () => {
  const { user, getUserId } = useUser();
  const navigate = useNavigate();
  const [mathScore, setMathScore] = useState(0);
  const [memoryScore, setMemoryScore] = useState(0);
  const [speedScore, setSpeedScore] = useState(0);
  const [userId, setUserId] = useState("");
  const [cognitiveLevel, setCognitiveLevel] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  
  // Maximum possible score for normalization
  const maxScoreValue = config.cognitive.maxScoreValue;

  const ensureScoreInAssessmentResult = () => {
    try {
      // Get math score from RainDrops game
      const rainDropsScore = localStorage.getItem('Rain_drops_score');
      
      // Get the assessment result
      const assessmentResultString = localStorage.getItem('assessmentResult');
      
      if (assessmentResultString && rainDropsScore) {
        // Parse the assessment result
        const assessmentResult = JSON.parse(assessmentResultString);
        
        // Check if p_M is missing or 0
        if (!assessmentResult.p_M || assessmentResult.p_M === '0') {
          // Add the math score to the assessment result
          assessmentResult.p_M = rainDropsScore;
          
          // Save the updated assessment result
          localStorage.setItem('assessmentResult', JSON.stringify(assessmentResult));
          console.log('Added math score to assessmentResult:', rainDropsScore);
        }
      }
    } catch (error) {
      console.error('Error ensuring score in assessment result:', error);
    }
  };
  
  useEffect(() => {
    setUserId(getUserId());
    ensureScoreInAssessmentResult();
    // Get assessment result from localStorage
    const resultData = localStorage.getItem('assessmentResult');
    
    if (resultData) {
      try {
        const parsedData = JSON.parse(resultData);
        
        // Update state with backend data
        setCognitiveLevel(parsedData.cognitive_performance || "");
        setMathScore(parseInt(parsedData.p_M) || 0);
        setMemoryScore(parseInt(parsedData.person_memory) || 0);
        setSpeedScore(parseInt(parsedData.person_speed) || 0);
        
        // Update recommendations from backend - ensure it's an array
        if (parsedData.prediction) {
          // Handle if prediction is an array
          if (Array.isArray(parsedData.prediction)) {
            setRecommendations(parsedData.prediction);
          } 
          // Handle if prediction is a string - convert to array
          else if (typeof parsedData.prediction === 'string') {
            setRecommendations([parsedData.prediction]);
          }
          // If it's something else unexpected, set empty array
          else {
            setRecommendations([]);
          }
        }
      } catch (error) {
        console.error('Error parsing assessment result:', error);
        // Ensure we set a default empty array if parsing fails
        setRecommendations([]);
      }
    } else {
      // No result data found, ensure recommendations is an empty array
      setRecommendations([]);
    }    
    
  }, [getUserId]);  

  useEffect(() => {
    const clearGameData = () => {
      console.log("Clearing game data from localStorage after results have been displayed");
      setTimeout(() => {
        localStorage.removeItem("speed_match_score");
        localStorage.removeItem("speed_match_cards");
        localStorage.removeItem("memory_matrix_score");
        localStorage.removeItem("memory_matrix_time");
        localStorage.removeItem("Rain_drops_score");
        localStorage.removeItem("Rain_Drops_Time");
        console.log("Game data cleared from localStorage");
      }, 2000);
    };
    
    clearGameData();
    
  }, []);
  
  // Get color classes for progress bar based on score
  const getProgressColorClass = (score) => {
    const percentage = (score / maxScoreValue) * 100;
    if (percentage < 30) return "bg-red-500";
    if (percentage < 60) return "bg-orange-500";
    return "bg-green-500";
  };
  
  const handleReturnToAssessment = () => {
    navigate("/cognitive");
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Assessment Results
        </h1>
      </div>
      
      <Card className="mb-8 shadow-lg border-0">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              ID: {userId}
            </h2>
            <p className="text-gray-600 mb-4">
              Your assessment results have been processed. Based on your performance, we've created personalized recommendations.
            </p>
            {cognitiveLevel && (
              <div className="mt-4">
                <span className="text-lg font-medium text-blue-600">
                  Cognitive Level: <strong className="capitalize">{cognitiveLevel}</strong>
                </span>
              </div>
            )}
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-6 mt-8">
            Your Performance
          </h3>
          
          {/* Mathematics Progress */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-lg font-semibold text-gray-800">Mathematics</h4>
              <span className="text-lg font-bold text-gray-700">{mathScore}</span>
            </div>
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-5">
                <div 
                  className={`h-5 rounded-full transition-all duration-300 ${getProgressColorClass(mathScore)}`}
                  style={{ width: `${(mathScore / maxScoreValue) * 100}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Memory Progress */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-lg font-semibold text-gray-800">Memory</h4>
              <span className="text-lg font-bold text-gray-700">{memoryScore}</span>
            </div>
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-5">
                <div 
                  className={`h-5 rounded-full transition-all duration-300 ${getProgressColorClass(memoryScore)}`}
                  style={{ width: `${(memoryScore / maxScoreValue) * 100}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Speed Progress */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-lg font-semibold text-gray-800">Processing Speed</h4>
              <span className="text-lg font-bold text-gray-700">{speedScore}</span>
            </div>
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-5">
                <div 
                  className={`h-5 rounded-full transition-all duration-300 ${getProgressColorClass(speedScore)}`}
                  style={{ width: `${(speedScore / maxScoreValue) * 100}%` }}
                />
              </div>
            </div>
          </div>
          
          <Separator className="my-8" />
          
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Recommendations
          </h3>
          
          {recommendations.length > 0 ? (
            <ul className="space-y-3">
              {recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700 leading-relaxed">{recommendation}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">
              No specific recommendations available. Try taking the assessment again.
            </p>
          )}
          
          <div className="mt-8 flex justify-center">
            <Button 
              variant="outline"
              size="lg"
              onClick={handleReturnToAssessment}
              className="px-8 py-3"
            >
              Return to Assessment
            </Button>          
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg border-0">
        <CardContent className="p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            What These Results Mean:
          </h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Mathematics Score:</h4>
              <p className="text-gray-600 leading-relaxed">
                Measures your ability to process numerical information and solve math problems quickly. This is relevant for courses involving calculations, statistics, or logical reasoning.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Memory Score:</h4>
              <p className="text-gray-600 leading-relaxed">
                Reflects your ability to remember and recall visual patterns. This skill is important for courses that require memorization of facts, concepts, or procedures.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Processing Speed:</h4>
              <p className="text-gray-600 leading-relaxed">
                Indicates how quickly you can process information and make decisions. This is valuable for fast-paced courses or those requiring real-time problem solving.
              </p>
            </div>
            
            <div className="pt-2">
              <p className="text-gray-600 leading-relaxed">
                Based on these scores, we've curated a personalized set of courses that match your cognitive strengths and learning style. Continue to see your recommended educational content.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CognitiveResults;