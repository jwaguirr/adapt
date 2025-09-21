'use client';

import Navbar from "./components/LandingNavbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <Footer />
    </>
  );
}
