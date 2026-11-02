import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { AboutMe } from './components/AboutMe';
import { Projects } from './components/Projects';
import { TechStack } from './components/TechStack';
import { GithubStats } from './components/GithubStats';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0C0C0C] text-[#E0E6ED] relative selection:bg-[#B600A8]/40 selection:text-white">
      <Navbar />
      <main>
        <Hero />
        <AboutMe />
        <Projects />
        <TechStack />
        <GithubStats />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default App;
