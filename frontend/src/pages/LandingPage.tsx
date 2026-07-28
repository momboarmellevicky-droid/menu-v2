import { motion } from 'framer-motion'
import HeroSection from '../components/sections/HeroSection'
import StatsSection from '../components/sections/StatsSection'
import FeaturesSection from '../components/sections/FeaturesSection'
import HowItWorksSection from '../components/sections/HowItWorksSection'
import DemoSection from '../components/sections/DemoSection'
import RoadmapSection from '../components/sections/RoadmapSection'
import CTASection from '../components/sections/CTASection'

export default function LandingPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <DemoSection />
      <RoadmapSection />
      <CTASection />
    </motion.div>
  )
}