import Container from "@/components/layout/public/Container";
import HeroCarousel from "@/components/home/HeroCarousel";
import FeaturedCourses from "@/components/home/FeaturedCourses";
import WhyEduClass from "@/components/home/WhyEduClass";
import HowItWorks from "@/components/home/HowItWorks";
import Testimonials from "@/components/home/Testimonials";

export default function HomePage() {
  return (
    <>
      <Container className="pt-2 pb-6 sm:pt-3 sm:pb-8 md:pt-4 md:pb-10">
        <HeroCarousel />
      </Container>

      <FeaturedCourses />

      <WhyEduClass />

      <HowItWorks />

      <Testimonials />
    </>
  );
}
