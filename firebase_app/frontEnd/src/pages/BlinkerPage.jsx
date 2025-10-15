"use client"

import { useState, useEffect } from "react"
import { getCount, addBlink, resetCount } from "../services/api"

export default function BlinkerPage() {
  const [count, setCount] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [particles, setParticles] = useState([])
  const [smokeParticles, setSmokeParticles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch initial count on mount
  useEffect(() => {
    fetchCount()
  }, [])

  const fetchCount = async () => {
    const result = await getCount()
    if (result.success) {
      setCount(result.data.total_count)
      setHighScore(result.data.high_score || 0)
      setError(null)
    } else {
      setError("Could not connect to backend. Make sure Python server is running on port 5001.")
    }
    setIsLoading(false)
  }

  const handleBlink = async () => {
    if (isAnimating) return

    setIsAnimating(true)

    // Create particle effect
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      angle: i * 30 * (Math.PI / 180),
      delay: i * 0.02,
    }))
    setParticles(newParticles)

    const newSmokeParticles = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i + 1000,
      delay: i * 0.1,
      driftX: (Math.random() - 0.5) * 100, // Random horizontal drift
      driftRotation: (Math.random() - 0.5) * 180, // Random rotation
      size: 40 + Math.random() * 40, // Random size between 40-80px
      left: 45 + Math.random() * 10, // Random position around center
    }))
    setSmokeParticles(newSmokeParticles)

    // Clear particles after animation
    setTimeout(() => setParticles([]), 1000)
    setTimeout(() => setSmokeParticles([]), 2000)

    const result = await addBlink()
    if (result.success) {
      setCount(result.data.total_count)
      setHighScore(result.data.high_score || 0)
      setError(null)
    } else {
      setError("Could not save blink. Check backend connection.")
    }

    setTimeout(() => setIsAnimating(false), 400)
  }

  const handleReset = async () => {
    if (window.confirm("Are you sure you want to reset the counter? The high score will be preserved.")) {
      const result = await resetCount()
      if (result.success) {
        setCount(0)
        setHighScore(result.data.high_score || 0)
        setError(null)
      } else {
        setError("Could not reset counter. Check backend connection.")
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-cyan-50">
        <div className="text-2xl font-bold text-gray-400 animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-white to-cyan-50 p-4 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-orange-200 rounded-full opacity-20 blur-3xl float" />
        <div
          className="absolute bottom-20 right-10 w-40 h-40 bg-cyan-200 rounded-full opacity-20 blur-3xl float"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/4 w-24 h-24 bg-purple-200 rounded-full opacity-20 blur-3xl float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-12 max-w-2xl w-full">
        {/* Title */}
        <div className="text-center space-y-4">
          <h1 className="text-7xl md:text-8xl font-black text-gray-900 tracking-tight leading-none">Blinker Count</h1>
          <p className="text-xl md:text-2xl text-gray-600 font-medium">Click the button. Make it count.</p>
        </div>

        <div className="relative flex flex-col md:flex-row gap-6">
          {/* Current Count */}
          <div className="bg-white rounded-3xl shadow-2xl px-12 py-8 border-4 border-gray-900">
            <div className="text-center">
              <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Total Blinks</div>
              <div
                className={`text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-cyan-500 ${isAnimating ? "bounce-in" : ""}`}
              >
                {count.toLocaleString()}
              </div>
            </div>
          </div>

          {/* High Score */}
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl shadow-2xl px-12 py-8 border-4 border-gray-900">
            <div className="text-center">
              <div className="text-sm font-bold text-white uppercase tracking-wider mb-2">High Score</div>
              <div className="text-6xl md:text-7xl font-black text-white drop-shadow-lg">
                {highScore.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Blinker button */}
        <div className="relative">
          {/* Particle effects */}
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute top-1/2 left-1/2 w-3 h-3 bg-gradient-to-r from-orange-400 to-cyan-400 rounded-full pointer-events-none"
              style={{
                transform: `translate(-50%, -50%) translate(${Math.cos(particle.angle) * 100}px, ${Math.sin(particle.angle) * 100}px)`,
                animation: `pulse-ring 0.8s cubic-bezier(0.4, 0, 0.6, 1) ${particle.delay}s`,
              }}
            />
          ))}

          {smokeParticles.map((smoke) => (
            <div
              key={smoke.id}
              className="absolute bottom-0 pointer-events-none smoke-particle"
              style={{
                left: `${smoke.left}%`,
                width: `${smoke.size}px`,
                height: `${smoke.size}px`,
                animationDelay: `${smoke.delay}s`,
                "--drift-x": `${smoke.driftX}px`,
                "--drift-rotation": `${smoke.driftRotation}deg`,
              }}
            >
              <div className="w-full h-full rounded-full bg-gradient-to-t from-gray-300/60 via-gray-200/40 to-white/20 blur-xl" />
            </div>
          ))}

          {/* Pulse ring effect */}
          {isAnimating && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-400 to-cyan-500 pulse-ring" />
          )}

          {/* Main button */}
          <button
            onClick={handleBlink}
            disabled={isAnimating}
            className={`
              relative group
              w-64 h-64 md:w-80 md:h-80
              rounded-full
              bg-gradient-to-br from-orange-400 via-orange-500 to-cyan-500
              shadow-2xl
              border-8 border-gray-900
              transition-all duration-200
              ${isAnimating ? "scale-90" : "hover:scale-105 active:scale-95"}
              disabled:cursor-not-allowed
              overflow-hidden
            `}
          >
            {/* Button shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Button text */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full">
              <span className="text-5xl md:text-6xl font-black text-white drop-shadow-lg tracking-tight">BLINK</span>
              <span className="text-lg md:text-xl font-bold text-white/90 mt-2">Click Me!</span>
            </div>

            {/* Inner shadow for depth */}
            <div className="absolute inset-0 rounded-full shadow-inner" />
          </button>
        </div>

        <button
          onClick={handleReset}
          className="px-8 py-4 bg-gray-800 hover:bg-gray-900 text-white font-bold text-lg rounded-2xl shadow-lg border-4 border-gray-900 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          Reset Counter
        </button>

        {/* Error message */}
        {error && (
          <div className="bg-red-100 border-2 border-red-400 text-red-700 px-6 py-3 rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Instructions */}
        <div className="text-center text-gray-500 text-sm max-w-md">
          <p>Every click adds to the global counter. Join thousands of blinkers worldwide!</p>
        </div>
      </div>
    </div>
  )
}
