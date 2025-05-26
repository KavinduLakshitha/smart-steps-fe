import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import config from '@/config';

const AddSpecialization = () => {
  const [courses, setCourses] = useState([]);
  const [notification, setNotification] = useState(null);
  const [selectedCourses, setSelectedCourses] = useState(Array(5).fill(''));
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form with react-hook-form
  const form = useForm({
    defaultValues: {
      name: '',
      subject: '',
      image: '',
      complexity: '',
    }
  });

  // Fetch courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        
        const apiUrl = config.api.getUrl('MAIN_API', '/api/course');
        if (!apiUrl) {
          console.error("Failed to get MAIN_API URL for courses");
          setNotification({
            type: 'error',
            message: 'Failed to fetch courses - API configuration error.'
          });
          setIsLoading(false);
          return;
        }

        const response = await axios.get(apiUrl);
        setCourses(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setNotification({
          type: 'error',
          message: 'Failed to fetch courses. Please try again.'
        });
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Handle course selection change
  const handleCourseChange = (index, value) => {
    const updatedCourses = [...selectedCourses];
    updatedCourses[index] = value;
    setSelectedCourses(updatedCourses);
  };

  // Handle form submission
  const onSubmit = async (data) => {
    // Filter out empty course selections
    const validSelectedCourses = selectedCourses.filter((course) => course !== '');

    if (validSelectedCourses.length === 0) {
      setNotification({
        type: 'error',
        message: 'Please select at least one course.'
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const apiUrl = config.api.getUrl('MAIN_API', '/api/specialize/add');
      if (!apiUrl) {
        console.error("Failed to get MAIN_API URL for adding specialization");
        setNotification({
          type: 'error',
          message: 'Failed to add specialization - API configuration error.'
        });
        setIsLoading(false);
        return;
      }
      
      // Prepare the payload
      const payload = {
        ...data,
        courses: validSelectedCourses,
      };

      // Send the request
      await axios.post(apiUrl, payload);
      
      setNotification({
        type: 'success',
        message: 'Specialization added successfully!'
      });

      // Reset the form
      form.reset();
      setSelectedCourses(Array(5).fill(''));
      
      setIsLoading(false);
      
      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (error) {
      console.error('Error adding specialization:', error);
      setNotification({
        type: 'error',
        message: 'Failed to add specialization. Please try again.'
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Add Specialization</h1>
        
        {notification && (
          <Alert className={`mb-6 ${notification.type === 'success' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700'}`}>
            <AlertDescription>{notification.message}</AlertDescription>
          </Alert>
        )}

        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Specialization Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialization Name</FormLabel>
                      <FormControl>
                        <Input {...field} required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Subject Dropdown */}
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="number sequence">Number Sequence</SelectItem>
                          <SelectItem value="perimeter">Perimeter</SelectItem>
                          <SelectItem value="ratio">Ratio</SelectItem>
                          <SelectItem value="fractions/decimals">Fractions</SelectItem>
                          <SelectItem value="indices">Indices</SelectItem>
                          <SelectItem value="algebra">Algebra</SelectItem>
                          <SelectItem value="angles">Angles</SelectItem>
                          <SelectItem value="volume and capacity">Volume and Capacity</SelectItem>
                          <SelectItem value="area">Area</SelectItem>
                          <SelectItem value="probability">Probability</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Complexity Dropdown */}
                <FormField
                  control={form.control}
                  name="complexity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complexity</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select complexity level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Image URL */}
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input {...field} required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Course Selection Dropdowns */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-medium text-gray-700">Select Courses</h3>
                  
                  {isLoading && (
                    <div className="text-sm text-gray-500 py-2">
                      Loading courses...
                    </div>
                  )}
                  
                  {!isLoading && courses.length === 0 && (
                    <div className="text-sm text-gray-500 py-2">
                      No courses available. Please add courses first.
                    </div>
                  )}
                  
                  {!isLoading && courses.length > 0 && (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, index) => (
                        <div key={index} className="rounded-md border border-gray-200 p-3">
                          <FormLabel className="text-sm text-gray-700 mb-1 block">
                            Course {index + 1}
                          </FormLabel>
                          <Select
                            value={selectedCourses[index]}
                            onValueChange={(value) => handleCourseChange(index, value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a course" />
                            </SelectTrigger>
                            <SelectContent>
                              {/* Placeholder is handled by SelectValue */}
                              {courses.map((course) => (
                                <SelectItem key={course._id} value={course._id}>
                                  {course.lessonName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button 
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Adding...' : 'Add Specialization'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddSpecialization;