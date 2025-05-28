"use client"

import type React from "react"

import { motion } from "framer-motion"

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  color: string
  delay: number
  accentColor: string
}

const FeatureCard = ({ icon, title, description, color, delay, accentColor }: FeatureCardProps) => {
  return (
    <motion.div
      className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-2xl"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: delay / 1000 }}
      viewport={{ once: true, amount: 0.3 }}
      whileHover={{ y: -10 }}
    >
      <div className="relative z-10">
        <motion.div
          className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-r ${color} text-white shadow-lg`}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          {icon}
        </motion.div>

        <h3 className="mb-4 text-xl font-bold text-gray-900">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>

      <div
        className={`absolute inset-0 bg-gradient-to-r ${color} opacity-0 transition-opacity duration-300 group-hover:opacity-5`}
      />

      <div
        className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-r ${color} opacity-10 transition-transform duration-300 group-hover:scale-150`}
      />
    </motion.div>
  )
}

export default FeatureCard
