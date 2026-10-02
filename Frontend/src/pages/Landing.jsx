import Navbar from "../components/landing/Navbar";
import ScrollProgressBar from "../components/landing/ScrollProgressBar";
import AdmissionBanner from "../components/landing/AdmissionBanner";
import BackToTop from "../components/landing/BackToTop";
import WhatsAppButton from "../components/landing/WhatsAppButton";
import Hero from "../components/landing/Hero";
import About from "../components/landing/About";
import AcademicsSyllabus from "../components/landing/AcademicsSyllabus";
import GallerySection from "../components/landing/GallerySection";
import AdmissionsFees from "../components/landing/AdmissionsFees";
import Facilities from "../components/landing/Facilities";
import Programs from "../components/landing/Programs";
import NoticesEvents from "../components/landing/NoticesEvents";
import Testimonials from "../components/landing/Testimonials";
import Toppers from "../components/landing/Toppers";
import AchievementWall from "../components/landing/AchievementWall";
import JourneyTimeline from "../components/landing/JourneyTimeline";
import StatsStrip from "../components/landing/StatsStrip";
import SchoolValues from "../components/landing/SchoolValues";
import LatestNews from "../components/landing/LatestNews";
import UpcomingEvents from "../components/landing/UpcomingEvents";
import FAQ from "../components/landing/FAQ";
import Contact from "../components/landing/Contact";
import Footer from "../components/landing/Footer";

export default function Landing() {
  return (
    <div className="font-body">
      <ScrollProgressBar />
      {/* Banner + nav share one fixed positioning context so the banner
          sits above the nav instead of being covered by it - Navbar itself
          no longer sets its own "fixed", it just renders inside this. */}
      <div className="fixed inset-x-0 top-0 z-50">
        
        <Navbar />
      </div>
      <Hero />
      <AdmissionBanner />
      <StatsStrip />
      <Facilities />
      <About />
      <Programs />
      <NoticesEvents />
      <GallerySection />
      <AcademicsSyllabus />
       <Toppers />
      <AchievementWall />
      <JourneyTimeline />
      <SchoolValues />
      <LatestNews />
      <UpcomingEvents />
      <AdmissionsFees />
     
      <Testimonials />
      <FAQ />
      <Contact />
      <Footer />
      <BackToTop />
      <WhatsAppButton />
    </div>
  );
}