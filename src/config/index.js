const isProduction = import.meta.env.MODE === 'production';

// 🔥 FORCE PRODUCTION APIs - Set this to true to use prod APIs in dev mode
const USE_PROD_APIS = true;

const defaultEndpoints = {
  MAIN_API: (isProduction || USE_PROD_APIS)
    ? 'https://smart-steps-be.vercel.app/api' 
    : (import.meta.env.VITE_MAIN_API || 'http://localhost:5000'),
    
  COGNITIVE_API: (isProduction || USE_PROD_APIS)
    ? 'https://kavindulm98-cognitive.hf.space' 
    : (import.meta.env.VITE_COGNITIVE_API || 'http://localhost:5005'),
    
  LESSON_PREDICTION_API: (isProduction || USE_PROD_APIS)
    ? 'https://kavindulm98-keheliya-1.hf.space' 
    : (import.meta.env.VITE_LESSON_API || 'http://localhost:5001'),
    
  PEER_PREDICTION_API: (isProduction || USE_PROD_APIS)
    ? 'https://kavindulm98-keheliya-2.hf.space' 
    : (import.meta.env.VITE_PEER_API || 'http://localhost:5002'),
    
  CONTENT_PREFERENCE_API: (isProduction || USE_PROD_APIS)
    ? 'https://kavindulm98-anne.hf.space' 
    : (import.meta.env.VITE_CONTENT_API || 'http://localhost:5003'),
    
  STRESS_API: (isProduction || USE_PROD_APIS)
    ? 'https://kavindulm98-stress.hf.space' 
    : (import.meta.env.VITE_STRESS_API || 'http://localhost:5004')
};

const config = {
  api: {
    endpoints: defaultEndpoints,
    getUrl: (api, path) => {
      const baseUrl = defaultEndpoints[api];
      
      if (!baseUrl) {
        console.error(`❌ API endpoint '${api}' not found or undefined`);
        return null;
      }
      
      console.log(`✅ Using ${api}: ${baseUrl}${path} ${USE_PROD_APIS ? '(FORCED PROD)' : ''}`);
      
      // Handle production API path adjustment for MAIN_API
      if (api === 'MAIN_API' && (isProduction || USE_PROD_APIS) && path.startsWith('/api')) {
        return `${baseUrl}${path.substring(4)}`;
      }
      
      return `${baseUrl}${path}`;
    }
  },
  
  cognitive: {
    maxScoreValue: 15000,
    levels: ["Low", "Average", "High", "Very High"]
  },
  
  stress: {
    levels: ["Low", "Medium", "High"]
  },
  
  fieldMappings: {
    subjectToMarks: {
      "number sequence": "numberSequencesMarks",
      "perimeter": "perimeterMarks",
      "ratio": "ratioMarks",
      "fractions/decimals": "fractionsDecimalsMarks",
      "indices": "indicesMarks",
      "algebra": "algebraMarks",
      "angles": "anglesMarks",
      "volume and capacity": "volumeCapacityMarks",
      "area": "areaMarks",
      "probability": "probabilityMarks"
    },
    subjectToTime: {
      "number sequence": "numberSequencesTime",
      "perimeter": "perimeterTime",
      "ratio": "ratioTime",
      "fractions/decimals": "fractionsDecimalsTime",
      "indices": "indicesTime",
      "algebra": "algebraTime",
      "angles": "anglesTime",
      "volume and capacity": "volumeCapacityTime",
      "area": "areaTime",
      "probability": "probabilityTime"
    }
  },
  
  learningPaths: {
    "Low": ["video", "audio", "text", "pdf", "assignment", "quiz"],
    "Average": ["video", "audio", "pdf", "text", "assignment", "quiz"],
    "High": ["quiz", "assignment", "video", "audio", "text", "pdf"],
    "Very High": ["quiz", "assignment", "pdf", "video", "audio", "text"]
  }
};

export default config;