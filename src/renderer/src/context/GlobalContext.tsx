import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  ReactNode
} from 'react'

// emptyData removed — tier structure is now derived via useMemo from allGames

interface GlobalContextType {
  data: any
  setData: React.Dispatch<React.SetStateAction<any>>
  searchQuery: string
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>
  searchResults: any[]
  setSearchResults: React.Dispatch<React.SetStateAction<any[]>>
  isDraggingItem: boolean
  setIsDraggingItem: React.Dispatch<React.SetStateAction<boolean>>
  isScanning: boolean
  setIsScanning: React.Dispatch<React.SetStateAction<boolean>>
  selectedGame: any
  setSelectedGame: React.Dispatch<React.SetStateAction<any>>
  gameDetails: any
  setGameDetails: React.Dispatch<React.SetStateAction<any>>
  isVideoMode: boolean
  setIsVideoMode: React.Dispatch<React.SetStateAction<boolean>>
  isMuted: boolean
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>
  currentVideoId: string
  setCurrentVideoId: React.Dispatch<React.SetStateAction<string>>
  activeTab: string
  setActiveTab: React.Dispatch<React.SetStateAction<string>>
  bgMode: 'video' | 'image'
  setBgMode: React.Dispatch<React.SetStateAction<'video' | 'image'>>
  sortOrder: 'none' | 'asc' | 'desc'
  setSortOrder: React.Dispatch<React.SetStateAction<'none' | 'asc' | 'desc'>>
  filterStatus: 'All' | 'Playing' | 'Completed' | 'Backlog' | 'Wishlist'
  setFilterStatus: React.Dispatch<
    React.SetStateAction<'All' | 'Playing' | 'Completed' | 'Backlog' | 'Wishlist'>
  >
  isStatusDropdownOpen: boolean
  setIsStatusDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>
  galleryIndex: number
  setGalleryIndex: React.Dispatch<React.SetStateAction<number>>
  timeToBeat: any
  setTimeToBeat: React.Dispatch<React.SetStateAction<any>>
  discoverGames: any[]
  setDiscoverGames: React.Dispatch<React.SetStateAction<any[]>>
  discoverFilter: string
  setDiscoverFilter: React.Dispatch<React.SetStateAction<string>>
  isDiscoverLoading: boolean
  setIsDiscoverLoading: React.Dispatch<React.SetStateAction<boolean>>
  discoverOffset: number
  setDiscoverOffset: React.Dispatch<React.SetStateAction<number>>
  hasMoreDiscover: boolean
  setHasMoreDiscover: React.Dispatch<React.SetStateAction<boolean>>
  refreshDiscoverGames: () => Promise<void>
  defaultMuted: boolean
  setDefaultMuted: React.Dispatch<React.SetStateAction<boolean>>
  libraryGames: any[]
  setLibraryGames: React.Dispatch<React.SetStateAction<any[]>>
  librarySearch: string
  setLibrarySearch: React.Dispatch<React.SetStateAction<string>>
  suggestedGame: any
  setSuggestedGame: React.Dispatch<React.SetStateAction<any>>
  showImportModal: boolean
  setShowImportModal: React.Dispatch<React.SetStateAction<boolean>>
  importText: string
  setImportText: React.Dispatch<React.SetStateAction<string>>
  isImporting: boolean
  setIsImporting: React.Dispatch<React.SetStateAction<boolean>>
  geminiKey: string
  setGeminiKey: React.Dispatch<React.SetStateAction<string>>
  steamKey: string
  setSteamKey: React.Dispatch<React.SetStateAction<string>>
  steamId: string
  setSteamId: React.Dispatch<React.SetStateAction<string>>
  rawgKey: string
  setRawgKey: React.Dispatch<React.SetStateAction<string>>
  igdbClientId: string
  setIgdbClientId: React.Dispatch<React.SetStateAction<string>>
  igdbClientSecret: string
  setIgdbClientSecret: React.Dispatch<React.SetStateAction<string>>
  globalRankings: any
  setGlobalRankings: React.Dispatch<React.SetStateAction<any>>
  rankingsLoading: boolean
  setRankingsLoading: React.Dispatch<React.SetStateAction<boolean>>
  rankingsGenre: string
  setRankingsGenre: React.Dispatch<React.SetStateAction<string>>
  scrapedRankings: any[]
  setScrapedRankings: React.Dispatch<React.SetStateAction<any[]>>
  oracleRecs: any[]
  setOracleRecs: React.Dispatch<React.SetStateAction<any[]>>
  oracleLoading: boolean
  setOracleLoading: React.Dispatch<React.SetStateAction<boolean>>
  oracleError: string | null
  setOracleError: React.Dispatch<React.SetStateAction<string | null>>
  oraclePhase: string
  setOraclePhase: React.Dispatch<React.SetStateAction<string>>
  runningGameId: string | null
  setRunningGameId: React.Dispatch<React.SetStateAction<string | null>>
  gamePlaytime: number
  setGamePlaytime: React.Dispatch<React.SetStateAction<number>>
  gameDeals: any[]
  setGameDeals: React.Dispatch<React.SetStateAction<any[]>>
  videoError: boolean
  setVideoError: React.Dispatch<React.SetStateAction<boolean>>
  iframeRef: React.RefObject<HTMLIFrameElement | null>
  notifications: { id: number; title: string; message: string; time: Date; read: boolean }[]
  setNotifications: React.Dispatch<
    React.SetStateAction<
      { id: number; title: string; message: string; time: Date; read: boolean }[]
    >
  >
  addNotification: (title: string, message: string) => void
  userName: string
  setUserName: React.Dispatch<React.SetStateAction<string>>
  userAvatar: string | null
  setUserAvatar: React.Dispatch<React.SetStateAction<string | null>>
  isMasterMenuOpen: boolean
  setIsMasterMenuOpen: React.Dispatch<React.SetStateAction<boolean>>
  updateStatus: 'idle' | 'downloading' | 'ready'
  setUpdateStatus: React.Dispatch<React.SetStateAction<'idle' | 'downloading' | 'ready'>>
  updateProgress: number
  setUpdateProgress: React.Dispatch<React.SetStateAction<number>>
  gamerTitle: string
  totalPlaytimeMinutes: number

  loadGames: () => Promise<void>
  handleGameClick: (game: any) => Promise<void>
  handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  handleAddGame: (game: any) => Promise<void>
  handleScanPC: () => Promise<void>
  handleSaveGameData: (field: 'notes' | 'status', value: string) => Promise<void>
  onDragStart: () => void
  onDragEnd: (result: any) => Promise<void>
  handleAIImport: () => Promise<void>
  handleTextImport: () => Promise<void>
  handleSortClick: () => void
  handleFilterClick: () => void
  toggleMute: () => void
  filteredAndSortedCollection: any[]
  appTheme: string
  changeTheme: (theme: string) => void
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined)

export const GlobalProvider = ({ children }: { children: ReactNode }) => {
  // ===== SINGLE SOURCE OF TRUTH =====
  const [allGames, setAllGames] = useState<any[]>([])

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isDraggingItem, setIsDraggingItem] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [selectedGame, setSelectedGame] = useState<any>(null)
  const [gameDetails, setGameDetails] = useState<any>(null)
  const [isVideoMode, setIsVideoMode] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [currentVideoId, setCurrentVideoId] = useState<string>('')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [activeTab, setActiveTab] = useState('tierlist')
  const [bgMode, setBgMode] = useState<'video' | 'image'>(
    (localStorage.getItem('bgMode') as 'video' | 'image') || 'video'
  )
  const [sortOrder, setSortOrder] = useState<'none' | 'asc' | 'desc'>('none')
  const [filterStatus, setFilterStatus] = useState<
    'All' | 'Playing' | 'Completed' | 'Backlog' | 'Wishlist'
  >('All')
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [timeToBeat, setTimeToBeat] = useState<any>(null)
  const [discoverGames, setDiscoverGames] = useState<any[]>([])
  const [discoverFilter, setDiscoverFilter] = useState('trending')
  const [isDiscoverLoading, setIsDiscoverLoading] = useState(false)
  const [discoverOffset, setDiscoverOffset] = useState(0)
  const [hasMoreDiscover, setHasMoreDiscover] = useState(true)
  const [defaultMuted, setDefaultMuted] = useState<boolean>(
    localStorage.getItem('defaultMuted') === 'true'
  )
  const [librarySearch, setLibrarySearch] = useState('')

  const [showImportModal, setShowImportModal] = useState(false)
  const [importText, setImportText] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [geminiKey, setGeminiKey] = useState('')
  const [steamKey, setSteamKey] = useState('')
  const [steamId, setSteamId] = useState('')
  const [rawgKey, setRawgKey] = useState('')
  const [igdbClientId, setIgdbClientId] = useState('')
  const [igdbClientSecret, setIgdbClientSecret] = useState('')
  const [globalRankings, setGlobalRankings] = useState<any>(null)
  const [rankingsLoading, setRankingsLoading] = useState(false)
  const [rankingsGenre, setRankingsGenre] = useState('overall')
  const [scrapedRankings, setScrapedRankings] = useState<any[]>([])

  const [oracleRecs, setOracleRecs] = useState<any[]>([])
  const [oracleLoading, setOracleLoading] = useState(false)
  const [oracleError, setOracleError] = useState<string | null>(null)
  const [oraclePhase, setOraclePhase] = useState('')

  const [runningGameId, setRunningGameId] = useState<string | null>(null)
  const [gamePlaytime, setGamePlaytime] = useState<number>(0)
  const [gameDeals, setGameDeals] = useState<any[]>([])
  const [videoError, setVideoError] = useState(false)

  const [notifications, setNotifications] = useState<
    { id: number; title: string; message: string; time: Date; read: boolean }[]
  >([])
  const addNotification = (title: string, message: string) => {
    setNotifications((prev) => [
      { id: Date.now(), title, message, time: new Date(), read: false },
      ...prev
    ])
    window.api.showNotification(title, message)
  }

  const [userName, setUserName] = useState('Player')
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [isMasterMenuOpen, setIsMasterMenuOpen] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'downloading' | 'ready'>('idle')
  const [updateProgress, setUpdateProgress] = useState<number>(0)

  const [appTheme, setAppTheme] = useState('default')

  const changeTheme = (theme: string) => {
    setAppTheme(theme)
    document.body.setAttribute('data-theme', theme)
    window.api.saveSetting('app_theme', theme)
  }

  useEffect(() => {
    window.api.getSetting('app_theme').then((theme: string | null) => {
      if (theme) {
        setAppTheme(theme)
        document.body.setAttribute('data-theme', theme)
      } else {
        document.body.setAttribute('data-theme', 'default')
      }
    })
    window.api.getSetting('user_name').then((name: string | null) => {
      if (name) setUserName(name)
    })
    window.api.getSetting('user_avatar').then((avatar: string | null) => {
      if (avatar) setUserAvatar(avatar)
    })
    window.api.getSetting('geminiKey').then((key: string | null) => {
      if (key) setGeminiKey(key)
    })
    window.api.getSetting('steamKey').then((key: string | null) => {
      if (key) setSteamKey(key)
    })
    window.api.getSetting('steamId').then((id: string | null) => {
      if (id) setSteamId(id)
    })
    window.api.getSetting('rawg_key').then((key: string | null) => {
      if (key) setRawgKey(key)
    })
    window.api.getSetting('igdb_client_id').then((key: string | null) => {
      if (key) setIgdbClientId(key)
    })
    window.api.getSetting('igdb_client_secret').then((key: string | null) => {
      if (key) setIgdbClientSecret(key)
    })

    const cleanupStarted = window.api.onGameStarted((gameId: string) => {
      setRunningGameId(gameId)
      addNotification('Game Launched', 'Your playtime is now being tracked.')
    })
    const cleanupStopped = window.api.onGameStopped((_gameId: string, totalPlaytime: number) => {
      setRunningGameId(null)
      setGamePlaytime(totalPlaytime)
      loadGames()
      addNotification('Session Ended', 'Your playtime was successfully saved.')
    })
    const cleanupUpdateAvailable = window.api.onUpdateAvailable(() => {
      setUpdateStatus('downloading')
      setUpdateProgress(0)
      addNotification('Update Available', 'Downloading a new version of TierForge...')
    })
    const cleanupUpdateProgress = window.api.onUpdateProgress((percent: number) => {
      setUpdateProgress(percent)
    })
    const cleanupUpdateDownloaded = window.api.onUpdateDownloaded(() => {
      setUpdateStatus('ready')
      addNotification('Update Ready', 'A new version of TierForge is ready to install!')
    })

    return () => {
      cleanupStarted()
      cleanupStopped()
      cleanupUpdateAvailable()
      cleanupUpdateProgress()
      cleanupUpdateDownloaded()
    }
  }, [])

  useEffect(() => {
    const handleYTMessage = (e: MessageEvent) => {
      try {
        if (typeof e.data === 'string' && e.data.includes('"event":"onError"')) {
          setVideoError(true)
        }
        if (typeof e.data === 'string') {
          const parsed = JSON.parse(e.data)
          if (parsed?.event === 'onError' || parsed?.info === 150 || parsed?.info === 100) {
            setVideoError(true)
          }
        }
      } catch (_) {
        /* not a YT message */
      }
    }
    window.addEventListener('message', handleYTMessage)
    return () => window.removeEventListener('message', handleYTMessage)
  }, [])

  useEffect(() => {
    if (activeTab === 'rankings') {
      const fetchRanking = async () => {
        // If we already have this genre in globalRankings, don't trigger loading unless it's empty
        if (globalRankings && globalRankings[rankingsGenre]) return

        setRankingsLoading(true)
        try {
          const data = await window.api.getCachedRankings(rankingsGenre)
          setGlobalRankings((prev: any) => ({
            ...(prev || {}),
            [rankingsGenre]: data
          }))
        } catch (err) {
          console.error('Failed to fetch rankings:', err)
        } finally {
          setRankingsLoading(false)
        }
      }
      fetchRanking()
    }
  }, [activeTab, rankingsGenre])

  useEffect(() => {
    const handleRightClick = (e: MouseEvent) => {
      e.preventDefault()
      if (showImportModal && !isImporting) {
        setShowImportModal(false)
      } else if (selectedGame) {
        setSelectedGame(null)
        setTimeToBeat(null)
      } else if (isStatusDropdownOpen) {
        setIsStatusDropdownOpen(false)
      } else if (searchResults.length > 0 || searchQuery) {
        setSearchQuery('')
        setSearchResults([])
        setLibrarySearch('')
      }
    }
    window.addEventListener('contextmenu', handleRightClick)
    return () => window.removeEventListener('contextmenu', handleRightClick)
  }, [showImportModal, isImporting, selectedGame, isStatusDropdownOpen, searchResults, searchQuery])

  const loadGames = async () => {
    const dbGames = await window.api.getAllGames()
    setAllGames(dbGames)
  }

  // ===== DERIVED STATE (useMemo) =====
  const data = useMemo(() => {
    const tierDef: Record<string, any> = {
      s: { id: 's', title: 'S-Tier', sub: 'Masterpiece', color: 'bg-rose-500', items: [] as any[] },
      a: { id: 'a', title: 'A-Tier', sub: 'Excellent', color: 'bg-orange-500', items: [] as any[] },
      b: { id: 'b', title: 'B-Tier', sub: 'Great', color: 'bg-yellow-500', items: [] as any[] },
      c: { id: 'c', title: 'C-Tier', sub: 'Good', color: 'bg-green-500', items: [] as any[] },
      d: { id: 'd', title: 'D-Tier', sub: 'Mediocre', color: 'bg-sky-500', items: [] as any[] },
      f: { id: 'f', title: 'F-Tier', sub: 'Terrible', color: 'bg-red-800', items: [] as any[] },
      dropped: {
        id: 'dropped',
        title: 'Dropped',
        sub: 'Not For Me',
        color: 'bg-slate-600',
        items: [] as any[]
      }
    }
    const collection: any[] = []
    allGames.forEach((game: any) => {
      const gameObj = {
        id: game.id,
        title: game.title,
        img: game.image_url,
        notes: game.notes || '',
        status: game.status || 'Backlog',
        executable_path: game.executable_path || '',
        custom_save_path: game.custom_save_path || ''
      }
      if (game.tier === 'unranked' || !tierDef[game.tier]) {
        collection.push(gameObj)
      } else {
        tierDef[game.tier].items.push(gameObj)
      }
    })
    return { tiers: tierDef, collection }
  }, [allGames])

  const libraryGames = useMemo(() => allGames, [allGames])
  const setLibraryGames = setAllGames

  const totalPlaytimeMinutes = useMemo(() => {
    return allGames.reduce((acc, g) => acc + (g.playtime_minutes || 0), 0)
  }, [allGames])

  const gamerTitle = useMemo(() => {
    const count = libraryGames.length
    if (count < 10) return 'Novice'
    if (count < 50) return 'Intermediate'
    if (count < 100) return 'Collector'
    return 'Grandmaster'
  }, [libraryGames])

  const suggestedGame = useMemo(() => {
    const backlog = allGames.filter((g) => (g.status || 'Backlog') === 'Backlog')
    const installed = backlog.filter((g) => g.executable_path && g.executable_path.trim() !== '')
    const pool = installed.length > 0 ? installed : backlog
    return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null
  }, [allGames])

  useEffect(() => {
    loadGames()
  }, [])

  useEffect(() => {
    const cleanup = window.api.onAppRestored(() => {
      loadGames()
    })
    return cleanup
  }, [])

  useEffect(() => {
    if (activeTab === 'discover') {
      setIsDiscoverLoading(true)
      window.api.getDiscoverGames(discoverFilter, discoverOffset, false).then((games: any) => {
        if (discoverOffset === 0) {
          setDiscoverGames(games)
        } else {
          setDiscoverGames((prev) => {
            const existingIds = new Set(prev.map((g) => g.id))
            const uniqueNewGames = games.filter((g: any) => !existingIds.has(g.id))
            return [...prev, ...uniqueNewGames]
          })
        }
        setHasMoreDiscover(games.length > 0)
        setIsDiscoverLoading(false)
      })
    }
  }, [activeTab, discoverFilter, discoverOffset])

  const refreshDiscoverGames = async () => {
    setIsDiscoverLoading(true)
    try {
      const games = await window.api.getDiscoverGames(discoverFilter, 0, true)
      setDiscoverGames(games)
      setDiscoverOffset(0)
      setHasMoreDiscover(games.length > 0)
    } catch (err) {
      console.error('Failed to refresh discover games:', err)
    } finally {
      setIsDiscoverLoading(false)
    }
  }

  const filteredAndSortedCollection = useMemo(() => {
    let result = [...data.collection]
    if (filterStatus !== 'All') {
      result = result.filter((item) => item.status === filterStatus)
    }
    if (sortOrder === 'asc') {
      result.sort((a, b) => a.title.localeCompare(b.title))
    } else if (sortOrder === 'desc') {
      result.sort((a, b) => b.title.localeCompare(a.title))
    }
    return result
  }, [data.collection, filterStatus, sortOrder])

  const handleSortClick = () => {
    if (sortOrder === 'none') setSortOrder('asc')
    else if (sortOrder === 'asc') setSortOrder('desc')
    else setSortOrder('none')
  }

  const handleFilterClick = () => {
    if (filterStatus === 'All') setFilterStatus('Playing')
    else if (filterStatus === 'Playing') setFilterStatus('Completed')
    else if (filterStatus === 'Completed') setFilterStatus('Backlog')
    else if (filterStatus === 'Backlog') setFilterStatus('Wishlist')
    else setFilterStatus('All')
  }

  const toggleMute = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      const func = isMuted ? 'unMute' : 'mute'
      iframeRef.current.contentWindow.postMessage(
        `{"event":"command","func":"${func}","args":""}`,
        '*'
      )
      setIsMuted(!isMuted)
    }
  }

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)

    if (query.length > 2) {
      const results = await window.api.searchGames(query)
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }

  const handleAddGame = async (game: any) => {
    await window.api.addGame(game.id, game.title, game.image_url)
    setSearchQuery('')
    setSearchResults([])
    // Optimistic: add to allGames directly
    setAllGames((prev) => {
      if (prev.find((g) => g.id === game.id)) return prev
      return [
        ...prev,
        {
          id: game.id,
          title: game.title,
          image_url: game.image_url,
          tier: 'unranked',
          notes: '',
          status: 'Backlog',
          executable_path: '',
          playtime_minutes: 0,
          genres: '',
          developers: '',
          release_year: ''
        }
      ]
    })
  }

  const handleScanPC = async () => {
    setIsScanning(true)
    await window.api.scanPC()
    await loadGames()
    setIsScanning(false)
  }

  const handleGameClick = async (game: any) => {
    setSelectedGame(game)
    setGameDetails(null)
    setIsVideoMode(false)
    setIsMuted(defaultMuted)
    setCurrentVideoId('')
    setTimeToBeat(null)
    setGamePlaytime(0)
    setGameDeals([])
    setVideoError(false)

    window.api.getPlaytime(game.id.toString()).then((pt: number) => setGamePlaytime(pt))

    if (!game.executable_path || game.executable_path.trim() === '') {
      window.api.getGameDeals(game.title).then((deals: any[]) => setGameDeals(deals || []))
    }
    window.api
      .getTimeToBeat(game.title)
      .then(setTimeToBeat)
      .catch(() => setTimeToBeat(null))

    const details = await window.api.getExtendedDetails(game.id)
    if (details) {
      setCurrentVideoId(details.video_id)
      setGameDetails({ ...game, ...details, notes: game.notes, status: game.status })
    } else {
      setGameDetails({
        ...game,
        summary: 'No details found.',
        genres: 'Unknown',
        year: 'Unknown',
        background_url: ''
      })
    }
  }

  const handleSaveGameData = async (field: 'notes' | 'status', value: string) => {
    if (!gameDetails) return
    const newDetails = { ...gameDetails, [field]: value }
    setGameDetails(newDetails)

    const isInLibrary = !!allGames.find((g) => g.id === gameDetails.id)
    
    if (!isInLibrary) {
      const imgUrl = gameDetails.image_url || gameDetails.img || gameDetails.background_url || ''
      await window.api.addGame(gameDetails.id, gameDetails.title, imgUrl)
      
      setAllGames((prev) => [
        ...prev,
        {
          id: gameDetails.id,
          title: gameDetails.title,
          image_url: imgUrl,
          tier: 'unranked',
          notes: field === 'notes' ? value : '',
          status: field === 'status' ? value : 'Backlog',
          executable_path: '',
          playtime_minutes: 0,
          custom_save_path: ''
        }
      ])
    } else {
      setAllGames((prev) => prev.map((g) => (g.id === gameDetails.id ? { ...g, [field]: value } : g)))
    }

    await window.api.updateGameData(
      gameDetails.id,
      field === 'notes' ? value : (gameDetails.notes || ''),
      field === 'status' ? value : (gameDetails.status || 'Backlog')
    )
  }

  const onDragStart = () => {
    setIsDraggingItem(true)
  }

  const onDragEnd = async (result: any) => {
    setIsDraggingItem(false)

    const { source, destination } = result
    if (!destination) return

    if (source.droppableId === 'search-results') {
      if (destination.droppableId === 'search-results' || destination.droppableId === 'trash')
        return

      const game = searchResults[source.index]
      const newTier =
        destination.droppableId === 'collection' ? 'unranked' : destination.droppableId

      // Optimistic: add to allGames
      setAllGames((prev) => [
        ...prev,
        {
          id: game.id.toString(),
          title: game.title,
          image_url: game.image_url,
          tier: newTier,
          notes: '',
          status: 'Backlog',
          executable_path: '',
          playtime_minutes: 0,
          genres: '',
          developers: '',
          release_year: '',
          storyline: ''
        }
      ])

      setSearchResults([])
      setSearchQuery('')

      await window.api.addGame(game.id.toString(), game.title, game.image_url)
      if (newTier !== 'unranked') {
        await window.api.updateGameTier(game.id.toString(), newTier)
      }
      return
    }

    // Find the moved item from the derived data view
    const sourceItems =
      source.droppableId === 'collection'
        ? [...data.collection]
        : [...data.tiers[source.droppableId].items]
    const [movedItem]: any = sourceItems.splice(source.index, 1)

    if (destination.droppableId === 'trash') {
      // Optimistic delete
      setAllGames((prev) => prev.filter((g) => g.id !== movedItem.id))
      await window.api.deleteGame(movedItem.id)
      return
    }

    const newTier = destination.droppableId === 'collection' ? 'unranked' : destination.droppableId

    // Optimistic: update the tier field in allGames
    setAllGames((prev) => prev.map((g) => (g.id === movedItem.id ? { ...g, tier: newTier } : g)))

    await window.api.updateGameTier(movedItem.id, newTier)
  }

  const handleAIImport = async () => {
    const imagePath = await window.api.browseImage()
    if (imagePath) {
      if (!geminiKey) {
        alert('Please enter your Gemini API Key first.')
        return
      }
      setIsImporting(true)
      await window.api.analyzeImage(imagePath, geminiKey)
      await loadGames()
      setIsImporting(false)
      setShowImportModal(false)
      addNotification('AI Import Complete', 'Successfully imported games from your screenshot.')
      window.api.showNotification(
        'AI Import Complete',
        'Successfully imported games from your screenshot.'
      )
    }
  }

  const handleTextImport = async () => {
    if (!importText.trim()) return
    setIsImporting(true)
    await window.api.bulkImportText(importText)
    await loadGames()
    setIsImporting(false)
    setShowImportModal(false)
    setImportText('')
  }

  const value = {
    data,
    setData: setAllGames as any,
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    isDraggingItem,
    setIsDraggingItem,
    isScanning,
    setIsScanning,
    selectedGame,
    setSelectedGame,
    gameDetails,
    setGameDetails,
    isVideoMode,
    setIsVideoMode,
    isMuted,
    setIsMuted,
    currentVideoId,
    setCurrentVideoId,
    activeTab,
    setActiveTab,
    bgMode,
    setBgMode,
    sortOrder,
    setSortOrder,
    filterStatus,
    setFilterStatus,
    isStatusDropdownOpen,
    setIsStatusDropdownOpen,
    galleryIndex,
    setGalleryIndex,
    timeToBeat,
    setTimeToBeat,
    discoverGames,
    setDiscoverGames,
    discoverFilter,
    setDiscoverFilter,
    isDiscoverLoading,
    setIsDiscoverLoading,
    discoverOffset,
    setDiscoverOffset,
    hasMoreDiscover,
    setHasMoreDiscover,
    refreshDiscoverGames,
    defaultMuted,
    setDefaultMuted,
    libraryGames,
    setLibraryGames,
    librarySearch,
    setLibrarySearch,
    suggestedGame,
    setSuggestedGame: (() => {}) as any,
    showImportModal,
    setShowImportModal,
    importText,
    setImportText,
    isImporting,
    setIsImporting,
    geminiKey,
    setGeminiKey,
    steamKey,
    setSteamKey,
    steamId,
    setSteamId,
    rawgKey,
    setRawgKey,
    igdbClientId,
    setIgdbClientId,
    igdbClientSecret,
    setIgdbClientSecret,
    globalRankings,
    setGlobalRankings,
    rankingsLoading,
    setRankingsLoading,
    rankingsGenre,
    setRankingsGenre,
    scrapedRankings,
    setScrapedRankings,
    oracleRecs,
    setOracleRecs,
    oracleLoading,
    setOracleLoading,
    oracleError,
    setOracleError,
    oraclePhase,
    setOraclePhase,
    runningGameId,
    setRunningGameId,
    gamePlaytime,
    setGamePlaytime,
    gameDeals,
    setGameDeals,
    videoError,
    setVideoError,
    iframeRef,
    notifications,
    setNotifications,
    addNotification,
    userName,
    setUserName,
    userAvatar,
    setUserAvatar,
    isMasterMenuOpen,
    setIsMasterMenuOpen,
    updateStatus,
    setUpdateStatus,
    updateProgress,
    setUpdateProgress,
    gamerTitle,
    totalPlaytimeMinutes,
    appTheme,
    changeTheme,
    loadGames,
    handleGameClick,
    handleSearch,
    handleAddGame,
    handleScanPC,
    handleSaveGameData,
    onDragStart,
    onDragEnd,
    handleAIImport,
    handleTextImport,
    handleSortClick,
    handleFilterClick,
    toggleMute,
    filteredAndSortedCollection
  }

  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
}

export const useGlobal = () => {
  const context = useContext(GlobalContext)
  if (context === undefined) {
    throw new Error('useGlobal must be used within a GlobalProvider')
  }
  return context
}
