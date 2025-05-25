import React, { useState, useEffect, useRef } from "react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const SpeedMatch = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [message, setMessage] = useState("Remember this shape!");
  const [totalMatches, setTotalMatches] = useState(0);
  const [correctMatches, setCorrectMatches] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  
  // Shape-related states
  const [previousShape, setPreviousShape] = useState(null);
  const [currentShape, setCurrentShape] = useState(null);
  
  const shapes = ["circle", "square", "triangle", "star"];
  const shapeColors = { 
    "circle": "red", 
    "square": "blue", 
    "triangle": "green", 
    "star": "yellow" 
  };
  
  // Get random shape function
  const getRandomShape = () => {
    return shapes[Math.floor(Math.random() * shapes.length)];
  };
  
  // Draw shape on canvas
  const drawShape = (shape) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = shapeColors[shape];
    
    if (shape === "circle") {
      ctx.beginPath();
      ctx.arc(200, 200, 50, 0, Math.PI * 2);
      ctx.fill();
    } else if (shape === "square") {
      ctx.fillRect(150, 150, 100, 100);
    } else if (shape === "triangle") {
      ctx.beginPath();
      ctx.moveTo(200, 100);
      ctx.lineTo(150, 250);
      ctx.lineTo(250, 250);
      ctx.closePath();
      ctx.fill();
    } else if (shape === "star") {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = Math.PI / 2 + i * (Math.PI * 2 / 5);
        const x = 200 + 50 * Math.cos(angle);
        const y = 200 - 50 * Math.sin(angle);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();
    }
  };
  
  // Handle match or no match button click
  const handleMatchCheck = (isMatch) => {
    setTotalMatches(prev => prev + 1);
    
    // Check if the answer is correct
    if ((previousShape === currentShape && isMatch) || 
        (previousShape !== currentShape && !isMatch)) {
      setScore(prev => prev + 400);
      setCorrectMatches(prev => prev + 1);
      setMessage("Correct! You got 400 points!");
    } else {
      setMessage("Wrong choice!");
    }
    
    // Change shape for next round
    setPreviousShape(currentShape);
    const newShape = getRandomShape();
    setCurrentShape(newShape);
    drawShape(newShape);
  };
  
  // Initialize game
  useEffect(() => {
    // Get random initial shape
    const initialShape = getRandomShape();
    setCurrentShape(initialShape);
    
    // Show first shape with "Remember this shape!"
    setTimeout(() => {
      if (canvasRef.current) {
        drawShape(initialShape);
      }
    }, 0);
    
    // Change to second shape after 1.5 seconds
    setTimeout(() => {
      setPreviousShape(initialShape);
      const secondShape = getRandomShape();
      setCurrentShape(secondShape);
      if (canvasRef.current) {
        drawShape(secondShape);
      }
      setMessage("Now make your choice!");
    }, 1500);
    
    // Start game timer
    const timerInterval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Clean up
    return () => clearInterval(timerInterval);
  }, []);
  
  // Save score to localStorage when game over
  useEffect(() => {
    if (gameOver) {
      localStorage.setItem("speed_match_score", score.toString());
      localStorage.setItem("speed_match_cards", totalMatches.toString());
    }
  }, [gameOver, score, totalMatches]);

  const handleNavigateToCognitive = () => {
    window.location.href = "/cognitive";
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Speed Match Game
          </h1>
          <p className="text-lg text-gray-600">Test your visual memory and reaction speed!</p>
        </div>
        
        <Card className="mb-8 shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold text-gray-800">
              {message}
            </CardTitle>
            <div className="flex justify-center gap-4 mt-4">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Score: {score}
              </Badge>
              <Badge variant={timeLeft <= 10 ? "destructive" : "default"} className="text-lg px-4 py-2">
                Time: {timeLeft}s
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="text-center">
            <div className="flex justify-center mb-6">
              <canvas 
                ref={canvasRef} 
                width={400} 
                height={400} 
                className="border-4 border-gray-300 rounded-xl bg-white shadow-inner"
              />
            </div>
            
            <div className="flex justify-center gap-4 mb-6">
              <Button 
                size="lg" 
                onClick={() => handleMatchCheck(true)}
                disabled={gameOver}
                className="px-8 py-3 text-lg font-semibold bg-green-600 hover:bg-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                Match
              </Button>
              <Button 
                size="lg" 
                variant="destructive"
                onClick={() => handleMatchCheck(false)}
                disabled={gameOver}
                className="px-8 py-3 text-lg font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                No Match
              </Button>
            </div>
            
            {gameOver && (
              <Card className="mt-6 bg-gradient-to-r from-purple-100 to-blue-100 border-purple-200">
                <CardContent className="pt-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Game Over! 🎉</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{score}</div>
                      <div className="text-sm text-gray-600">Final Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{totalMatches}</div>
                      <div className="text-sm text-gray-600">Total Matches</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{correctMatches}</div>
                      <div className="text-sm text-gray-600">Correct</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {totalMatches > 0 ? Math.round((correctMatches / totalMatches) * 100) : 0}%
                      </div>
                      <div className="text-sm text-gray-600">Accuracy</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      onClick={handleNavigateToCognitive}
                      className="bg-purple-600 hover:bg-purple-700 px-6 py-2"
                    >
                      Back to Assessment
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => window.location.reload()}
                      className="border-purple-300 text-purple-700 hover:bg-purple-50 px-6 py-2"
                    >
                      Play Again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">How to Play</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-gray-700">
              <div className="flex items-start gap-3">
                <Badge className="mt-0.5 bg-purple-100 text-purple-800">1</Badge>
                <p>Remember the shape that appears on the screen.</p>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="mt-0.5 bg-purple-100 text-purple-800">2</Badge>
                <p>When the next shape appears, click "Match" if it's the same as the previous shape.</p>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="mt-0.5 bg-purple-100 text-purple-800">3</Badge>
                <p>Click "No Match" if it's different from the previous shape.</p>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="mt-0.5 bg-purple-100 text-purple-800">4</Badge>
                <p>Get 400 points for each correct answer!</p>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="mt-0.5 bg-purple-100 text-purple-800">5</Badge>
                <p>You have 45 seconds to get as many points as possible.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SpeedMatch;