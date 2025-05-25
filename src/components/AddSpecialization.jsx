import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Select,
  Typography,
  FormControl,
  InputLabel,
} from '@mui/material';

const AddSpecialization = () => {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [image, setImage] = useState('');
  const [complexity, setComplexity] = useState('');
  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState(Array(5).fill(''));

  // Fetch courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get('https://research-project-theta.vercel.app/api/course');
        setCourses(response.data);
      } catch (error) {
        console.error('Error fetching courses:', error);
        alert('Failed to fetch courses.');
      }
    };

    fetchCourses();
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!name || !subject || !image || !complexity) {
      alert('Please fill in all required fields.');
      return;
    }

    // Filter out empty course selections
    const validSelectedCourses = selectedCourses.filter((course) => course !== '');

    if (validSelectedCourses.length === 0) {
      alert('Please select at least one course.');
      return;
    }

    try {
      // Prepare the payload
      const payload = {
        name,
        subject,
        image,
        complexity,
        courses: validSelectedCourses,
      };

      // Send the request
      await axios.post('https://research-project-theta.vercel.app/api/specialize/add', payload);
      alert('Specialization added successfully!');

      // Reset the form
      setName('');
      setSubject('');
      setImage('');
      setComplexity('');
      setSelectedCourses(Array(5).fill(''));
    } catch (error) {
      console.error('Error adding specialization:', error);
      alert('Failed to add specialization.');
    }
  };

  // Handle course selection change
  const handleCourseChange = (index, value) => {
    const updatedCourses = [...selectedCourses];
    updatedCourses[index] = value;
    setSelectedCourses(updatedCourses);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: 'flex', flexDirection: 'column', maxWidth: '400px', mx: 'auto', mt: 4 }}
    >
      <Typography variant="h4" sx={{ mb: 2 }}>
        Add Specialization
      </Typography>

      {/* Specialization Name */}
      <TextField
        label="Specialization Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        sx={{ mb: 2 }}
      />

      {/* Subject Dropdown */}
      <FormControl fullWidth margin="normal" required>
        <InputLabel>Subject</InputLabel>
        <Select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          label="Subject"
        >
          <MenuItem value="number sequence">Number Sequence</MenuItem>
          <MenuItem value="perimeter">Perimeter</MenuItem>
          <MenuItem value="ratio">Ratio</MenuItem>
          <MenuItem value="fractions/decimals">Fractions</MenuItem>
          <MenuItem value="indices">Indices</MenuItem>
          <MenuItem value="algebra">Algebra</MenuItem>
          <MenuItem value="angles">Angles</MenuItem>
          <MenuItem value="volume and capacity">Volume and Capacity</MenuItem>
          <MenuItem value="area">Area</MenuItem>
          <MenuItem value="probability">Probability</MenuItem>
        </Select>
      </FormControl>

      {/* Complexity Dropdown */}
      <FormControl fullWidth margin="normal" required>
        <InputLabel>Complexity</InputLabel>
        <Select
          value={complexity}
          onChange={(e) => setComplexity(e.target.value)}
          label="Complexity"
        >
          <MenuItem value="beginner">Beginner</MenuItem>
          <MenuItem value="intermediate">Intermediate</MenuItem>
          <MenuItem value="advanced">Advanced</MenuItem>
        </Select>
      </FormControl>

      {/* Image URL */}
      <TextField
        label="Image URL"
        value={image}
        onChange={(e) => setImage(e.target.value)}
        required
        sx={{ mb: 2 }}
      />

      {/* Course Selection Dropdowns */}
      {[...Array(5)].map((_, index) => (
        <FormControl fullWidth margin="normal" key={index}>
          <InputLabel>Course {index + 1}</InputLabel>
          <Select
            value={selectedCourses[index]}
            onChange={(e) => handleCourseChange(index, e.target.value)}
            label={`Course ${index + 1}`}
          >
            <MenuItem value="" disabled>
              Select a course
            </MenuItem>
            {courses.map((course) => (
              <MenuItem key={course._id} value={course._id}>
                {course.lessonName} {/* Updated to match backend field name */}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ))}

      {/* Submit Button */}
      <Button type="submit" variant="contained" sx={{ mt: 2 }}>
        Add Specialization
      </Button>
    </Box>
  );
};

export default AddSpecialization;