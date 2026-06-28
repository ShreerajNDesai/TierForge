import React, { useEffect } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { useGlobal } from '../context/GlobalContext'

export const InteractiveTour: React.FC = () => {
  const { runTour, setRunTour, setActiveTab } = useGlobal()

  useEffect(() => {
    if (!runTour) return

    const driverObj = driver({
      showProgress: true,
      animate: true,
      overlayColor: 'rgba(5, 7, 10, 0.85)',
      popoverClass: 'driver-theme-tierforge',
      steps: [
        {
          element: '#tour-scan-pc',
          popover: {
            title: 'Scan PC',
            description: 'Start here! Let TierForge automatically detect your installed games across Steam, Epic, and GOG.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-import-hub',
          popover: {
            title: 'Import Hub',
            description: 'Switching from console? Use our AI Vision scanner to read a picture of your TV screen and instantly import your PlayStation or Switch library.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-tierlist',
          popover: {
            title: 'Tier List',
            description: 'This is the Tier List. Rank your games to train your personalized AI Oracle.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#tour-library',
          popover: {
            title: 'Master Library',
            description: 'Your master Library. Access all your tracked games, see your playtime, and launch them instantly.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#tour-oracle',
          popover: {
            title: 'AI Oracle',
            description: "Once you've ranked a few games, come here. The AI will analyze your tastes and recommend exactly what you should play next based on your vibe.",
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#tour-discover',
          popover: {
            title: 'Discover',
            description: 'Find your next obsession. Browse live storefronts, upcoming releases, and 70+ specific gaming genres.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#tour-rankings',
          popover: {
            title: 'Global Rankings',
            description: 'See Global Rankings to discover the most universally acclaimed masterpieces across the TierForge network.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#tour-statistics',
          popover: {
            title: 'Personal Analytics',
            description: 'Dive into your personal analytics. Track your backlog progress, genre distribution, and total playtime.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#tour-settings',
          popover: {
            title: 'API Settings',
            description: 'Finally, drop your free API keys here to unlock rich metadata, Twitch integration, and AI vision capabilities.',
            side: 'right',
            align: 'start',
          },
        },
      ],
      onNextClick: (_element, _step, { state, driver: d }) => {
        const idx = state.activeIndex

        // Switch tabs right before proceeding to the next step
        if (idx === 1) setActiveTab('tierlist')
        if (idx === 2) setActiveTab('library')
        if (idx === 3) setActiveTab('oracle')
        if (idx === 4) setActiveTab('discover')
        if (idx === 5) setActiveTab('rankings')
        if (idx === 6) setActiveTab('statistics')
        if (idx === 7) setActiveTab('settings')

        // Wait a tiny bit for React to render the new tab, then advance driver
        setTimeout(() => {
          d.moveNext()
        }, 150)
      },
      onDestroyStarted: (_element, _step, { driver: d }) => {
        if (!d.hasNextStep() || d.isLastStep()) {
          d.destroy()
        } else {
          d.destroy()
        }
        setRunTour(false)
        if (window.api && window.api.saveSetting) {
          window.api.saveSetting('has_finished_interactive_tour', 'true')
        }
      },
    })

    driverObj.drive()

    return () => {
      driverObj.destroy()
    }
  }, [runTour, setActiveTab, setRunTour])

  return null
}
