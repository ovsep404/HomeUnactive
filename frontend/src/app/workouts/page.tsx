"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface Exercise {
  id: string;
  name: string;
}

interface Workout {
  id: string;
  date: string;
  userId: string;
  exercises: Exercise[];
  user: any[];
}

export default function WorkoutsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  // Pour la caméra
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

if (isAuthenticated) {
  const fetchWorkouts = async () => {
    try {
      const response = await fetch('http://localhost:1111/api/workouts/1', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.workouts) {
        setWorkouts(data.workouts);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching workouts:', error);
      setLoading(false);
    }
  };

  fetchWorkouts();
}
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between py-4">
          <div className="h-8 w-40 bg-[var(--intensity-bg)] rounded animate-pulse"></div>
          <div className="h-10 w-20 bg-[var(--intensity-bg)] rounded animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[var(--card-bg)] p-4 rounded-lg shadow-[var(--shadow-sm)] animate-pulse">
              <div className="h-4 bg-[var(--intensity-bg)] rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-[var(--intensity-bg)] rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(date);
  };

  // Camera functions
  const startCamera = async () => {
    setError(null);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraOn(true);
        }
      } catch (err) {
        setError("Impossible d'accéder à la caméra.");
      }
    } else {
      setError("Votre navigateur ne supporte pas la caméra.");
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const width = videoRef.current.videoWidth;
    const height = videoRef.current.videoHeight;

    canvasRef.current.width = width;
    canvasRef.current.height = height;

    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, width, height);
      const imageDataUrl = canvasRef.current.toDataURL("image/png");
      setPhoto(imageDataUrl);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraOn(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between py-4">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Entraînements
        </h1>
        <Link
          href="/workouts/new"
          className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors duration-200"
        >
          Nouveau
        </Link>
      </header>

      {/* Camera section */}
      <div className="space-y-3 border rounded p-4 bg-[var(--card-bg)]">
        <h2 className="text-lg font-semibold mb-2 text-[var(--text-primary)]">
          Prendre une photo
        </h2>
        {!cameraOn && (
          <button
            onClick={startCamera}
            className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors duration-200"
          >
            Ouvrir la caméra
          </button>
        )}
        {error && <p className="text-red-500 mt-2">{error}</p>}

        {cameraOn && (
          <>
            <video
              ref={videoRef}
              className="rounded-lg w-full max-w-xs"
              autoPlay
              playsInline
            />
            <div className="mt-2 flex space-x-2">
              <button
                onClick={takePhoto}
                className="bg-[var(--success)] hover:bg-[var(--success-hover)] text-white font-medium py-1 px-3 rounded"
              >
                Prendre la photo
              </button>
              <button
                onClick={stopCamera}
                className="bg-[var(--danger)] hover:bg-[var(--danger-hover)] text-white font-medium py-1 px-3 rounded"
              >
                Fermer la caméra
              </button>
            </div>
          </>
        )}

        {photo && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-1">
              Photo capturée :
            </h3>
            <img
              src={photo}
              alt="Photo prise"
              className="rounded-lg max-w-xs border"
            />
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>

      {/* Workouts display */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[var(--card-bg)] p-4 rounded-lg shadow-[var(--shadow-sm)] animate-pulse"
            >
              <div className="h-4 bg-[var(--intensity-bg)] rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-[var(--intensity-bg)] rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : workouts.length === 0 ? (
        <div className="bg-[var(--card-bg)] p-4 rounded-lg shadow-[var(--shadow-sm)] text-center">
          <p className="text-[var(--text-secondary)]">
            Aucun entraînement enregistré
          </p>
          <Link
            href="/workouts/new"
            className="text-[var(--primary)] text-sm font-medium mt-2 inline-block hover:text-[var(--primary-hover)] transition-colors duration-200"
          >
            Créer un entraînement
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map((workout) => (
            <Link
              key={workout.id}
              href={`/workouts/${workout.id}`}
              className="block bg-[var(--card-bg)] p-4 rounded-lg shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow duration-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[var(--text-secondary)] text-sm">
                    {formatDate(workout.date)}
                  </p>
                  {workout.exercises.length > 0 && (
                    <div className="text-sm font-medium mt-2 text-[var(--text-primary)]">
                      Exercises: {workout.exercises.map(ex => ex.name).join(", ")}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    ID: {workout.id}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}