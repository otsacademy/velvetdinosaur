"use client"

import type { ReactNode } from "react"
import { useRef, useState } from "react"
import { motion } from "framer-motion"

interface MagneticProps {
  children: ReactNode
  strength?: number
}

export function Magnetic({ children, strength = 0.5 }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e
    const { left, top, width, height } = ref.current?.getBoundingClientRect() ?? {
      left: 0,
      top: 0,
      width: 0,
      height: 0,
    }
    const x = (clientX - (left + width / 2)) * strength
    const y = (clientY - (top + height / 2)) * strength
    setPosition({ x, y })
  }

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 })
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className="inline-block"
    >
      {children}
    </motion.div>
  )
}
