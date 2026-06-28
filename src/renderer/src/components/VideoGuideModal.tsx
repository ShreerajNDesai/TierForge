import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, PlayCircle } from 'lucide-react'
import { useGlobal } from '../context/GlobalContext'

// Map of guide keys to their respective YouTube embed URLs
// We use placeholder YouTube URLs here since the actual URLs weren't provided.
const VIDEO_GUIDES: Record<string, { title: string; url: string; description: string }> = {
  gemini: {
    title: 'How to get a Google Gemini API Key',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
    description: 'Learn how to generate a free Google Gemini API key to power the AI Oracle.'
  },
  steam: {
    title: 'How to get your Steam ID and Web API Key',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    description: 'Find your Steam ID64 and generate a Web API key for perfect library syncing.'
  },
  igdb: {
    title: 'How to get IGDB Client ID & Secret',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    description: 'Setup Twitch Developer credentials to unlock rich metadata from IGDB.'
  },
  rawg: {
    title: 'How to get a RAWG API Key',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    description: 'Generate a free RAWG key to fetch high quality game screenshots and details.'
  }
}

export const VideoGuideModal: React.FC = () => {
  const { activeVideoGuide, setActiveVideoGuide } = useGlobal()

  if (!activeVideoGuide || !VIDEO_GUIDES[activeVideoGuide]) return null

  const guide = VIDEO_GUIDES[activeVideoGuide]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-8">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setActiveVideoGuide(null)}
          className="absolute inset-0 bg-black/90 backdrop-blur-md cursor-pointer"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="relative z-10 w-full max-w-5xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/40">
            <div className="flex items-center gap-3">
              <PlayCircle className="text-primary-400" size={24} />
              <div>
                <h2 className="text-xl font-bold text-white leading-tight">{guide.title}</h2>
                <p className="text-sm text-slate-400">{guide.description}</p>
              </div>
            </div>
            <button
              onClick={() => setActiveVideoGuide(null)}
              className="p-2 hover:bg-white/10 rounded-full transition text-slate-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>

          {/* Video Player (16:9 Aspect Ratio) */}
          <div className="relative w-full aspect-video bg-black">
            <iframe
              src={guide.url}
              title={guide.title}
              className="absolute top-0 left-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
