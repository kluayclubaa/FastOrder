"use client"
import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ProgressiveBlur } from "@/components/ui/progressive-blur"
import { cn } from "@/lib/utils"
import { Menu, X, ChevronRight, QrCode } from "lucide-react"
import { useScroll, motion } from "framer-motion"
import FeatureSection from "./feature-section"
import QrCodeFeature from "@/components/ui/QRcodeFeature"
import MenuManagement from "@/components/ui/menumenage"
import RevenueInsight from "@/components/ui/revenueside"
import Customerview from "@/components/ui/customerview"


export function HeroSection() {
  
  return (
    <>
      <HeroHeader />
      <main className="overflow-x-hidden bg-black">
        <section>
          <div className="relative py-24 md:pb-32 lg:pb-36 lg:pt-72 min-h-[80vh] sm:min-h-[70vh] md:min-h-[60vh]">
            <div className="relative z-10 mx-auto flex max-w-7xl flex-col px-4 sm:px-6 lg:block lg:px-12">
              <div className="mx-auto max-w-lg text-center lg:ml-0 lg:max-w-full lg:text-left">
                <h1 className="mt-8 max-w-2xl text-balance text-4xl font-bold sm:text-5xl md:text-6xl lg:mt-16 xl:text-7xl text-[#ffffff]">
                  Build Digital <br className="hidden sm:block" /> Menu With <br className="hidden sm:block" /> <span className="text-[#48daff]">FastOrder</span>
                </h1>
                <p className="mt-4 sm:mt-8 max-w-2xl text-balance text-base sm:text-lg text-[#637381]">
                  Highly customizable components for building modern websites and applications you mean it.
                </p>

                <div className="mt-8 sm:mt-12 flex flex-col items-center justify-center gap-2 sm:flex-row lg:justify-start">
                  <Button
                    asChild
                    size="lg"
                    className="btn-shopify h-10 sm:h-12 w-full sm:w-auto rounded-full pl-5 pr-3 text-sm sm:text-base"
                  >
                    <Link href="/register">
                      <span className="text-nowrap">Start Building</span>
                      <ChevronRight className="ml-1" />
                    </Link>
                  </Button>
         
                </div>
              </div>
            </div>
            <div className="absolute inset-0 w-full h-full overflow-hidden rounded-3xl border border-gray-200 lg:rounded-[3rem] z-0">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover opacity-50"
                src="/1.mp4"
              ></video>
            </div>
          </div>
        </section>
        <section className="bg-white pb-2">
          <div className="group relative m-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-col items-center md:flex-row">
              <div className="md:max-w-44 md:border-r md:border-gray-200 md:pr-6">
                <div className="bg-linear-to-r from-white absolute inset-y-0 left-0 w-20"></div>
                <div className="bg-linear-to-l from-white absolute inset-y-0 right-0 w-20"></div>
                <ProgressiveBlur
                  className="pointer-events-none absolute left-0 top-0 h-full w-20"
                  direction="left"
                  blurIntensity={1}
                />
                <ProgressiveBlur
                  className="pointer-events-none absolute right-0 top-0 h-full w-20"
                  direction="right"
                  blurIntensity={1}
                />
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="bg-white">
          <div className="pt-0 sm:pt-0 md:pt-14">
            <FeatureSection />
          </div>
        </section>
        <section id="solution" className="bg-[#f9fafb] py-20">
          <QrCodeFeature />
        </section>
        <section className="bg-white"><MenuManagement /></section>
        <section  className="bg-[#f9fafb]"><RevenueInsight /></section>
        <section id="about" className="bg-white"><Customerview /></section>
      </main>
    </>
  )
}

const menuItems = [
  { name: "Features", href: "#features" },
  { name: "Solution", href: "#solution" },
  { name: "About", href: "#about" },
  {name: "Pricing", href: "/showpricing"},
]

const HeroHeader = () => {
  const [menuState, setMenuState] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)
  const { scrollYProgress } = useScroll()

  React.useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      setScrolled(latest > 0.05)
    })
    return () => unsubscribe()
  }, [scrollYProgress])

  return (
    <header>
      <nav data-state={menuState && "active"} className="group fixed z-20 w-full pt-1 sm:pt-2">
        <div
          className={cn(
            "mx-auto max-w-7xl rounded-xl sm:rounded-2xl md:rounded-3xl px-3 sm:px-6 transition-all duration-300 lg:px-12 md:pt-0",
            scrolled && "bg-white/90 backdrop-blur-2xl shadow-sm",
          )}
        >
          <motion.div
            key={1}
            className={cn(
              "relative flex flex-wrap items-center justify-between gap-2 sm:gap-4 md:gap-6 py-2 sm:py-3 duration-200 lg:gap-0 lg:py-6",
              scrolled && "lg:py-4",
            )}
          >
            <div className="flex w-full items-center justify-between gap-3 sm:gap-6 md:gap-12 lg:w-auto">
              <Link href="/" aria-label="home" className="flex items-center space-x-2">
                <span className="flex items-center space-x-1 sm:space-x-2">
                  <QrCode className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[#5c6ac4]" />
                  <span className="text-xs sm:text-sm md:text-base font-medium text-[#48daff]">FastOrder</span>
                </span>
              </Link>

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState == true ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2 -mr-1 sm:-mr-2 md:-mr-4 block cursor-pointer p-2 sm:p-2.5 lg:hidden text-[#1640ff]"
              >
                <Menu className="group-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-4 sm:size-5 md:size-6 duration-200" />
                <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-4 sm:size-5 md:size-6 -rotate-180 scale-0 opacity-0 duration-200" />
              </button>

              <div className="hidden lg:block">
                <ul className="flex gap-4 xl:gap-8 text-xs sm:text-sm">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <Link
                        href={item.href}
                        className="text-[#817763] hover:text-[#212b36] block duration-150"
                      >
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white group-data-[state=active]:block lg:group-data-[state=active]:flex mb-0 sm:mb-6 hidden w-full flex-wrap items-center justify-end space-y-4 sm:space-y-6 md:space-y-8 rounded-xl sm:rounded-2xl md:rounded-3xl border border-gray-200 p-3 sm:p-4 md:p-6 shadow-lg sm:shadow-xl md:shadow-2xl shadow-gray-200/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none">
              <div className="lg:hidden w-full">
                <ul className="space-y-3 sm:space-y-4 md:space-y-6 text-xs sm:text-sm md:text-base">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <Link
                        href={item.href}
                        className="text-[#817763] hover:text-[#212b36] block duration-150"
                        onClick={() => setMenuState(false)}
                      >
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full flex-col space-y-2 sm:space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                <Button asChild variant="outline" size="sm" className="w-full text-xs sm:text-sm sm:w-auto border-gray-200 hover:bg-gray-50 text-[#212b36]">
                  <Link href="/login">
                    <span>Login</span>
                  </Link>
                </Button>
                <Button asChild size="sm" className="btn-shopify w-full text-xs sm:text-sm sm:w-auto">
                  <Link href="/register">
                    <span>Sign Up</span>
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </nav>
    </header>
  )
}