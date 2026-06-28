import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Monitor, Sparkles, Clock, Key, ChevronRight, Check } from 'lucide-react'
import { useGlobal } from '../context/GlobalContext'

const SLIDES = [
  {
    id: 'welcome',
    title: 'Welcome to TierForge',
    description: 'The ultimate, intelligent hub for all your PC games. Let us show you around.',
    icon: <Monitor size={80} className="text-primary-400 mb-6" />
  },
  {
    id: 'scanning',
    title: 'Smart PC Scanning',
    description:
      'We automatically detect all installed games from Steam, Epic, Xbox, and more. No manual entry required. We bring order to the chaos.',
    icon: <Monitor size={80} className="text-indigo-400 mb-6" />
  },
  {
    id: 'ai-oracle',
    title: 'The AI Oracle',
    description:
      'Powered by advanced AI models, the Oracle analyzes your backlog and playtime to recommend exactly what you should play next based on your current vibe.',
    icon: <Sparkles size={80} className="text-yellow-400 mb-6" />
  },
  {
    id: 'tracking',
    title: 'Auto-Tracking & Cloud Saves',
    description:
      'Launch games directly from TierForge. We automatically track your playtime and seamlessly back up your precious save files to the cloud.',
    icon: <Clock size={80} className="text-green-400 mb-6" />
  },
  {
    id: 'setup',
    title: 'Unlock Full Potential',
    description:
      'To enable AI recommendations, rich metadata, and library syncing, you will need to add a few free API keys.',
    icon: <Key size={80} className="text-red-400 mb-6" />
  }
]

export const FTUEWizard: React.FC = () => {
  const { setShowFTUE, setActiveTab, setRunTour } = useGlobal()
  const [currentSlide, setCurrentSlide] = useState(0)

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide((prev) => prev + 1)
    }
  }

  const handleFinish = async (targetTab: string) => {
    // Mark as seen in SQLite
    if (window.api && window.api.saveSetting && window.api.getSetting) {
      await window.api.saveSetting('has_seen_intro', 'true')
      const finishedTour = await window.api.getSetting('has_finished_interactive_tour')
      if (finishedTour !== 'true') {
        setRunTour(true)
      }
    }
    setShowFTUE(false)
    setActiveTab(targetTab)
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      {/* Glassmorphic Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />

      {/* Main Content Modal */}
      <div className="relative z-10 w-full max-w-4xl h-[550px] bg-slate-900/50 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.95 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex-1 flex flex-col items-center justify-center p-8 text-center"
          >
            {SLIDES[currentSlide].icon}
            <h1 className="text-5xl font-black text-white tracking-tight mb-6">
              {SLIDES[currentSlide].title}
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto font-medium">
              {SLIDES[currentSlide].description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Footer / Controls */}
        <div className="h-24 shrink-0 bg-black/40 border-t border-white/10 flex items-center justify-between px-10">
          {/* Progress Indicators */}
          <div className="flex gap-3">
            {SLIDES.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-500 ${
                  index === currentSlide ? 'w-8 bg-primary-500' : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div>
            {currentSlide < SLIDES.length - 1 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-8 py-3 rounded-xl font-bold transition shadow-[0_0_20px_rgba(79,70,229,0.4)]"
              >
                Next <ChevronRight size={20} />
              </button>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={() => handleFinish('Library')}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/10 px-6 py-3 rounded-xl font-bold transition"
                >
                  Go to Library
                </button>
                <button
                  onClick={() => handleFinish('Settings')}
                  className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-8 py-3 rounded-xl font-bold transition shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                >
                  <Check size={20} />
                  Setup API Keys
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
