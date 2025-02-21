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
      <div className="flex justify-center w-full shadow-small-inner pt-14 pr-80 pl-80 pb-14 gap-16">
        <ContactForm />
        <ContactInfoSection />
      </div>
      <Footer />
    </div>
  );
};

export default ContactUs;
