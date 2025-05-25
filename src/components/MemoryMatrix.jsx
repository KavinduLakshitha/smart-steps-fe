import React, { useState, useEffect, useRef } from "react";
import {
  Typography,
  Container,
  Box,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  Link
} from "@mui/material";
import { useNavigate } from "react-router-dom";

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
      
      let cellClass = "cell";
      if (showPattern && isInPattern) {
        cellClass += " highlight";
      } else if (isSelected && isInPattern) {
        cellClass += " correct";
      } else if (isSelected && !isInPattern) {
        cellClass += " wrong";
      } else if (gameOver && isInPattern && !isSelected) {
        cellClass += " missed";
      }
      
      cells.push(
        <div
          key={i}
          onClick={() => handleCellClick(i)}
          style={{
            width: '60px',
            height: '60px',
            backgroundColor: 
              cellClass.includes("highlight") ? "#3f51b5" :
              cellClass.includes("correct") ? "#4caf50" :
              cellClass.includes("wrong") ? "#f44336" :
              cellClass.includes("missed") ? "#ff9800" : 
              "#e0e0e0",
            border: "2px solid #000",
            display: "inline-block",
            cursor: "pointer",
            margin: "2px"
          }}
        />
      );
    }
    
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${gridSizeX}, 1fr)`,
          gap: "5px",
          margin: "20px auto",
          width: `${gridSizeX * 65}px`,
          justifyContent: "center"
        }}
      >
        {cells}
      </div>
    );
  };

  const handleNavigateToCognitive = () => {
    navigate("/cognitive");
  };
  
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 5, textAlign: "center" }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Memory Matrix Game
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Memorize the pattern and recreate it!
        </Typography>
      </Box>
      
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2, mb: 5, textAlign: "center" }}>
        <Grid container spacing={2} justifyContent="center">
          <Grid item xs={12} sm={4}>
            <Typography variant="h6">
              Score: {score}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6">
              Round: {round}/6
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6">
              Tiles: {pattern.length}
            </Typography>
          </Grid>
        </Grid>
        
        <Box sx={{ my: 3 }}>
          {renderGameBoard()}
        </Box>
        
        <Typography variant="h6" color={
          message.includes("Well done") || message.includes("✅") ? "success.main" : 
          message.includes("Try again") || message.includes("❌") ? "error.main" : 
          "text.primary"
        }>
          {message}
        </Typography>
        
        {!showPattern && !gameOver && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Selected: {userSelections.length} / {pattern.length} tiles
          </Typography>
        )}
        
        {gameOver && (
          <Box sx={{ mt: 4, p: 2, bgcolor: "#f9f9f9", borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom>
              Game Over!
            </Typography>
            <Typography variant="body1">
              Final Score: {score}
            </Typography>
            <Typography variant="body1">
              Time Taken: {timeTaken} minutes
            </Typography>
            <Typography variant="body1">
              Highest Level Reached: {level}
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
              <li>A pattern of blue tiles will appear briefly on the grid.</li>
              <li>Memorize the locations of the highlighted tiles.</li>
              <li>After the pattern disappears, click on the tiles to recreate the pattern.</li>
              <li>You must select exactly the same number of tiles shown in the pattern.</li>
              <li>Get 250 points for each correct tile selection plus bonuses for perfect recalls.</li>
              <li>The difficulty increases as you succeed and decreases if you make mistakes.</li>
              <li>The game ends after 6 rounds.</li>
            </ol>
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default MemoryMatrix;