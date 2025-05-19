"use client"

import type React from "react"
import { useRef } from "react"
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion"

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  color: string
  delay: number
  accentColor: "blue" | "purple" | "emerald"
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color, delay, accentColor }) => {
  const cardRef = useRef<HTMLDivElement>(null)

  // For 3D hover effect
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const rotateX = useTransform(y, [-100, 100], [10, -10])
  const rotateY = useTransform(x, [-100, 100], [-10, 10])

  // Smoother animation with spring
  const springX = useSpring(rotateX, { stiffness: 100, damping: 30 })
  const springY = useSpring(rotateY, { stiffness: 100, damping: 30 })

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    x.set(e.clientX - centerX)
    y.set(e.clientY - centerY)
  }

  function handleMouseLeave() {
    x.set(0)
    y.set(0)
  }

  // Get accent color classes based on the accentColor prop
  const getAccentClasses = () => {
    switch (accentColor) {
      case "blue":
        return {
          light: "bg-blue-50",
          border: "border-blue-100",
          dot: "bg-blue-300",
        }
      case "purple":
        return {
          light: "bg-purple-50",
          border: "border-purple-100",
          dot: "bg-purple-300",
        }
      case "emerald":
        return {
          light: "bg-emerald-50",
          border: "border-emerald-100",
          dot: "bg-emerald-300",
        }
      default:
        return {
          light: "bg-blue-50",
          border: "border-blue-100",
          dot: "bg-blue-300",
        }
    }
  }

  const accentClasses = getAccentClasses()

  return (
    <motion.div
      className="feature-animate h-full perspective-1000"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.7,
        delay: delay / 1000,
        type: "spring",
        stiffness: 50,
      }}
    >
      <motion.div
        ref={cardRef}
        className={`h-full rounded-2xl bg-white p-8 shadow-xl border ${accentClasses.border} overflow-hidden relative`}
        style={{
          rotateX: springX,
          rotateY: springY,
          transformStyle: "preserve-3d",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{
          scale: 1.03,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        {/* Background decoration */}
        <div className={`absolute -right-16 -bottom-16 w-48 h-48 rounded-full ${accentClasses.light} opacity-50`}></div>

        {/* Decorative dots */}
        <div className="absolute top-6 right-6 flex space-x-1.5">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${accentClasses.dot} opacity-40`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay / 1000 + 0.1 * i, duration: 0.3 }}
            />
          ))}
        </div>

        {/* Decorative lines */}
        <div className="absolute -left-2 top-1/3 w-6 h-px bg-gray-200"></div>
        <div className="absolute -left-4 top-1/3 mt-2 w-10 h-px bg-gray-200"></div>

        <motion.div
          className={`mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r ${color} text-white shadow-lg relative z-10`}
          whileHover={{
            scale: 1.1,
            rotate: 5,
          }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: delay / 1000 + 0.2,
            }}
          >
            {icon}
          </motion.div>

          {/* Icon background decoration */}
          <div className="absolute inset-0 rounded-2xl bg-white opacity-20 blur-sm"></div>
        </motion.div>

        <motion.h3
          className="mb-4 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay / 1000 + 0.3 }}
        >
          {title}
        </motion.h3>

        <motion.p
          className="text-gray-600 leading-relaxed relative z-10"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay / 1000 + 0.4 }}
        >
          {description}
        </motion.p>

        <motion.div
          className="mt-8 inline-flex items-center group"
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: delay / 1000 + 0.5 }}
        >
         
        
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default FeatureCard
