import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

const AddCoursePage = () => {
  const [notification, setNotification] = useState(null);
  const [quizInputs, setQuizInputs] = useState({
    quizQuestions: ['', '', '', '', ''],
    quizAnswers: ['', '', '', '', '']
  });
  
  // Initialize form with react-hook-form
  const form = useForm({
    defaultValues: {
      lessonName: '',
      subject: '',
      complexity: '',
      image: '',
      learningMaterial: '',
      source: '',
      heading: '',
      textContent: '',
      assignmentContent: '',
      description: '',
    }
  });

  const { watch, setValue, getValues } = form;
  
  // Watch for changes in the learning material type
  const learningMaterial = watch('learningMaterial');

  // Handle quiz form input changes
  const handleQuizChange = (index, field, value) => {
    const updated = [...quizInputs[field]];
    updated[index] = value;
    setQuizInputs({
      ...quizInputs,
      [field]: updated
    });
  };

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      // Get the API URL
      const apiUrl = config.api.getUrl('MAIN_API', '/api/course/add');
      if (!apiUrl) {
        console.error("Failed to get MAIN_API URL for adding course");
        setNotification({
          type: 'error',
          message: 'Failed to add course - API configuration error.'
        });
        return;
      }

      const payload = {
        ...data,
        quizQuestions: quizInputs.quizQuestions.filter(q => q.trim() !== ''),
        quizAnswers: quizInputs.quizAnswers.filter(a => a.trim() !== '')
      };

      const response = await axios.post(apiUrl, payload);
      console.log('Course content added successfully:', response.data);
      
      setNotification({
        type: 'success',
        message: 'Course content added successfully!'
      });

      form.reset();
      setQuizInputs({
        quizQuestions: ['', '', '', '', ''],
        quizAnswers: ['', '', '', '', '']
      });

      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (error) {
      console.error('Error adding course content:', error.response?.data || error.message);
      
      // Show error notification
      setNotification({
        type: 'error',
        message: 'Failed to add course content.'
      });
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Add Course Content</h1>
        
        {notification && (
          <Alert className={`mb-6 ${notification.type === 'success' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700'}`}>
            <AlertDescription>{notification.message}</AlertDescription>
          </Alert>
        )}

        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Course Details Section */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="lessonName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lesson Name</FormLabel>
                        <FormControl>
                          <Input {...field} required />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                            <SelectItem value="volume and capacity">Volume and capacity</SelectItem>
                            <SelectItem value="area">Area</SelectItem>
                            <SelectItem value="probability">Probability</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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

                  <FormField
                    control={form.control}
                    name="learningMaterial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Learning Material Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select material type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="audio">Audio</SelectItem>
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="assignment">Assignment</SelectItem>
                            <SelectItem value="quiz">Quiz</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Conditional Fields Based on Learning Material Type */}
                <div className="space-y-4">
                  {(learningMaterial === 'video' ||
                  learningMaterial === 'audio' ||
                  learningMaterial === 'pdf') && (
                    <FormField
                      control={form.control}
                      name="source"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source Link</FormLabel>
                          <FormControl>
                            <Input {...field} required />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {learningMaterial === 'text' && (
                    <>
                      <FormField
                        control={form.control}
                        name="heading"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Heading</FormLabel>
                            <FormControl>
                              <Input {...field} required />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="textContent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                className="min-h-[150px]" 
                                required 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {learningMaterial === 'assignment' && (
                    <FormField
                      control={form.control}
                      name="assignmentContent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assignment Content</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              className="min-h-[200px]" 
                              required 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {learningMaterial === 'quiz' && (
                    <div className="space-y-6">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <h3 className="font-medium mb-3">Question {i + 1}</h3>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm text-gray-700">Question</Label>
                              <Input 
                                value={quizInputs.quizQuestions[i]}
                                onChange={(e) => handleQuizChange(i, 'quizQuestions', e.target.value)}
                                className="mt-1"
                                required
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-gray-700">Answer</Label>
                              <Input 
                                value={quizInputs.quizAnswers[i]}
                                onChange={(e) => handleQuizChange(i, 'quizAnswers', e.target.value)}
                                className="mt-1"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Description Field */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          className="min-h-[150px]" 
                          required 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <div className="pt-4">
                  <Button 
                    type="submit"
                    className="w-full sm:w-auto"
                  >
                    Add Course Content
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

export default AddCoursePage;