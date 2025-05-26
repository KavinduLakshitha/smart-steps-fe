import { useState, useEffect } from "react";
import axios from "axios";
import { TextField, Button, Container, Typography, Grid, Paper, CircularProgress } from "@mui/material";
import config from "@/config";

function PeerPrediction() {
  const [formData, setFormData] = useState({
    "Age": "",
    "number sequences marks": "",
    "number sequences time(s)": "",
    "ratio marks": "",
    "ratio time(s)": "",
    "perimeter marks": "",
    "perimeter time(s)": "",
    "fractions/decimals marks": "",
    "fractions/decimals time(s)": "",
    "indices marks": "",
    "indices time(s)": "",
    "algebra marks": "",
    "algebra time(s)": "",
    "angles marks": "",
    "angles time(s)": "",
    "volume and capacity marks": "",
    "volume and capacity time(s)": "",
    "area marks": "",
    "area time(s)": "",
    "probability marks": "",
    "probability time(s)": "",
    "Male/Female": "",
    "Preferred Study Method": ""
  });

  const [userEmail, setUserEmail] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Mapping between user profile time fields and Flask app time fields
  const timeFieldMapping = {
    "numberSequencesTime": "number sequences time(s)",
    "ratioTime": "ratio time(s)",
    "perimeterTime": "perimeter time(s)",
    "fractionsDecimalsTime": "fractions/decimals time(s)",
    "indicesTime": "indices time(s)",
    "algebraTime": "algebra time(s)",
    "anglesTime": "angles time(s)",
    "volumeCapacityTime": "volume and capacity time(s)",
    "areaTime": "area time(s)",
    "probabilityTime": "probability time(s)",
  };

  // Fetch user profile and populate form data
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const profileApiUrl = config.api.getUrl('MAIN_API', '/api/auth/profile');
      
      if (!profileApiUrl) {
        console.error("Failed to get MAIN_API URL for profile");
        setError("Failed to load user profile - API configuration error.");
        return;
      }

      const res = await axios.get(profileApiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserEmail(res.data.email);

      // Extract the last value from each marks array
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

      const updatedFormData = { ...formData };
      marksFields.forEach((field) => {
        const marksArray = res.data[field];
        const lastMark = marksArray.length > 0 ? marksArray[marksArray.length - 1] : 0;
        updatedFormData[field.replace(/([A-Z])/g, " $1").toLowerCase()] = lastMark;
      });

      // Extract the last value from each time(s) array and map to Flask app fields
      Object.keys(timeFieldMapping).forEach((profileField) => {
        const flaskField = timeFieldMapping[profileField];
        const timeValue = res.data[profileField];
        updatedFormData[flaskField] = parseInt(timeValue) || 0;
      });

      // Add age, gender, and preferred study method
      updatedFormData["Age"] = res.data.age;
      updatedFormData["Male/Female"] = res.data.Gender;
      updatedFormData["Preferred Study Method"] = res.data.preferredStudyMethod;

      setFormData(updatedFormData);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("Failed to fetch user profile. Please try again.");
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      // Convert numerical fields to integers
      const processedData = { ...formData };
      const numericalFields = [
        "Age",
        "number sequences marks",
        "number sequences time(s)",
        "ratio marks",
        "ratio time(s)",
        "perimeter marks",
        "perimeter time(s)",
        "fractions/decimals marks",
        "fractions/decimals time(s)",
        "indices marks",
        "indices time(s)",
        "algebra marks",
        "algebra time(s)",
        "angles marks",
        "angles time(s)",
        "volume and capacity marks",
        "volume and capacity time(s)",
        "area marks",
        "area time(s)",
        "probability marks",
        "probability time(s)",
      ];

      numericalFields.forEach((field) => {
        processedData[field] = parseInt(processedData[field]) || 0;
      });

      // Send data to the Flask backend for prediction
      const peerPredictionApiUrl = config.api.getUrl('PEER_PREDICTION_API', '/predict');
      if (!peerPredictionApiUrl) {
        console.error("Failed to get PEER_PREDICTION_API URL");
        setError("Peer prediction service is not available - API configuration error.");
        return;
      }

      const response = await axios.post(peerPredictionApiUrl, processedData);
      setResult(response.data["Predicted Class"]);

      // Save the prediction to the backend
      if (userEmail) {
        const saveApiUrl = config.api.getUrl('MAIN_API', '/api/peer/save');
        if (saveApiUrl) {
          await axios.post(saveApiUrl, {
            email: userEmail,
            preferences: response.data["Predicted Class"],
          });
        } else {
          console.error("Failed to get MAIN_API URL for saving peer prediction");
          // Don't show error to user since prediction was successful, just log it
        }
      }
    } catch (error) {
      setError("Error sending request. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>
        Student Performance Prediction
      </Typography>
      <Grid container spacing={2} component={Paper} style={{ padding: 20 }}>
        {Object.keys(formData).map((key) => (
          <Grid item xs={12} sm={6} key={key}>
            <TextField
              name={key}
              label={key}
              variant="outlined"
              margin="normal"
              fullWidth
              type={typeof formData[key] === "number" ? "number" : "text"}
              value={formData[key]}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>
        ))}
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            fullWidth
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Predict"}
          </Button>
        </Grid>
        {result && (
          <Grid item xs={12}>
            <Paper style={{ marginTop: 20, padding: 20 }}>
              <Typography variant="h6">Predicted Class: {result}</Typography>
            </Paper>
          </Grid>
        )}
        {error && (
          <Grid item xs={12}>
            <Typography color="error">{error}</Typography>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}

export default PeerPrediction;