"use client"

import { useEffect, useState, useCallback } from "react"
import {
  BlocksIcon,
  CircleIcon,
  HexagonIcon,
  OctagonIcon,
  PentagonIcon,
  SquareIcon,
  TriangleIcon,
} from "lucide-react"
import {
  Dock,
  DockCard,
  DockCardInner,
  DockDivider,
} from "@/components/ui/dock"

let gradients = [
  "https://products.ls.graphics/mesh-gradients/images/03.-Snowy-Mint_1-p-130x130q80.jpeg",
  "https://products.ls.graphics/mesh-gradients/images/04.-Hopbush_1-p-130x130q80.jpeg",
  "https://products.ls.graphics/mesh-gradients/images/06.-Wisteria-p-130x130q80.jpeg",
  "https://products.ls.graphics/mesh-gradients/images/09.-Light-Sky-Blue-p-130x130q80.jpeg",
  "https://products.ls.graphics/mesh-gradients/images/12.-Tumbleweed-p-130x130q80.jpeg",
  "https://products.ls.graphics/mesh-gradients/images/15.-Perfume_1-p-130x130q80.jpeg",
  null,
  "https://products.ls.graphics/mesh-gradients/images/36.-Pale-Chestnut-p-130x130q80.jpeg",
]

let openIcons = [
  <CircleIcon key="circle" className="h-8 w-8 fill-black stroke-black rounded-full" />,
  <TriangleIcon key="triangle" className="h-8 w-8 fill-black stroke-black rounded-full" />,
  <SquareIcon key="square" className="h-8 w-8 fill-black stroke-black rounded-full" />,
  <PentagonIcon key="pentagon" className="h-8 w-8 fill-black stroke-black rounded-full" />,
  <HexagonIcon key="hexagon" className="h-8 w-8 fill-black stroke-black rounded-full" />,
  <OctagonIcon key="octagon" className="h-8 w-8 fill-black stroke-black rounded-full" />,
  null,
  <BlocksIcon key="blocks" className="h-8 w-8 fill-black stroke-black rounded-full" />,
]

function DockAnimation() {
  const [isVisible, setIsVisible] = useState(true)
  const [lastActivityTime, setLastActivityTime] = useState(Date.now())

  const handleActivity = useCallback(() => {
    setLastActivityTime(Date.now())
    setIsVisible(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => handleActivity()
    const handleMouseMove = () => handleActivity()

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('mousemove', handleMouseMove)

    const checkInactivity = setInterval(() => {
      const currentTime = Date.now()
      if (currentTime - lastActivityTime > 5000) {
        setIsVisible(false)
      }
    }, 1000)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleMouseMove)
      clearInterval(checkInactivity)
    }
  }, [handleActivity, lastActivityTime])

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 flex items-center justify-center transition-opacity duration-500 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onMouseEnter={handleActivity}
    >
      <Dock className="space-x-1">
        {gradients.map((src, index) =>
          src ? (
            <DockCard key={src} id={`${index}`}>
              <DockCardInner src={src} id={`${index}`}>
                {openIcons[index]}
              </DockCardInner>
            </DockCard>
          ) : (
            <DockDivider key={index} />
          )
        )}
      </Dock>
    </div>
  )
}

export default DockAnimation