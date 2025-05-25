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

const SpeedMatch = () => {
  const navigate = useNavigate();
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
    navigate("/cognitive");
  };
  
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 5, textAlign: "center" }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Speed Match Game
        </Typography>
      </Box>
      
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2, mb: 5, textAlign: "center" }}>
        <Typography variant="h6" gutterBottom>
          {message}
        </Typography>
        
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <canvas 
            ref={canvasRef} 
            width={400} 
            height={400} 
            style={{ 
              border: "2px solid black", 
              backgroundColor: "white", 
              borderRadius: "8px" 
            }}
          />
        </Box>
        
        <Grid container spacing={2} justifyContent="center">
          <Grid item>
            <Button 
              variant="contained" 
              color="primary" 
              size="large" 
              onClick={() => handleMatchCheck(true)}
              disabled={gameOver}
            >
              Match
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant="contained" 
              color="secondary" 
              size="large" 
              onClick={() => handleMatchCheck(false)}
              disabled={gameOver}
            >
              No Match
            </Button>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6">
            Score: {score}
          </Typography>
          <Typography variant="h6">
            Time Left: {timeLeft}s
          </Typography>
        </Box>
        
        {gameOver && (
          <Box sx={{ mt: 4, p: 2, bgcolor: "#f9f9f9", borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom>
              Game Over!
            </Typography>
            <Typography variant="body1">
              Final Score: {score}
            </Typography>
            <Typography variant="body1">
              Total Matches: {totalMatches}
            </Typography>
            <Typography variant="body1">
              Correct Matches: {correctMatches}
            </Typography>
            <Typography variant="body1">
              Accuracy: {totalMatches > 0 ? Math.round((correctMatches / totalMatches) * 100) : 0}%
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
              <li>Remember the shape that appears on the screen.</li>
              <li>When the next shape appears, click "Match" if it's the same as the previous shape.</li>
              <li>Click "No Match" if it's different from the previous shape.</li>
              <li>Get 400 points for each correct answer!</li>
              <li>You have 45 seconds to get as many points as possible.</li>
            </ol>
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default SpeedMatch;