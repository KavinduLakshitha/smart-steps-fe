import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const MemoryMatrix = () => {
  const navigate = useNavigate();
  const [gridSizeX, setGridSizeX] = useState(5);
  const [gridSizeY, setGridSizeY] = useState(5);
  const [numToHighlight, setNumToHighlight] = useState(7);
  const [pattern, setPattern] = useState([]);
  const [userSelections, setUserSelections] = useState([]);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState("");
  const [showPattern, setShowPattern] = useState(false);
  const [timeTaken, setTimeTaken] = useState(0);
  const startTimeRef = useRef(null);
  
  // Generate a random pattern of cells to highlight
  const generatePattern = () => {
    // Using array instead of Set to ensure exact control of number of tiles
    const totalCells = gridSizeX * gridSizeY;
    const patternArray = [];
    
    // Force strict validation to ensure exactly numToHighlight tiles
    let attempts = 0;
    const maxAttempts = 1000; // Safety to prevent infinite loops
    
    while (patternArray.length < numToHighlight && attempts < maxAttempts) {
      attempts++;
      const randomIndex = Math.floor(Math.random() * totalCells);
      
      // Only add if not already in the array
      if (!patternArray.includes(randomIndex)) {
        patternArray.push(randomIndex);
      }
    }
    
    // Final verification check - if still not enough, force add sequential indices
    if (patternArray.length < numToHighlight) {
      console.log(`Adding sequential tiles to complete pattern.`);
      for (let i = 0; patternArray.length < numToHighlight; i++) {
        if (!patternArray.includes(i) && i < totalCells) {
          patternArray.push(i);
        }
      }
    }
    
    // Double-check the final pattern size
    if (patternArray.length !== numToHighlight) {
      console.log(`Adjusting pattern size: Target ${numToHighlight}, Actual ${patternArray.length}`);
      // Force fix by truncating or padding
      while (patternArray.length > numToHighlight) {
        patternArray.pop();
      }
      while (patternArray.length < numToHighlight) {
        // Find any unused index
        for (let i = 0; i < totalCells; i++) {
          if (!patternArray.includes(i)) {
            patternArray.push(i);
            break;
          }
        }
      }
    }
    
    // Save the pattern
    setPattern(patternArray);
  };
  
  // Handle user cell click
  const handleCellClick = (index) => {
    // Prevent clicking if showing pattern or already selected
    if (showPattern || userSelections.includes(index)) return;
    
    // Add to user selections
    const newUserSelections = [...userSelections, index];
    setUserSelections(newUserSelections);
    
    // Check if the selected cell is correct
    if (pattern.includes(index)) {
      setScore(prev => prev + 250);
    }
    
    // Check if user has selected enough cells (based on actual pattern length)
    if (newUserSelections.length === pattern.length) {
      checkResult(newUserSelections);
    }
  };
  
  // Check if the user selections match the pattern
  const checkResult = (selections = userSelections) => {
    // Count correct and incorrect selections
    const correct = selections.filter(index => pattern.includes(index)).length;
    const incorrect = selections.filter(index => !pattern.includes(index)).length;
    const missed = pattern.filter(index => !selections.includes(index)).length;
    
    console.log(`Result: ${correct} correct, ${incorrect} incorrect, ${missed} missed`);
    
    // Calculate success based on correct selections
    const success = correct === pattern.length && incorrect === 0;
    
    if (success) {
      setMessage("✅ Well done!");
      
      // If the user selected all correctly, add bonus points
      if (selections.length === pattern.length) {
        setScore(prev => prev + pattern.length * 100);
        setMessage(prev => prev + " 🎉 Perfect!");
      }
      
      // Increase difficulty
      if (numToHighlight === 7) {
        setGridSizeX(6);
        setGridSizeY(5);
        setNumToHighlight(8);
      } else if (numToHighlight === 8) {
        setNumToHighlight(9);
      }
      setLevel(prev => prev + 1);
    } else {
      // Custom error messages
      if (missed > 0) {
        setMessage(`❌ Missed ${missed} tile(s)!`);
      } else if (incorrect > 0) {
        setMessage(`❌ Selected ${incorrect} wrong tile(s)!`);
      } else {
        setMessage("❌ Try again!");
      }
      
      // Decrease difficulty
      if (numToHighlight === 9) {
        setNumToHighlight(8);
      } else if (numToHighlight === 8) {
        setGridSizeX(5);
        setGridSizeY(5);
        setNumToHighlight(7);
      }
    }
    
    // Save data to localStorage
    localStorage.setItem("memory_matrix_score", score.toString());
    
    // Start next round or end game
    if (round < 6) {
      setTimeout(() => {
        startRound();
      }, 1500);
    } else {
      // End of game
      const endTime = new Date();
      if (startTimeRef.current) {
        const timeTakenInSeconds = (endTime - startTimeRef.current) / 1000;
        const minutes = Math.floor(timeTakenInSeconds / 60);
        const seconds = Math.floor(timeTakenInSeconds % 60);
        const formattedTime = `${minutes}.${seconds < 10 ? '0' : ''}${seconds}`;
        
        setTimeTaken(formattedTime);
        localStorage.setItem("memory_matrix_time", formattedTime);
      }
      
      setMessage(prev => prev + " 🎉 Game Over!");
      setGameOver(true);
    }
  };
  
  // Start a new round
  const startRound = () => {
    setUserSelections([]);
    setMessage(`Memorize ${numToHighlight} tiles!`);
    generatePattern();
    setShowPattern(true);
    
    // Hide pattern after delay
    setTimeout(() => {
      setShowPattern(false);
      setMessage(`Select ${pattern.length} tiles`);
    }, 2000);
    
    if (round < 6) {
      setRound(prev => prev + 1);
    }
  };
  
  // Start the game
  useEffect(() => {
    setGridSizeX(5);
    setGridSizeY(5);
    setNumToHighlight(7);
    setLevel(1);
    setRound(1);
    setScore(0);
    setUserSelections([]);
    setMessage("");
    setGameOver(false);
    
    startTimeRef.current = new Date();
    startRound();
  }, []);
  
  // Render the game board
  const renderGameBoard = () => {
    const cells = [];
    const totalCells = gridSizeX * gridSizeY;
    
    for (let i = 0; i < totalCells; i++) {
      const isInPattern = pattern.includes(i);
      const isSelected = userSelections.includes(i);
      
      let cellClasses = "w-[60px] h-[60px] border-2 border-gray-800 inline-block cursor-pointer rounded-md transition-all duration-200";
      
      // Apply appropriate styling based on cell state
      if (showPattern && isInPattern) {
        cellClasses += " bg-blue-600";
      } else if (isSelected && isInPattern) {
        cellClasses += " bg-green-500";
      } else if (isSelected && !isInPattern) {
        cellClasses += " bg-red-500";
      } else if (gameOver && isInPattern && !isSelected) {
        cellClasses += " bg-orange-500";
      } else {
        cellClasses += " bg-gray-200 hover:bg-gray-300";
      }
      
      cells.push(
        <div
          key={i}
          onClick={() => handleCellClick(i)}
          className={cellClasses}
        />
      );
    }
    
    return (
      <div
        className="grid gap-1 mx-auto my-5"
        style={{
          gridTemplateColumns: `repeat(${gridSizeX}, 1fr)`,
          width: `${gridSizeX * 65}px`
        }}
      >
        {cells}
      </div>
    );
  };

  const handleNavigateToCognitive = () => {
    navigate("/cognitive");
  };

  // Determine message color class
  const getMessageColorClass = () => {
    if (message.includes("Well done") || message.includes("✅")) {
      return "text-green-600";
    } else if (message.includes("Try again") || message.includes("❌")) {
      return "text-red-600";
    }
    return "text-gray-800";
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="my-8 text-center">
        <h1 className="text-4xl font-bold mb-2">Memory Matrix Game</h1>
        <p className="text-gray-600">
          Memorize the pattern and recreate it!
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8 text-center">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold">
              Score: <span className="text-blue-600">{score}</span>
            </h2>
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              Round: <span className="text-blue-600">{round}/6</span>
            </h2>
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              Tiles: <span className="text-blue-600">{pattern.length}</span>
            </h2>
          </div>
        </div>
        
        <div className="my-6">
          {renderGameBoard()}
        </div>
        
        <h2 className={`text-xl font-semibold ${getMessageColorClass()}`}>
          {message}
        </h2>
        
        {!showPattern && !gameOver && (
          <p className="text-gray-600 mt-2">
            Selected: {userSelections.length} / {pattern.length} tiles
          </p>
        )}
        
        {gameOver && (
          <Alert className="mt-6 bg-gray-50 border border-gray-200">
            <AlertTitle className="text-xl font-bold">
              Game Over!
            </AlertTitle>
            <AlertDescription>
              <p className="font-semibold mb-1">
                Final Score: {score}
              </p>
              <p className="mb-1">
                Time Taken: {timeTaken} minutes
              </p>
              <p className="mb-4">
                Highest Level Reached: {level}
              </p>
              
              <div className="flex justify-center gap-3 mt-4">
                <Button 
                  variant="default" 
                  onClick={handleNavigateToCognitive}
                >
                  Back to Assessment
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                >
                  Play Again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-xl font-semibold mb-2">
            How to Play:
          </h2>
          <ol className="text-left space-y-1 list-decimal pl-5">
            <li>A pattern of blue tiles will appear briefly on the grid.</li>
            <li>Memorize the locations of the highlighted tiles.</li>
            <li>After the pattern disappears, click on the tiles to recreate the pattern.</li>
            <li>You must select exactly the same number of tiles shown in the pattern.</li>
            <li>Get 250 points for each correct tile selection plus bonuses for perfect recalls.</li>
            <li>The difficulty increases as you succeed and decreases if you make mistakes.</li>
            <li>The game ends after 6 rounds.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default MemoryMatrix;