import { useEffect } from 'react'
import { DragDropContext } from '@hello-pangea/dnd'
import { GlobalProvider, useGlobal } from './context/GlobalContext'
import { useGamepad } from './hooks/useGamepad'

// Components
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import CinematicModal from './components/CinematicModal'
import ImportHubModal from './components/ImportHubModal'
import TrayMenu from './components/TrayMenu'

// Pages
import TierList from './pages/TierList'
import Discover from './pages/Discover'
import Library from './pages/Library'
import Statistics from './pages/Statistics'
import Rankings from './pages/Rankings'
import AIOracle from './pages/AIOracle'
import Settings from './pages/Settings'

const AppContent = () => {
  useGamepad()
  const {
    activeTab,
    setActiveTab,
    setSelectedGame,
    setShowImportModal,
    onDragStart,
    onDragEnd,
    updateStatus
  } = useGlobal()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedGame(null)
        setShowImportModal(false)
      }

      const tabs = [
        'tierlist',
        'discover',
        'library',
        'statistics',
        'rankings',
        'oracle',
        'settings'
      ]
      const currentIndex = tabs.indexOf(activeTab)

      if (e.key === 'GamepadL1') {
        const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length
        setActiveTab(tabs[prevIndex])
      } else if (e.key === 'GamepadR1') {
        const nextIndex = (currentIndex + 1) % tabs.length
        setActiveTab(tabs[nextIndex])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTab, setActiveTab, setSelectedGame, setShowImportModal])

  const renderPage = () => {
    switch (activeTab) {
      case 'tierlist':
        return <TierList />
      case 'discover':
        return <Discover />
      case 'library':
        return <Library />
      case 'statistics':
        return <Statistics />
      case 'rankings':
        return <Rankings />
      case 'oracle':
        return <AIOracle />
      case 'settings':
        return <Settings />
      default:
        return <TierList />
    }
  }

  return (
    <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div
        className="flex h-screen text-slate-200 font-sans relative overflow-hidden"
        style={{ background: 'radial-gradient(circle at top right, #1a1638 0%, #0B0E14 40%)' }}
      >
        <Sidebar />
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
          {updateStatus === 'ready' && (
            <div
              className="w-full bg-emerald-500/20 border-b border-emerald-400/50 backdrop-blur-md px-4 py-2 flex items-center justify-center gap-4 cursor-pointer hover:bg-emerald-500/30 transition shadow-[0_0_15px_rgba(16,185,129,0.3)] z-50 shrink-0"
              onClick={() => window.api.installUpdate()}
            >
              <span className="text-emerald-400 font-bold tracking-wide">
                ✨ A new version of TierForge is ready!
              </span>
              <button className="px-3 py-1 bg-emerald-500 text-white rounded font-bold text-sm hover:scale-105 transition">
                Restart & Install
              </button>
            </div>
          )}
          <Header />
          {renderPage()}
        </main>
      </div>

      <CinematicModal />
      <ImportHubModal />
    </DragDropContext>
  )
}

export default function App() {
  if (window.location.hash === '#/tray' || window.location.hash === '#tray') {
    return <TrayMenu />
  }

  return (
    <GlobalProvider>
      <AppContent />
    </GlobalProvider>
  )
}
