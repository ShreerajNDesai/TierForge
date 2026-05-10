import { DragDropContext } from '@hello-pangea/dnd';
import { GlobalProvider, useGlobal } from './context/GlobalContext';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CinematicModal from './components/CinematicModal';
import ImportHubModal from './components/ImportHubModal';

// Pages
import TierList from './pages/TierList';
import Discover from './pages/Discover';
import Library from './pages/Library';
import Statistics from './pages/Statistics';
import Rankings from './pages/Rankings';
import AIOracle from './pages/AIOracle';
import Settings from './pages/Settings';

const AppContent = () => {
  const { activeTab, onDragStart, onDragEnd } = useGlobal();

  const renderPage = () => {
    switch (activeTab) {
      case 'tierlist':
        return <TierList />;
      case 'discover':
        return <Discover />;
      case 'library':
        return <Library />;
      case 'statistics':
        return <Statistics />;
      case 'rankings':
        return <Rankings />;
      case 'oracle':
        return <AIOracle />;
      case 'settings':
        return <Settings />;
      default:
        return <TierList />;
    }
  };

  return (
    <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex h-screen text-slate-200 font-sans relative overflow-hidden" style={{ background: 'radial-gradient(circle at top right, #1a1638 0%, #0B0E14 40%)' }}>
        <Sidebar />
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
          <Header />
          {renderPage()}
        </main>
      </div>

      <CinematicModal />
      <ImportHubModal />
    </DragDropContext>
  );
};

export default function App() {
  return (
    <GlobalProvider>
      <AppContent />
    </GlobalProvider>
  );
}
