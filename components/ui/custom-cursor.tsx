"use client"

import { useEffect, useState } from "react"
import { motion, useSpring, useMotionValue } from "framer-motion"

export function CustomCursor() {
  const [isHovering, setIsHovering] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  
  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)
  
  const springConfig = { damping: 25, stiffness: 250, mass: 0.5 }
  const springX = useSpring(cursorX, springConfig)
  const springY = useSpring(cursorY, springConfig)

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)
    }

    const checkHover = () => {
      const hoveredElement = document.querySelectorAll(":hover")
      const lastElement = hoveredElement[hoveredElement.length - 1]
      
      const isInteractive = lastElement?.matches(
        "a, button, [role='button'], input, select, textarea, .cursor-pointer"
      )
      setIsHovering(!!isInteractive)
    }

    const handleMouseDown = () => setIsClicking(true)
    const handleMouseUp = () => setIsClicking(false)

    window.addEventListener("mousemove", moveCursor)
    window.addEventListener("mouseover", checkHover)
    window.addEventListener("mousedown", handleMouseDown)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", moveCursor)
      window.removeEventListener("mouseover", checkHover)
      window.removeEventListener("mousedown", handleMouseDown)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [cursorX, cursorY])

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[9999] hidden h-5 w-5 rounded-full bg-[var(--vd-primary)] mix-blend-difference lg:block"
      style={{
        x: springX,
        y: springY,
        translateX: "-50%",
        translateY: "-50%",
      }}
      animate={{
        scale: isClicking ? 0.8 : isHovering ? 2.5 : 1,
        opacity: 1,
      }}
      transition={{
        scale: { type: "spring", stiffness: 300, damping: 20 },
      }}
    />
  )
}
