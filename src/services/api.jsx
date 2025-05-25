import axios from 'axios';
import config from '../config';

const API_BASE_URL = config.api.endpoints.COGNITIVE_API;

export const submitCognitiveData = async (formData) => {
  try {
    const jsonData = {};
    if (formData instanceof FormData) {
      for (let [key, value] of formData.entries()) {
        jsonData[key] = value;
      }
    } else {
      Object.assign(jsonData, formData);
    }    
    
    // Convert all values to proper types with better handling
    jsonData.age = jsonData.age ? parseInt(jsonData.age) : 0;
    jsonData.sleep_hours = jsonData.sleep_hours ? parseInt(jsonData.sleep_hours) : 0;
    jsonData.speed_match_cards = jsonData.speed_match_cards ? parseInt(jsonData.speed_match_cards) : 0;
    jsonData.speed_match_points = jsonData.speed_match_points ? parseInt(jsonData.speed_match_points) : 0;
    jsonData.gender = jsonData.gender !== undefined ? parseInt(jsonData.gender) : 1; // Default to Female (1)
    jsonData.memory_matrix_points = jsonData.memory_matrix_points ? parseInt(jsonData.memory_matrix_points) : 0;
    jsonData.time_memory_matrix = jsonData.time_memory_matrix ? parseFloat(jsonData.time_memory_matrix) : 0.0;
    jsonData.rain_drops_score = jsonData.rain_drops_score ? parseInt(jsonData.rain_drops_score) : 0;
    jsonData.time_rain_drops = jsonData.time_rain_drops ? parseFloat(jsonData.time_rain_drops) : 0.0;
    
    // Handle gaming experience properly - FIX THE LOGIC HERE
    const gameExValue = jsonData.gameEx !== undefined ? parseInt(jsonData.gameEx) : 0;
    jsonData.gameEx = gameExValue;
    jsonData.GameEx = gameExValue; // Ensure both fields have the same value
    
    console.log('Submitting data to backend:', jsonData);
    
    const response = await axios.post(`${API_BASE_URL}/search`, jsonData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000 // Add timeout to prevent hanging requests
    });
    
    console.log('Response from backend:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error submitting cognitive data:', error);
    
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      throw new Error(`Server error: ${error.response.status} - ${error.response.data?.error || 'Unknown server error'}`);
    } else if (error.request) {
      console.error('No response received:', error.request);
      throw new Error('No response from server. Please check if the backend is running.');
    } else {
      console.error('Error message:', error.message);
      throw new Error(`Request setup error: ${error.message}`);
    }
  }
};

export const testCorsConnection = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/test-cors`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log('CORS test successful:', response.data);
    return {
      success: true,
      message: 'CORS connection working correctly',
      data: response.data
    };
  } catch (error) {
    console.error('CORS test failed:', error);
    return {
      success: false,
      message: 'CORS connection failed',
      error: error
    };
  }
};

export const getServiceUrl = (serviceName, path = '') => {
  return config.api.getUrl(serviceName, path);
};

export default {
  submitCognitiveData,
  testCorsConnection,
  getServiceUrl
};