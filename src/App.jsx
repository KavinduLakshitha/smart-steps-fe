import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import { Container } from "@mui/material";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Home from "./components/Home";
import Profile from "./components/Profile";
import Navbar from "./components/Navbar";
import PredictionForm from "./components/LessonPrediction";
import PeerPrediction from "./components/PeerPrediction";
import AddCoursePage from "./components/AddCourse";
import AddSpecialization from "./components/AddSpecialization";
import AdminDashboard from "./components/AdminDashboard";
import CourseDetailsPage from "./components/CourseDetailsPage";
import SpecializationDetailPage from "./components/SpecializationDetail";
import FilteredCourses from "./components/FilteredContent";
import StressDetection from "./components/StressDetection";
import SongRecommendations from "./components/SongRecommendations";
import SpeedMatch from "./components/SpeedMatch";
import MemoryMatrix from "./components/MemoryMatrix";
import RainDrops from "./components/RainDrops";
import CognitiveResults from "./components/CognitiveResults";
import CognitiveAssessment from "./components/CognitiveAssessment";
import { UserProvider } from "./contexts/UserContext";
import AllCourse from "./components/AllCourses";
import Dashboard from "./components/Dashboard";
import LessonPrediction from "./components/LessonPrediction";

function ConditionalNavbar() {
  const location = useLocation();
  
  const routesWithoutNavbar = ['/login', '/signup'];
  
  const shouldHideNavbar = routesWithoutNavbar.includes(location.pathname);
  
  return shouldHideNavbar ? null : <Navbar />;
}

function ConditionalContainer({ children }) {
  const location = useLocation();
  
  const routesWithoutMargin = ['/login', '/signup'];
  const shouldHideMargin = routesWithoutMargin.includes(location.pathname);
  
  return shouldHideMargin ? (
    <div>{children}</div>
  ) : (
    <Container sx={{ mt: 10 }}>{children}</Container>
  );
}

function App() {
  return (
    <UserProvider>      
      <Router>
        <ConditionalNavbar />
        <ConditionalContainer>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/stress" element={<StressDetection />} /> 
            <Route path="/songs" element={<SongRecommendations />} />
            <Route path="/all" element={<AllCourse />} />
            <Route path="/speed-match" element={<SpeedMatch />} />
            <Route path="/memory-matrix" element={<MemoryMatrix />} />
            <Route path="/rain-drops" element={<RainDrops />} />
            <Route path="/results" element={<CognitiveResults />} />
            <Route path="/cognitive" element={<CognitiveAssessment />} />
            <Route path="/lesson" element={<PredictionForm />} />
            <Route path="/peer" element={<PeerPrediction />} />
            <Route path="/addcourse" element={<AddCoursePage />} />
            <Route path="/addspecial" element={<AddSpecialization />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/lesson/:id" element={<CourseDetailsPage />} />
            <Route path="/specialization/:specializationId" element={<SpecializationDetailPage />} />
            <Route path="/filtered" element={<FilteredCourses />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/lesson-prediction" element={<LessonPrediction />} />
          </Routes>
        </ConditionalContainer>
      </Router>
    </UserProvider>
  );
}

export default App;