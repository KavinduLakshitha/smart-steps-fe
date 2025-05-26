import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import config from "../config";
import { useUser } from "../contexts/UserContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const FilteredCourses = () => {
  const [courses, setCourses] = useState([]);
  const [completedMaterials, setCompletedMaterials] = useState([]);
  const [sortedCourses, setSortedCourses] = useState([]);
  const [subject, setSubject] = useState("");
  const [cognitivePerformance, setCognitivePerformance] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user, loading: userLoading, isAuthenticated } = useUser();
  const learningPaths = config.learningPaths;

  // Sort courses based on cognitive performance
  const sortCourses = (courses, performance) => {
    const path = learningPaths[performance] || learningPaths["Low"];
    return [...courses].sort((a, b) => {
      return path.indexOf(a.learningMaterial) - path.indexOf(b.learningMaterial);
    });
  };

  // Get current learning path
  const getCurrentPath = () => {
    if (["High", "Very High"].includes(cognitivePerformance)) {
      return learningPaths["High"];
    }
    return learningPaths["Low"];
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (userLoading) return;
      
      if (!isAuthenticated) {
        navigate("/login");
        return;
      }

      try {
        const email = user.email;
        
        const contentPreferenceApiUrl = config.api.getUrl('MAIN_API', `/api/content?email=${email}`);
        if (!contentPreferenceApiUrl) {
          console.error("Failed to get MAIN_API URL for content preferences");
          setError("Failed to load content preferences - API configuration error.");
          return;
        }
        
        const subjectName = contentPreferenceResponse.data.preferences;
        const cognitive = contentPreferenceResponse.data.cognitive || 'Low';
        
        setSubject(subjectName);
        setCognitivePerformance(cognitive);

        console.log(`Trying to fetch courses for subject: "${subjectName}"`);
        const coursesApiUrl = config.api.getUrl('MAIN_API', `/api/course/filter/${encodeURIComponent(subjectName)}`);
        if (!coursesApiUrl) {
          console.error("Failed to get MAIN_API URL for courses");
          setError("Failed to load courses - API configuration error.");
          return;
        }
        
        // If no courses found with original subject name, try the alternative
        if (!coursesResponse.data || coursesResponse.data.length === 0) {
          // Create the alternative subject name (add/remove 's')
          const alternativeSubject = subjectName.endsWith('s') 
            ? subjectName.slice(0, -1)  // Remove 's' if it ends with 's'
            : subjectName + 's';        // Add 's' if it doesn't end with 's'
          
          console.log(`No courses found for "${subjectName}", trying alternative: "${alternativeSubject}"`);
          
          const alternativeCoursesApiUrl = config.api.getUrl('MAIN_API', `/api/course/filter/${encodeURIComponent(alternativeSubject)}`);
          if (alternativeCoursesApiUrl) {
            // Try the API request with the alternative subject name
            coursesResponse = await axios.get(alternativeCoursesApiUrl);
            
            // If courses were found with the alternative, update the displayed subject
            if (coursesResponse.data && coursesResponse.data.length > 0) {
              console.log(`Found ${coursesResponse.data.length} courses with "${alternativeSubject}"`);
              setSubject(`${subjectName} (${alternativeSubject})`); // Show both for clarity
            }
          } else {
            console.error("Failed to get MAIN_API URL for alternative course search");
          }
        } else {
          console.log(`Found ${coursesResponse.data.length} courses with "${subjectName}"`);
        }
        
        // Whether we got courses with the original or alternative name, 
        // we now have our best result in coursesResponse
        const fetchedCourses = coursesResponse.data || [];
        setCourses(fetchedCourses);
        setSortedCourses(sortCourses(fetchedCourses, cognitive));
        
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, user, userLoading, isAuthenticated]);

  // Re-sort when cognitivePerformance changes
  useEffect(() => {
    if (courses.length > 0 && cognitivePerformance) {
      setSortedCourses(sortCourses(courses, cognitivePerformance));
    }
  }, [cognitivePerformance, courses]);

  // Handle card click
  const handleCardClick = (id) => {
    navigate(`/lesson/${id}`);
  };

  // Get material type color
  const getMaterialTypeColor = (materialType) => {
    switch (materialType) {
      case 'quiz':
        return 'border-l-orange-500';
      case 'assignment':
        return 'border-l-green-500';
      case 'video':
        return 'border-l-blue-500';
      case 'audio':
        return 'border-l-purple-500';
      case 'pdf':
        return 'border-l-red-500';
      default:
        return 'border-l-slate-500';
    }
  };

  // Get material type badge color
  const getMaterialTypeBadgeColor = (materialType) => {
    switch (materialType) {
      case 'quiz':
        return 'bg-orange-500';
      case 'assignment':
        return 'bg-green-500';
      case 'video':
        return 'bg-blue-500';
      case 'audio':
        return 'bg-purple-500';
      case 'pdf':
        return 'bg-red-500';
      default:
        return 'bg-slate-500';
    }
  };

  // Get unique content types from sorted courses
  const getUniqueContentTypes = () => {
    const types = [...new Set(sortedCourses.map(course => course.learningMaterial))];
    return types.sort();
  };

  // Get completion data
  const getCompletionData = () => {
    const completedCourses = JSON.parse(localStorage.getItem('completedCourses') || '[]');
    const contentTypes = getUniqueContentTypes();
    
    return contentTypes.map(contentType => {
      const coursesOfType = sortedCourses.filter(course => course.learningMaterial === contentType);
      const completedOfType = coursesOfType.filter(course => completedCourses.includes(course._id));
      
      return {
        type: contentType,
        total: coursesOfType.length,
        completed: completedOfType.length,
        isFullyCompleted: completedOfType.length === coursesOfType.length && coursesOfType.length > 0
      };
    });
  };

  // Get step icon for content type
  const getStepIcon = (materialType) => {
    switch (materialType) {
      case 'video':
        return '🎥';
      case 'audio':
        return '🎧';
      case 'quiz':
        return '❓';
      case 'assignment':
        return '📝';
      case 'pdf':
        return '📄';
      default:
        return '📚';
    }
  };

  // Get step color for content type
  const getStepColor = (materialType, isCompleted = false) => {
    if (isCompleted) {
      return 'text-green-600 border-green-500 bg-green-50';
    }
    
    switch (materialType) {
      case 'quiz':
        return 'text-orange-600 border-orange-500 bg-orange-50';
      case 'assignment':
        return 'text-green-600 border-green-500 bg-green-50';
      case 'video':
        return 'text-blue-600 border-blue-500 bg-blue-50';
      case 'audio':
        return 'text-purple-600 border-purple-500 bg-purple-50';
      case 'pdf':
        return 'text-red-600 border-red-500 bg-red-50';
      default:
        return 'text-slate-600 border-slate-500 bg-slate-50';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <h2 className="text-xl font-semibold mt-4">Loading...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Filtered Courses
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Showing courses for subject: <strong className="text-gray-900">{subject}</strong>
        </p>

        {/* Content Types Progress Steps */}
        {sortedCourses.length > 0 && (
          <div className="max-w-4xl mx-auto mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Learning Progress</h3>
            <div className="flex flex-wrap justify-center items-center gap-4">
              {getCompletionData().map((data, index) => (
                <div key={data.type} className="flex items-center">
                  <div className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 ${getStepColor(data.type, data.isFullyCompleted)} font-medium`}>
                    <span className="text-lg">{getStepIcon(data.type)}</span>
                    {data.isFullyCompleted && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                  <div className="ml-2 text-left">
                    <div className="text-sm font-medium text-gray-900 capitalize">
                      {data.type}
                    </div>
                    <div className="text-xs text-gray-500">
                      {data.completed}/{data.total} completed
                    </div>
                    {data.completed > 0 && (
                      <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-green-500 h-1.5 rounded-full transition-all duration-300" 
                          style={{ width: `${(data.completed / data.total) * 100}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                  {/* Connector line (not shown for last item) */}
                  {index < getCompletionData().length - 1 && (
                    <div className="hidden sm:block w-8 h-0.5 bg-gray-300 ml-4"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedCourses.length > 0 ? (
          sortedCourses.map((course) => (
            <Card
              key={course._id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-l-4 ${getMaterialTypeColor(course.learningMaterial)} h-full flex flex-col`}
              onClick={() => handleCardClick(course._id)}
            >
              <div className="relative">
                <img
                  src={course.image}
                  alt={course.lessonName}
                  className="w-full h-40 object-cover rounded-t-lg"
                />
                <div className={`absolute top-2 right-2 ${getMaterialTypeBadgeColor(course.learningMaterial)} text-white px-2 py-1 rounded text-xs font-medium capitalize`}>
                  {course.learningMaterial}
                </div>
              </div>
              
              <CardContent className="flex-1 p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {course.lessonName}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {course.description}
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No courses found for this subject
            </h3>
            <p className="text-gray-600">
              Try checking back later or contact support if you believe this is an error.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilteredCourses;