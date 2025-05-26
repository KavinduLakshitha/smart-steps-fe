import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import config from "../config"; // Import your config
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch all users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const apiUrl = config.api.getUrl('MAIN_API', '/api/auth/users');
        if (!apiUrl) {
          console.error("Failed to get MAIN_API URL for users");
          setError("Failed to fetch users - API configuration error.");
          return;
        }

        const response = await axios.get(apiUrl);
        setUsers(response.data);
        setError(null);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError("Failed to fetch users. Please try again later.");
      }
    };

    fetchUsers();
  }, []);

  // Handle user deletion
  const handleDeleteUser = async (userId) => {
    try {
      const apiUrl = config.api.getUrl('MAIN_API', `/api/auth/users/${userId}`);
      if (!apiUrl) {
        console.error("Failed to get MAIN_API URL for user deletion");
        setError("Failed to delete user - API configuration error.");
        return;
      }

      await axios.delete(apiUrl);
      setUsers(users.filter((user) => user._id !== userId)); // Remove the user from the list
      
      // Using a more modern approach instead of alert
      setError({ type: "success", message: "User deleted successfully!" });
      setTimeout(() => setError(null), 3000);
    } catch (error) {
      console.error("Error deleting user:", error);
      setError("Failed to delete user. Please try again.");
    }
  };

  return (
    <div className="container p-6 mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Admin Dashboard</h1>

      {/* Show error/success messages */}
      {error && (
        <Alert className={`mb-4 ${error.type === "success" ? "bg-green-50 border-green-500" : "bg-red-50 border-red-500"}`}>
          <AlertDescription>{error.message || error}</AlertDescription>
        </Alert>
      )}

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
        <Card className="h-full flex flex-col shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="flex-grow pt-6">
            <h3 className="text-lg font-medium mb-2">Add New Lessons</h3>
            <p className="text-sm text-gray-500">
              Create new lessons available on the platform.
            </p>
          </CardContent>
          <CardFooter className="pt-0">
            <Button 
              variant="default" 
              onClick={() => navigate("/addcourse")}
              className="w-full"
            >
              Go to Courses
            </Button>
          </CardFooter>
        </Card>

        <Card className="h-full flex flex-col shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="flex-grow pt-6">
            <h3 className="text-lg font-medium mb-2">Add New Specializations</h3>
            <p className="text-sm text-gray-500">
              Add new specializations available on the platform.
            </p>
          </CardContent>
          <CardFooter className="pt-0">
            <Button 
              variant="default" 
              onClick={() => navigate("/addspecial")}
              className="w-full"
            >
              Go to Specializations
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Users Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">User Management</h2>
        
        {users.length === 0 && !error ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading users...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {users.map((user) => (
              <Card key={user._id} className="h-full flex flex-col shadow-md">
                <CardContent className="flex-grow pt-6">
                  <h3 className="text-lg font-medium">{user.name}</h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-500">
                      Email: {user.email}
                    </p>
                    <p className="text-sm text-gray-500">
                      Age: {user.age}
                    </p>
                    <p className="text-sm text-gray-500">
                      Gender: {user.Gender}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex justify-end">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteUser(user._id)}
                  >
                    Delete User
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;