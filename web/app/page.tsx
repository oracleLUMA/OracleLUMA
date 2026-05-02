import Header from "./components/Header";
import Hero from "./components/Hero";
import Section2 from "./components/Section2";
import Section3 from "./components/Section3";
import HowItWorks from "./components/HowItWorks";
import SocialSection from "./components/SocialSection";

export default function Home() {
  return (
    <main style={{ background: "var(--background)" }}>
      <Header />
      <div id="hero"><Hero /></div>
      <Section2 />
      <div id="features"><Section3 /></div>
      <div id="how-it-works"><HowItWorks /></div>
      <SocialSection />
    </main>
  );
}
