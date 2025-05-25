import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import config from '../config';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Loader2, Search, Play, RefreshCw, ArrowLeft, Music, Volume2 } from "lucide-react";

const SongRecommendations = () => {
  const navigate = useNavigate();
  const [genre, setGenre] = useState("");
  const [songName, setSongName] = useState("");
  const [playingSong, setPlayingSong] = useState(null);
  const [playingSongUrl, setPlayingSongUrl] = useState(null);
  const [playingSongGithubUrl, setPlayingSongGithubUrl] = useState(null);
  const [error, setError] = useState("");
  const [stressLevel, setStressLevel] = useState("Moderate");
  const [stressProbability, setStressProbability] = useState(0.5);
  const [recommendedSongs, setRecommendedSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Fetch recommended songs based on stress level on component mount
  useEffect(() => {
    const savedStressLevel = localStorage.getItem("stressLevel");
    const savedProbability = localStorage.getItem("stressProbability");
    
    if (savedStressLevel) {
      setStressLevel(savedStressLevel);
    }
    
    if (savedProbability) {
      setStressProbability(parseFloat(savedProbability));
      fetchRecommendedSongs(parseFloat(savedProbability));
    } else {
      fetchRecommendedSongs(0.5);
    }
  }, []);
  
  // Fetch recommended songs from the backend
  const fetchRecommendedSongs = async (probability) => {
  setLoading(true);
  setError("");
  try {
    console.log(`Fetching recommendations for probability: ${probability}`);
    
    const apiUrl = config.api.getUrl('STRESS_API', `/recommendations?probability=${probability}`);
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (response.ok) {
      console.log("Received recommendation data:", data);
      if (data.recommendations && data.recommendations.songs) {
        const formattedSongs = data.recommendations.songs.map(filename => {
          // Log the original filename to debug
          console.log("Processing filename:", filename);
          
          // Handle different filename formats
          let genre, songId;
          if (filename.includes('.')) {
            // Format: "genre.songId.wav" or "genre.songId"
            const parts = filename.split('.');
            genre = parts[0];
            songId = parts[1];
          } else {
            // Handle other formats if needed
            // You might need to adjust this based on your actual data format
            console.warn("Unexpected filename format:", filename);
            const parts = filename.split('_'); // or another delimiter
            genre = parts[0] || 'unknown';
            songId = parts[1] || filename;
          }
          
          return {
            genre: genre,
            songId: songId, // Use songId instead of filename
            originalFilename: filename, // Keep original for debugging
            title: `${genre.charAt(0).toUpperCase() + genre.slice(1)} - ${songId}`
          };
        });
        console.log("Formatted songs:", formattedSongs);
        setRecommendedSongs(formattedSongs);
      } else {
        console.error("Missing recommendations or songs in response:", data);
        setError("Received invalid data format from server.");
        setRecommendedSongs([]);
      }
    } else {
      console.error("Failed to fetch recommendations:", data);
      setError(data.error || "Failed to fetch song recommendations.");
      setRecommendedSongs([]);
    }
  } catch (err) {
    console.error("Error fetching song recommendations:", err);
    setError("An error occurred while fetching song recommendations.");
    setRecommendedSongs([]);
  } finally {
    setLoading(false);
  }
};

  
  // Handle form submission for song search
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!genre || !songName) {
      setError("Please enter both genre and song name");
      return;
    }
    
    setSearchLoading(true);
    setError("");
    
    try {
      // Use config to get the API URL
      const apiUrl = config.api.getUrl('STRESS_API', '/song_search');
      
      const response = await fetch(apiUrl, {
        method: "POST",
        mode: 'cors',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          genre: genre,
          song_name: songName,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log("Setting up audio player with URLs:", {
          github: data.full_url,
          proxy: data.proxy_url
        });
        setPlayingSong(`${genre} - ${songName}`);
        // Try proxy URL first, then fallback to GitHub
        setPlayingSongUrl(data.proxy_url || data.full_url);
        setPlayingSongGithubUrl(data.full_url);
        setError("");
      } else {
        setError(data.error || "Song not found. Please try again.");
        setPlayingSong(null);
        setPlayingSongUrl(null);
      }
    } catch (err) {
      console.error("Error searching for song:", err);
      setError("An error occurred while searching for the song. Please check if the backend server is running.");
      setPlayingSong(null);
      setPlayingSongUrl(null);
    } finally {
      setSearchLoading(false);
    }
  };
  
  // Play a song from the recommended list
  const playSong = async (song) => {
  setSearchLoading(true);
  setError("");
  
  // Clear previous audio state to prevent caching issues
  setPlayingSong(null);
  setPlayingSongUrl(null);
  setPlayingSongGithubUrl(null);
  
  try {
    console.log("Attempting to play song:", song);
    
    const apiUrl = config.api.getUrl('STRESS_API', '/song_search');
    
    const requestBody = {
      genre: song.genre,
      song_name: song.songId, // Use songId instead of filename
    };
    
    console.log("Request body:", requestBody);
    
    const response = await fetch(apiUrl, {
      method: "POST",
      mode: 'cors',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    
    const data = await response.json();
    console.log("Song search response:", data);
    
    if (response.ok && data.success) {
      console.log("Setting up audio player with URLs:", {
        github: data.full_url,
        proxy: data.proxy_url
      });
      
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const proxyUrlWithTimestamp = data.proxy_url ? `${data.proxy_url}?t=${timestamp}` : null;
      const githubUrlWithTimestamp = `${data.full_url}?t=${timestamp}`;
      
      setPlayingSong(song.title);
      setPlayingSongUrl(proxyUrlWithTimestamp || githubUrlWithTimestamp);
      setPlayingSongGithubUrl(githubUrlWithTimestamp);
    } else {
      setError(data.error || "Failed to play song. Please try again.");
    }
  } catch (err) {
    console.error("Error playing song:", err);
    setError("An error occurred while trying to play the song. Please check if the backend server is running.");
  } finally {
    setSearchLoading(false);
  }
};
  
  // Go back to home
  const goToHome = () => {
    navigate("/stress");
  };

  // Handle audio error and try fallback URLs
  const handleAudioError = (originalUrl, githubUrl) => {
    console.log("Audio failed to load, trying GitHub URL:", githubUrl);
    if (originalUrl !== githubUrl) {
      setPlayingSongUrl(githubUrl);
    } else {
      setError("Unable to play audio. The file may not be accessible.");
    }
  };

  // Debug function to manually refresh recommendations
  const refreshRecommendations = () => {
    fetchRecommendedSongs(stressProbability);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Song Recommendations
        </h1>
        <p className="text-xl text-gray-600">
          Find songs based on your stress level or search for specific genres
        </p>
      </div>
      
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column: Song search form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search for a Song
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="genre">Genre</Label>
                <Input
                  id="genre"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="e.g. blues, classical, country..."
                  required
                />
                <p className="text-xs text-gray-500">
                  Available genres: blues, classical, country, disco, hiphop, jazz, metal, pop, reggae, rock
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="songName">Song Name</Label>
                <Input
                  id="songName"
                  value={songName}
                  onChange={(e) => setSongName(e.target.value)}
                  placeholder="e.g. 00042"
                  required
                />
                <p className="text-xs text-gray-500">
                  Enter song ID without .wav extension
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={searchLoading}
              >
                {searchLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search Song
                  </>
                )}
              </Button>
            </form>
            
            {/* Audio Player */}
            {playingSong && playingSongUrl && (
              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center gap-2 text-lg font-medium">
                  <Volume2 className="h-5 w-5 text-green-600" />
                  Now Playing: {playingSong}
                </div>
                <div className="text-sm text-gray-600 break-all">
                  URL: {playingSongUrl}
                </div>
                
                <div className="space-y-2">
                  <audio 
                    key={playingSongUrl} // Force re-render when URL changes
                    controls 
                    className="w-full"
                    crossOrigin="anonymous"
                    preload="metadata"
                    onError={(e) => {
                      console.error("Audio error:", e);
                      console.error("Audio error details:", e.target.error);
                      handleAudioError(playingSongUrl, playingSongGithubUrl);
                    }}
                    onLoadStart={() => console.log("Audio loading started for:", playingSongUrl)}
                    onCanPlay={() => console.log("Audio can play:", playingSongUrl)}
                    onLoadedData={() => console.log("Audio data loaded:", playingSongUrl)}
                  >
                    <source src={playingSongUrl} type="audio/wav" />
                    <source src={playingSongUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(playingSongGithubUrl || playingSongUrl, '_blank')}
                    >
                      Open in New Tab
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        // Create new audio instance to avoid caching
                        const audio = new Audio(playingSongUrl);
                        audio.crossOrigin = "anonymous";
                        audio.play().catch(e => {
                          console.error("Direct play failed:", e);
                          setError("Direct audio playback failed. Try opening in new tab.");
                        });
                      }}
                    >
                      Try Direct Play
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Right column: Recommended songs based on stress level */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Recommended for Your Stress Level: {stressLevel}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={refreshRecommendations}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              These songs are specifically selected to help with {stressLevel.toLowerCase()} stress levels.
              (Probability: {stressProbability.toFixed(2)})
            </p>
            
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : recommendedSongs.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recommendedSongs.map((song, index) => (
                  <div key={index}>
                    <Button
                      variant={playingSong === song.title ? "default" : "ghost"}
                      className="w-full justify-start text-left h-auto py-3"
                      onClick={() => playSong(song)}
                      disabled={searchLoading}
                    >
                      <div className="flex items-center gap-3">
                        <Play className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{song.title}</span>
                      </div>
                    </Button>
                    {index < recommendedSongs.length - 1 && (
                      <Separator className="my-1" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Music className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No recommendations available.</p>
                <p className="text-sm">Please try analyzing a video first or click "Refresh".</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between items-center mt-12 pt-8 border-t">
        <Button 
          variant="outline"
          onClick={goToHome}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Stress Detection
        </Button>
      </div>
    </div>
  );
};

export default SongRecommendations;