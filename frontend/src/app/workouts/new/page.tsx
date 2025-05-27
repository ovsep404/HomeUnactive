"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import VoiceRecognition from "@/components/VoiceRecognition";

// Interface pour le type Category
interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

// Interface pour l'exercice
interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight: string;
  duration: string;
  distance: string;
}

// Interface pour l'entraînement
interface Workout {
  date: string;
  categoryId: string;
  duration: number;
  intensity: number;
  notes: string;
  exercises: Exercise[];
}

const BASE_API_URL = "http://localhost:1111/api";

const staticWorkoutCategories = [
  { id: "1", name: "Musculation", color: "#4299e1", icon: "💪" },
  { id: "2", name: "Cardio", color: "#48bb78", icon: "🏃" },
  { id: "3", name: "Mobilité", color: "#ed8936", icon: "🧘" },
  { id: "4", name: "Sports collectifs", color: "#9f7aea", icon: "⚽" },
  { id: "5", name: "Natation", color: "#38b2ac", icon: "🏊" },
  { id: "6", name: "Vélo", color: "#f56565", icon: "🚴" }
];

export default function NewWorkoutPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // État pour l'entraînement
  const [workout, setWorkout] = useState<Workout>({
    date: new Date().toISOString().split('T')[0],
    categoryId: "",
    duration: 30,
    intensity: 5,
    notes: "",
    exercises: []
  });
  
  const [currentExercise, setCurrentExercise] = useState<Exercise>({
    name: "",
    sets: 3,
    reps: 10,
    weight: "",
    duration: "",
    distance: ""
  });
  
  // Voice recognition states
  const [voiceTarget, setVoiceTarget] = useState<"notes" | "exercise" | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Récupérer les catégories au chargement du composant
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchCategories = async () => {
      try {
        setLoading(true);
        
        // Tentative de récupération des catégories depuis l'API
        try {
          const response = await fetch(`${BASE_API_URL}/workout-categories`, {
            credentials: 'include',
          });
          
          if (response.ok) {
            const data = await response.json();
            setCategories(data);
            return;
          }
          
          // Si l'API échoue, utilisez les données statiques
          console.warn("Impossible d'accéder à l'API, utilisation de données statiques");
          setCategories(staticWorkoutCategories);
        } catch (apiError) {
          console.error("Erreur API:", apiError);
          // Utiliser les données statiques en cas d'erreur
          setCategories(staticWorkoutCategories);
        }
      } catch (err) {
        console.error('Erreur:', err);
        setError('Impossible de charger les catégories d\'entraînement');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, [isAuthenticated]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between py-4">
          <div className="h-8 w-40 bg-[var(--intensity-bg)] rounded animate-pulse"></div>
          <div className="h-10 w-20 bg-[var(--intensity-bg)] rounded animate-pulse"></div>
        </div>
        <div className="bg-[var(--card-bg)] p-6 rounded-lg shadow-[var(--shadow-sm)]">
          <div className="space-y-4">
            <div className="h-6 bg-[var(--intensity-bg)] rounded w-1/3 animate-pulse"></div>
            <div className="h-4 bg-[var(--intensity-bg)] rounded w-full animate-pulse"></div>
            <div className="h-4 bg-[var(--intensity-bg)] rounded w-2/3 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render the page if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const handleCategorySelect = (categoryId: string) => {
    setWorkout({ ...workout, categoryId });
    setStep(2);
  };

  const handleBasicInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  const handleAddExercise = (e: React.FormEvent) => {
    e.preventDefault();
    setWorkout({
      ...workout,
      exercises: [...workout.exercises, currentExercise]
    });
    setCurrentExercise({
      name: "",
      sets: 3,
      reps: 10,
      weight: "",
      duration: "",
      distance: ""
    });
  };

  const handleRemoveExercise = (index: number) => {
    const updatedExercises = [...workout.exercises];
    updatedExercises.splice(index, 1);
    setWorkout({ ...workout, exercises: updatedExercises });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // 1. Créer l'entraînement sans les exercices
      const workoutToSubmit = {
        categoryId: workout.categoryId,
        date: workout.date,
        duration: workout.duration,
        intensity: workout.intensity,
        notes: workout.notes
      };

      const workoutResponse = await fetch(`${BASE_API_URL}/workouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(workoutToSubmit)
      });
      
      if (!workoutResponse.ok) {
        throw new Error('Erreur lors de la création de l\'entraînement');
      }
      
      const workoutData = await workoutResponse.json();
      const workoutId = workoutData.workout.id;
      
      // 2. Ajouter les exercices
      for (const exercise of workout.exercises) {
        const exerciseResponse = await fetch(`${BASE_API_URL}/exercises`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            ...exercise,
            workoutId: workoutId
          })
        });
        
        if (!exerciseResponse.ok) {
          throw new Error('Erreur lors de l\'ajout des exercices');
        }
      }
      
      // 3. Rediriger vers la page de détail de l'entraînement
      router.push(`/workouts/`);
    } catch (error) {
      console.error("Error submitting workout:", error);
      setIsSubmitting(false);
    }
  };

  // Handle voice recognition results
  const handleVoiceResult = (transcript: string) => {
    setVoiceTranscript(transcript);
  };

  // Handle final voice recognition results
  const handleVoiceFinalResult = (transcript: string) => {
    if (voiceTarget === "notes") {
      // For notes, just use the transcript directly
      setWorkout({
        ...workout,
        notes: workout.notes ? `${workout.notes}\n${transcript}` : transcript
      });
      
      // Show success message
      alert("Notes vocales ajoutées avec succès!");
    } else if (voiceTarget === "exercise") {
      // Try to extract exercise information from voice input
      const exerciseName = transcript.match(/exercice (.*?)(?:\s\d|$)/i)?.[1] || 
                          transcript.match(/^(.*?)(?:\s\d|$)/i)?.[1] || 
                          transcript;
      
      // Try to extract sets, reps, and weight information
      const setsMatch = transcript.match(/(\d+)\s*séries/i) || transcript.match(/(\d+)\s*series/i);
      const repsMatch = transcript.match(/(\d+)\s*répétitions/i) || transcript.match(/(\d+)\s*reps/i) || transcript.match(/(\d+)\s*répés/i);
      const weightMatch = transcript.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilos)/i);
      const durationMatch = transcript.match(/(\d+)\s*(?:min|minutes)/i);
      const distanceMatch = transcript.match(/(\d+(?:\.\d+)?)\s*(?:km|kilomètres|mètres|m)/i);
      
      // Create new exercise object with extracted information
      const newExercise = {
        name: exerciseName.trim() || currentExercise.name,
        sets: setsMatch ? parseInt(setsMatch[1]) : currentExercise.sets,
        reps: repsMatch ? parseInt(repsMatch[1]) : currentExercise.reps,
        weight: weightMatch ? weightMatch[1] : currentExercise.weight,
        duration: durationMatch ? durationMatch[1] : currentExercise.duration,
        distance: distanceMatch ? distanceMatch[1] : currentExercise.distance
      };
      
      setCurrentExercise(newExercise);
      
      // If we have a name and at least one other property with a value, automatically add the exercise
      if (newExercise.name && (newExercise.sets > 0 || newExercise.reps > 0 || newExercise.weight || newExercise.duration || newExercise.distance)) {
        setWorkout({
          ...workout,
          exercises: [...workout.exercises, newExercise]
        });
        
        // Reset current exercise
        setCurrentExercise({
          name: "",
          sets: 3,
          reps: 10,
          weight: "",
          duration: "",
          distance: ""
        });
        
        // Show success message
        alert(`Exercice "${newExercise.name}" ajouté avec succès!`);
      }
    }
    
    // Reset voice target and transcript
    setVoiceTarget(null);
    setIsVoiceRecording(false);
  };

  // Start voice recording for a specific target
  const startVoiceRecording = (target: "notes" | "exercise") => {
    setVoiceTarget(target);
    setIsVoiceRecording(true);
  };

  // Affichage du message de chargement
  if (loading) {
    return <div className="flex justify-center items-center p-10">Chargement des catégories...</div>;
  }
  
  // Affichage du message d'erreur
  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  const selectedCategory = categories.find(c => c.id === workout.categoryId);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between py-4">
        <h1 className="text-2xl font-bold">Nouvel entraînement</h1>
        <Link 
          href="/workouts" 
          className="text-gray-600 dark:text-gray-400"
        >
          Annuler
        </Link>
      </header>
      
      {/* Voice Recognition Component */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-blue-800 dark:text-blue-200 font-medium">Enregistrement vocal</h3>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => startVoiceRecording("notes")}
              className={`px-3 py-1 text-sm rounded-full ${voiceTarget === "notes" ? "bg-blue-600 text-white" : "bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200"}`}
              disabled={isVoiceRecording}
            >
              Notes
            </button>
            <button
              type="button"
              onClick={() => startVoiceRecording("exercise")}
              className={`px-3 py-1 text-sm rounded-full ${voiceTarget === "exercise" ? "bg-blue-600 text-white" : "bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200"}`}
              disabled={isVoiceRecording}
            >
              Exercice
            </button>
          </div>
        </div>
        
        <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
          Utilisez la reconnaissance vocale pour ajouter rapidement des notes ou des exercices à votre séance.
        </p>
        
        {isVoiceRecording ? (
          <div>
            <VoiceRecognition
              onResult={handleVoiceResult}
              onFinalResult={handleVoiceFinalResult}
              language="fr-FR"
              continuous={false}
              className="mb-2"
            />
            {voiceTranscript && (
              <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Transcription en cours:</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{voiceTranscript}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => voiceTarget ? setIsVoiceRecording(true) : startVoiceRecording("notes")}
              className="flex items-center justify-center p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
              disabled={!voiceTarget && !navigator.mediaDevices}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span className="ml-2">Commencer l'enregistrement</span>
            </button>
          </div>
        )}
        
        <div className="mt-3 text-xs text-blue-600 dark:text-blue-400">
          <p>💡 <strong>Astuces pour les exercices:</strong> "Développé couché 4 séries 10 répétitions 70 kg"</p>
          <p>💡 <strong>Astuces pour les notes:</strong> "Séance intense, bonne progression sur les squats"</p>
        </div>
      </div>

      {step === 1 && (
        <div>
          <h2 className="text-lg font-medium mb-4">Choisissez une catégorie</h2>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col items-center justify-center text-center h-24"
                style={{ borderLeft: `4px solid ${category.color}` }}
              >
                <span className="text-2xl mb-2">{category.icon}</span>
                <span className="font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleBasicInfoSubmit} className="space-y-4">
          <h2 className="text-lg font-medium mb-4">Informations de base</h2>
          
          {selectedCategory && (
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm mb-4 flex items-center">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center mr-3 text-xl"
                style={{ backgroundColor: selectedCategory.color + "20", color: selectedCategory.color }}
              >
                {selectedCategory.icon}
              </div>
              <div>
                <p className="font-medium">{selectedCategory.name}</p>
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-blue-600 dark:text-blue-400"
                >
                  Changer
                </button>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date
              </label>
              <input
                type="date"
                id="date"
                value={workout.date}
                onChange={(e) => setWorkout({ ...workout, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
                required
              />
            </div>
            
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Durée (minutes)
              </label>
              <input
                type="number"
                id="duration"
                min="1"
                max="300"
                value={workout.duration}
                onChange={(e) => setWorkout({ ...workout, duration: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
                required
              />
            </div>
            
            <div>
              <label htmlFor="intensity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Intensité (1-10): {workout.intensity}
              </label>
              <input
                type="range"
                id="intensity"
                min="1"
                max="10"
                value={workout.intensity}
                onChange={(e) => setWorkout({ ...workout, intensity: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Facile</span>
                <span>Modéré</span>
                <span>Intense</span>
              </div>
            </div>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <div className="relative">
                <textarea
                  id="notes"
                  value={workout.notes}
                  onChange={(e) => setWorkout({ ...workout, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
                  placeholder="Comment s'est passé votre entraînement?"
                ></textarea>
                <button
                  type="button"
                  onClick={() => startVoiceRecording("notes")}
                  className={`absolute bottom-2 right-2 p-2 rounded-full ${
                    isVoiceRecording && voiceTarget === "notes"
                      ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" 
                      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Continuer
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-lg font-medium mb-4">Exercices</h2>
          
          {workout.exercises.length > 0 && (
            <div className="space-y-3 mb-6">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Exercices ajoutés:</p>
              {workout.exercises.map((exercise, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm flex justify-between items-center">
                  <div>
                    <p className="font-medium">{exercise.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {exercise.sets} séries × {exercise.reps} répétitions
                      {exercise.weight && ` • ${exercise.weight} kg`}
                      {exercise.duration && ` • ${exercise.duration} sec`}
                      {exercise.distance && ` • ${exercise.distance} km`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveExercise(index)}
                    className="text-red-600 dark:text-red-400"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <h3 className="font-medium mb-3">Ajouter un exercice</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="exerciseName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom de l'exercice
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="exerciseName"
                    value={currentExercise.name}
                    onChange={(e) => setCurrentExercise({ ...currentExercise, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
                    placeholder="ex: Squat, Développé couché..."
                  />
                  <button
                    type="button"
                    onClick={() => startVoiceRecording("exercise")}
                    className={`ml-2 p-2 rounded-full ${
                      isVoiceRecording && voiceTarget === "exercise"
                        ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" 
                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                </div>
                {voiceTranscript && voiceTarget === "exercise" && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Transcription: {voiceTranscript}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="sets" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Séries
                  </label>
                  <input
                    type="number"
                    id="sets"
                    min="1"
                    value={currentExercise.sets}
                    onChange={(e) => setCurrentExercise({ ...currentExercise, sets: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label htmlFor="reps" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Répétitions
                  </label>
                  <input
                    type="number"
                    id="reps"
                    min="1"
                    value={currentExercise.reps}
                    onChange={(e) => setCurrentExercise({ ...currentExercise, reps: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Poids (kg)
                  </label>
                  <input
                    type="number"
                    id="weight"
                    min="0"
                    step="0.5"
                    value={currentExercise.weight}
                    onChange={(e) => setCurrentExercise({ ...currentExercise, weight: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
                    placeholder="Optionnel"
                  />
                </div>
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Durée (sec)
                  </label>
                  <input
                    type="number"
                    id="duration"
                    min="0"
                    value={currentExercise.duration}
                    onChange={(e) => setCurrentExercise({ ...currentExercise, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
                    placeholder="Optionnel"
                  />
                </div>
                <div>
                  <label htmlFor="distance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Distance (km)
                  </label>
                  <input
                    type="number"
                    id="distance"
                    min="0"
                    step="0.1"
                    value={currentExercise.distance}
                    onChange={(e) => setCurrentExercise({ ...currentExercise, distance: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
                    placeholder="Optionnel"
                  />
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleAddExercise}
                disabled={!currentExercise.name}
                className={`w-full py-2 px-4 rounded-md text-sm font-medium ${
                  currentExercise.name 
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" 
                    : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed"
                }`}
              >
                Ajouter cet exercice
              </button>
            </div>
          </div>
          
          <div className="pt-4 space-y-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enregistrement...
                </>
              ) : "Enregistrer l'entraînement"}
            </button>
            
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Retour
            </button>
          </div>
        </form>
      )}
    </div>
  );
}