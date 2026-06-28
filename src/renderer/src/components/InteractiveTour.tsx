import React from 'react'
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride'
import { useGlobal } from '../context/GlobalContext'

export const InteractiveTour: React.FC = () => {
  const { runTour, setRunTour, setActiveTab } = useGlobal()

  const steps: Step[] = [
    {
      target: '#tour-scan-pc',
      content: 'Start here! Let TierForge automatically detect your installed games across Steam, Epic, and GOG.',
      disableBeacon: true,
      placement: 'bottom',
    },
    {
      target: '#tour-import-hub',
      content: 'Switching from console? Use our AI Vision scanner to read a picture of your TV screen and instantly import your PlayStation or Switch library.',
      placement: 'bottom',
    },
    {
      target: '#tour-discover',
      content: 'Find your next obsession. Browse live storefronts and 70+ specific gaming genres.',
      placement: 'right',
    },
    {
      target: '#tour-oracle',
      content: "Once you've ranked a few games, come here. The AI will analyze your tastes and recommend games you'll love.",
      placement: 'right',
    },
    {
      target: '#tour-settings',
      content: 'Finally, drop your API keys here to unlock the full power of TierForge.',
      placement: 'right',
    },
  ]

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status, type, index } = data

    // Switch tabs dynamically if needed based on the tour step
    if (type === 'step:after') {
      if (index === 1) { // After Import Hub, moving to Discover
        setActiveTab('discover')
      } else if (index === 2) { // After Discover, moving to AI Oracle
        setActiveTab('oracle')
      } else if (index === 3) { // After AI Oracle, moving to Settings
        setActiveTab('settings')
      }
    }

    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      // Tour is done
      setRunTour(false)
      if (window.api && window.api.saveSetting) {
        await window.api.saveSetting('has_finished_interactive_tour', 'true')
      }
    }
  }

  return (
    <Joyride
      steps={steps}
      run={runTour}
      continuous
      scrollToFirstStep
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          zIndex: 100000,
          primaryColor: '#6366f1', // Indigo 500
          backgroundColor: '#1e293b', // Slate 800
          textColor: '#f8fafc', // Slate 50
          arrowColor: '#1e293b',
          overlayColor: 'rgba(0, 0, 0, 0.7)',
        },
        tooltipContainer: {
          textAlign: 'left',
          fontSize: '14px',
        },
        buttonNext: {
          backgroundColor: '#4f46e5', // Indigo 600
          borderRadius: '8px',
          fontWeight: 'bold',
        },
        buttonBack: {
          color: '#cbd5e1', // Slate 300
        },
        buttonSkip: {
          color: '#cbd5e1', // Slate 300
        },
      }}
    />
  )
}
