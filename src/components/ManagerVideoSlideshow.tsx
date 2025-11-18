import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Import videos - Vite will handle these as static assets
import video1 from '../demo-video/manager/1.webm';
import video2 from '../demo-video/manager/2.webm';
import video3 from '../demo-video/manager/3.webm';
import video4 from '../demo-video/manager/4.webm';
import video5 from '../demo-video/manager/5.webm';
import video6 from '../demo-video/manager/6.webm';

const VIDEOS = [video1, video2, video3, video4, video5, video6];
const VIDEO_DURATION = 5000; // 5 seconds per video

const VIDEO_FEATURES = [
  "Meeting Analytics",
  "Customizable Visualizations",
  "SDR Progress Tracking",
  "Meeting Calendar",
  "Client Assignments",
  "Historical Data Tracking",
];

const VIDEO_DESCRIPTIONS = [
  "Get a complete overview of your team's performance and all scheduled meetings in one centralized dashboard.",
  "Fully customizable performance visualizations that adapt to your team's unique metrics and goals.",
  "Drill down into individual SDR performance with detailed progress tracking and insights.",
  "Access all scheduled meetings through flexible calendar views—month, week, day, or agenda format.",
  "Efficiently manage client assignments with comprehensive tracking metrics and key performance indicators.",
  "Never lose track of historical data—easily navigate to previous months to review past meetings and performance.",
];

export default function ManagerVideoSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Handle video playback when index changes
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentIndex) {
          video.currentTime = 0;
          video.play().catch(() => {
            // Auto-play may be blocked, that's okay
          });
        } else {
          video.pause();
        }
      }
    });
  }, [currentIndex]);

  // Auto-advance slideshow (paused on hover)
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % VIDEOS.length);
    }, VIDEO_DURATION);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Reset video when switching
  const handleVideoChange = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + VIDEOS.length) % VIDEOS.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % VIDEOS.length);
  };

  return (
    <div className="w-full">
      {/* Carousel container with gradient background */}
      <div className="relative bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 rounded-2xl p-6 shadow-xl border border-indigo-100">
        <div
          className="relative bg-black rounded-xl shadow-2xl overflow-hidden border-2 border-indigo-200"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Video container - made bigger */}
          <div className="relative" style={{ aspectRatio: '16/10' }}>
            {VIDEOS.map((videoPath, index) => (
              <video
                key={index}
                ref={(el) => {
                  videoRefs.current[index] = el;
                }}
                src={videoPath}
                loop
                muted
                playsInline
                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 ${
                  index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              />
            ))}

            {/* Previous button */}
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/95 hover:bg-white text-indigo-600 rounded-full p-3 shadow-xl transition-all duration-200 hover:scale-110 border-2 border-indigo-100"
              aria-label="Previous video"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Next button */}
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/95 hover:bg-white text-indigo-600 rounded-full p-3 shadow-xl transition-all duration-200 hover:scale-110 border-2 border-indigo-100"
              aria-label="Next video"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Progress indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full">
              {VIDEOS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleVideoChange(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'w-10 bg-white shadow-lg'
                      : 'w-2.5 bg-white/60 hover:bg-white/80'
                  }`}
                  aria-label={`Go to video ${index + 1}`}
                />
              ))}
            </div>

            {/* Video counter */}
            <div className="absolute top-4 right-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-full backdrop-blur-sm z-20 shadow-lg border border-white/20">
              {currentIndex + 1} / {VIDEOS.length}
            </div>
          </div>
        </div>

        {/* Description text below video with enhanced styling */}
        <div className="mt-6 px-2">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-indigo-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
                {VIDEO_FEATURES[currentIndex]}
              </span>
            </div>
            <p className="text-xl text-gray-800 leading-relaxed font-medium">
              {VIDEO_DESCRIPTIONS[currentIndex]}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

