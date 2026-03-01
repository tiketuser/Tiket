import NavBar from "../components/NavBar/NavBar";
import ContactSection from "../components/ContactSection/ContactSection";
import Footer from "../components/Footer/Footer";
import ContactForm from "../components/ContactForm/ContactForm";
import ContactInfoSection from "../components/ContactInfoSection/ContactInfoSection";

const ContactUs = () => {
  return (
    <div>
      <NavBar />
      <ContactSection />
      <div className="flex flex-col-reverse lg:flex-row justify-center items-center lg:items-start w-full shadow-small-inner pt-8 md:pt-14 px-4 sm:px-8 md:px-12 lg:px-20 xl:px-32 max-w-7xl mx-auto pb-8 md:pb-14 gap-8 lg:gap-16">
        <ContactForm />
        <ContactInfoSection />
      </div>
      <Footer />
    </div>
  );
};

export default ContactUs;
