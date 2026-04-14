import { useEffect, useState } from 'react'

// `react-apexcharts` touches browser APIs, so load it only after mount.
// Using `require()` here avoids Next's chunk-loader path that can fail with
// `require.e is not a function` in some runtime combinations.
const ReactApexcharts = (props: any) => {
  const [ApexComponent, setApexComponent] = useState<any>(null)

  useEffect(() => {
    let mounted = true

    try {
      const mod = require('react-apexcharts')
      const Loaded = mod?.default || mod

      if (mounted) {
        setApexComponent(() => Loaded)
      }
    } catch (error) {
      console.error('Failed to load react-apexcharts', error)
    }

    return () => {
      mounted = false
    }
  }, [])

  if (!ApexComponent) return null

  return <ApexComponent {...props} />
}

export default ReactApexcharts
