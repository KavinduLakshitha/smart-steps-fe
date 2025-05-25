import React, { useState, useEffect, useRef } from "react";
import {
  Typography,
  Container,
  Box,
  Button,
  Paper,
  TextField,
  Card,
  CardContent,
  Link
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const RainDrops = () => {
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [survivalTime, setSurvivalTime] = useState(0);
  const gameContainerRef = useRef(null);
  const startTimeRef = useRef(null);
  const gameIntervalRef = useRef(null);
  const spawnIntervalRef = useRef(null);
  const yellowQuestionSpawned10000 = useRef(false);
  const yellowQuestionSpawned11000 = useRef(false);
  
  useEffect(() => {
  // Create or update the assessmentResult object in localStorage
  try {
    const resultData = localStorage.getItem('assessmentResult');
    if (resultData) {
      // If result exists, parse it
      const parsedData = JSON.parse(resultData);
      console.log("Initial assessmentResult found:", parsedData);
      
      // Only initialize p_M to "0" if it doesn't exist AND there's no existing game score
      if (!parsedData.p_M) {
        // Check if there's a saved game score
        const savedGameScore = localStorage.getItem('Rain_drops_score');
        if (savedGameScore && savedGameScore !== '0') {
          // Use the saved game score instead of setting to 0
          parsedData.p_M = savedGameScore;
          console.log("Using existing game score:", savedGameScore);
        } else {
          // No existing score, set to 0
          parsedData.p_M = "0";
          console.log("No existing score, setting p_M to 0");
        }
        localStorage.setItem('assessmentResult', JSON.stringify(parsedData));
      }
    } else {
      // Create a new assessmentResult if it doesn't exist
      // But first check if there's a saved game score
      const savedGameScore = localStorage.getItem('Rain_drops_score');
      const newResult = {
        p_M: savedGameScore && savedGameScore !== '0' ? savedGameScore : "0",
        person_memory: "0", 
        person_speed: "0",
        result: ""
      };
      localStorage.setItem('assessmentResult', JSON.stringify(newResult)); // FIXED: using newResult instead of undefined parsedData
      console.log("Created new assessmentResult:", newResult);
    }
  } catch (error) {
    console.error("Error initializing assessmentResult:", error);
  }
}, []);
  
  // Generate a math problem
  const generateProblem = () => {
    const operators = ["+", "-", "*", "/"];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    let num1, num2, answer;
    
    if (operator === "/") {
      num2 = Math.floor(Math.random() * 9) + 1;
      answer = Math.floor(Math.random() * 10) + 1;
      num1 = num2 * answer;
    } else {
      num1 = Math.floor(Math.random() * 10) + 1;
      num2 = Math.floor(Math.random() * 10) + 1;
      if (operator === "-") {
        if (num1 < num2) [num1, num2] = [num2, num1];
        answer = num1 - num2;
      } else {
        answer = operator === "+" ? num1 + num2 : num1 * num2;
      }
    }
    
    return {
      question: `${num1} ${operator} ${num2}`,
      answer,
      y: 0,
      id: Date.now(),
      isYellow: false
    };
  };
  
  // Spawn a new problem
  const spawnProblem = () => {
    const problem = generateProblem();
    
    // Spawn yellow question at specific score milestones
    if (score === 10000 && !yellowQuestionSpawned10000.current) {
      problem.isYellow = true;
      yellowQuestionSpawned10000.current = true;
    } else if (score === 11000 && !yellowQuestionSpawned11000.current) {
      problem.isYellow = true;
      yellowQuestionSpawned11000.current = true;
    }
    
    setProblems(prevProblems => [...prevProblems, problem]);
    
    // Create visual element
    const gameContainer = gameContainerRef.current;
    if (gameContainer) {
      const drop = document.createElement("div");
      drop.className = "raindrop";
      if (problem.isYellow) drop.classList.add("yellow-question");
      drop.innerText = problem.question;
      drop.style.left = Math.random() * 80 + "%";
      drop.style.top = "0px";
      drop.dataset.id = problem.id;
      
      // Raindrop styling
      drop.style.position = "absolute";
      drop.style.fontSize = "20px";
      drop.style.fontWeight = "bold";
      drop.style.color = problem.isYellow ? "gold" : "darkblue";
      if (problem.isYellow) {
        drop.style.textShadow = "1px 1px 2px black";
      }
      
      gameContainer.appendChild(drop);
    }
  };
  
  // Update game state
  const updateGame = () => {
    setProblems(prevProblems => {
      const updatedProblems = prevProblems.map(p => ({
        ...p,
        y: p.y + 5
      }));
      
      // Update visual elements and check for missed problems
      updatedProblems.forEach(problem => {
        const drop = document.querySelector(`.raindrop[data-id="${problem.id}"]`);
        if (drop) {
          drop.style.top = problem.y + "px";
          
          // Remove raindrops that reach the bottom
          if (problem.y > 380) {
            setMissed(prev => {
              const newMissed = prev + 1;
              // Immediately check game over using the new value
              if (newMissed >= 2) {
                // End the game immediately with the updated value
                setTimeout(() => endGame(), 0);
              }
              return newMissed;
            });
            drop.remove();
          }
        }
      });
      
      // Keep only problems still in play
      return updatedProblems.filter(problem => problem.y <= 380);
    });
  };
  
  // Handle user input submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const answer = parseFloat(userInput);
    
    // Check if the answer matches any problems
    setProblems(prevProblems => {
      let problemsToKeep = [...prevProblems];
      
      for (let i = 0; i < problemsToKeep.length; i++) {
        if (problemsToKeep[i].answer === answer) {
          // Found a matching problem
          if (problemsToKeep[i].isYellow) {
            // Yellow question: clear all raindrops
            document.querySelectorAll(".raindrop").forEach(el => el.remove());
            problemsToKeep = [];
          } else {
            // Regular question: add score and remove this raindrop
            setScore(prev => {
              const newScore = prev + 500;
              console.log("Score updated to:", newScore);
              return newScore;
            });
            document.querySelector(`.raindrop[data-id="${problemsToKeep[i].id}"]`)?.remove();
            problemsToKeep.splice(i, 1);
          }
          break;
        }
      }
      
      return problemsToKeep;
    });
    
    // Clear input field
    setUserInput("");
  };
  
  // End the game
  const endGame = () => {
    // Clear intervals
    clearInterval(gameIntervalRef.current);
    clearInterval(spawnIntervalRef.current);
    
    // Calculate survival time
    const endTime = Date.now();
    const timeSurvivedInSeconds = Math.floor((endTime - startTimeRef.current) / 1000);
    const minutes = Math.floor(timeSurvivedInSeconds / 60);
    const seconds = timeSurvivedInSeconds % 60;
    const formattedTime = `${minutes}.${seconds < 10 ? '0' + seconds : seconds}`;
    
    setSurvivalTime(formattedTime);
    setGameOver(true);
    
    // Save score and time to localStorage - for the game itself
    localStorage.setItem("Rain_drops_score", score.toString());
    localStorage.setItem("Rain_Drops_Time", formattedTime);
    
    // Save score to assessment results - for the assessment page
    updateAssessmentResult(score);
    
    console.log("Game over - Final score:", score);
    console.log("Assessment result updated with p_M:", score);
  };
  
  const updateAssessmentResult = (currentScore) => {
    try {
      // Skip updating if score is 0 (which could be a reset)
      if (currentScore <= 0) {
        console.log("Skipping update for zero/negative score:", currentScore);
        return;
      }
      
      console.log(`Saving score ${currentScore} to assessmentResult`);
      
      const resultData = localStorage.getItem('assessmentResult');
      let parsedData;
      
      if (resultData) {
        // Update existing assessment result
        parsedData = JSON.parse(resultData);
        
        // IMPORTANT: Only update p_M if the current score is higher than stored score
        // This prevents lower scores from overwriting higher ones
        const storedScore = parseInt(parsedData.p_M) || 0;
        if (currentScore > storedScore) {
          parsedData.p_M = currentScore.toString();
          console.log(`Updating score from ${storedScore} to ${currentScore}`);
        } else {
          console.log(`Not overwriting higher score ${storedScore} with ${currentScore}`);
        }
      } else {
        // Create new assessment result
        parsedData = {
          p_M: currentScore.toString(),
          person_memory: "0",
          person_speed: "0",
          result: ""
        };
        console.log("Created new assessmentResult with score:", currentScore);
      }
      
      // Save the updated or new assessment result
      localStorage.setItem('assessmentResult', JSON.stringify(parsedData));
      
      // Also directly update the Rain_drops_score for consistency
      localStorage.setItem("Rain_drops_score", currentScore.toString());
      
      console.log("Assessment result after update:", parsedData);
    } catch (error) {
      console.error("Error updating assessment result:", error);
    }
  };
  
  // Initialize game
  useEffect(() => {
    startTimeRef.current = Date.now();
    
    // Start game intervals
    spawnIntervalRef.current = setInterval(spawnProblem, 2000);
    gameIntervalRef.current = setInterval(updateGame, 500);
    
    // Clean up on component unmount
    return () => {
      clearInterval(spawnIntervalRef.current);
      clearInterval(gameIntervalRef.current);
      document.querySelectorAll(".raindrop").forEach(el => el.remove());
    };
  }, []);
  
  // Save score to localStorage when updated
  useEffect(() => {
    if (score > 0) {
      console.log("Score changed to:", score);
      localStorage.setItem("Rain_drops_score", score.toString());
      updateAssessmentResult(score);
    }
  }, [score]);

  const handleNavigateToCognitive = () => {
    // Make sure score is saved before navigating
    updateAssessmentResult(score);
    
    // Also directly save score to Rain_drops_score for extra safety
    localStorage.setItem("Rain_drops_score", score.toString());
    
    // Add debug logs
    console.log("Before navigation to assessment:");
    console.log("- Final score:", score);
    console.log("- Rain_drops_score in localStorage:", localStorage.getItem("Rain_drops_score"));
    console.log("- assessmentResult.p_M:", JSON.parse(localStorage.getItem("assessmentResult"))?.p_M);
    
    // Force a small delay to ensure localStorage updates are complete
    setTimeout(() => {
      navigate("/cognitive");
    }, 100);
  };
  
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 5, textAlign: "center" }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Raindrop Math Game
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Solve math problems in falling raindrops before they reach the bottom!
        </Typography>
      </Box>
      
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2, mb: 5, textAlign: "center" }}>
        <Typography variant="h6" gutterBottom>
          Score: {score} | Missed: {missed}
        </Typography>
        
        <Box 
          ref={gameContainerRef} 
          sx={{ 
            position: "relative", 
            width: "300px", 
            height: "400px", 
            border: "2px solid black", 
            backgroundColor: "#add8e6", 
            margin: "20px auto", 
            overflow: "hidden" 
          }}
        >
          {/* Raindrops will be dynamically added here */}
        </Box>
        
        <form onSubmit={handleSubmit}>
          <TextField
            variant="outlined"
            placeholder="Enter answer"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            type="number"
            InputProps={{ inputProps: { step: "any" } }}
            disabled={gameOver}
            sx={{ mr: 2 }}
          />
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={gameOver || !userInput}
          >
            Submit
          </Button>
        </form>
        
        {gameOver && (
          <Box sx={{ mt: 4, p: 2, bgcolor: "#f9f9f9", borderRadius: 2 }}>
            <Typography variant="h5" color="error.main" gutterBottom>
              Game Over!
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              You survived for {survivalTime} minutes!
            </Typography>
            <Typography variant="body1">
              Final Score: {score}
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <Button 
                variant="contained" 
                color="primary" 
                component={Link}
                onClick={handleNavigateToCognitive}
                sx={{ mx: 1 }}
              >
                Back to Assessment
              </Button>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={() => window.location.reload()}
                sx={{ mx: 1 }}
              >
                Play Again
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
      
      <Card sx={{ mb: 5 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            How to Play:
          </Typography>
          <Typography variant="body2" component="div">
            <ol style={{ textAlign: "left" }}>
              <li>Math problems will fall from the top of the screen as raindrops.</li>
              <li>Solve each problem and type the answer in the input box.</li>
              <li>Press submit or enter to check your answer.</li>
              <li>Each correct answer earns you 500 points.</li>
              <li>If a raindrop reaches the bottom without being solved, you miss one point.</li>
              <li>The game ends after you miss 2 problems.</li>
              <li>Special yellow problems will appear at certain score milestones. Solving these will clear all current raindrops!</li>
            </ol>
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default RainDrops;