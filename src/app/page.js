import Image from "next/image";
import LandingPage from "./components/LandingPage";
import Navbar from "./components/Navbar";
import AboutPage from "./components/About";
import FeaturesPage from "./components/features";
import Faq from "./components/faq";
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6">
      <Navbar />
      <div id="home">
        <LandingPage />
      </div>

      <div
        id="about"
        className="bg-gray-950 text-white flex flex-col space-y-24 relative z-20"
      >
        <AboutPage />
      </div>
      <div id="features">
        <FeaturesPage />
      </div>
      <div id="faqs">
        <Faq />
      </div>
    </div>
  );
}
