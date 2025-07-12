// src/pages/index.js
import { useState, useEffect, useRef } from "react";
import { supabase } from "lib/supabase";
import toast from "react-hot-toast";
import { Icon } from "@iconify/react"; 
import Register from "./register";
import ForgotPasswordModal from "../components/forgotPassword";
import Link from "next/link";
import { useRouter } from "next/router";
import { useUser } from "@/context/UserContext";
import { Swiper, SwiperSlide } from "swiper/react";
import ReCAPTCHA from "react-google-recaptcha";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination, Autoplay } from "swiper/modules";
import Image from "next/image";

export default function Home() {
  const { login } = useUser();
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] =
    useState(false);
  const [quotes, setQuotes] = useState([]);
  const [captchaToken, setCaptchaToken] = useState(null);
  const recaptchaRef = useRef(null);
  const router = useRouter();
  const notify = (message) => toast(message);

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const response = await fetch("https://dummyjson.com/quotes");
        const data = await response.json();
        const today = new Date().toDateString();
        const seed = today
          .split("")
          .reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const shuffled = data.quotes.sort(
          () => 0.5 - ((Math.random() * seed) % 1)
        );
        const selectedQuotes = shuffled.slice(0, 4).map((quote) => ({
          q: quote.quote,
          a: quote.author,
        }));
        setQuotes(selectedQuotes);
      } catch (error) {
        setQuotes([]);
      }
    };
    fetchQuotes();
  }, []);

  const handleFormSwitch = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    setIsRegistering(!isRegistering);
    setError("");
    setLoginEmail("");
    setLoginPassword("");
    setCaptchaToken(null);
    if (recaptchaRef.current) recaptchaRef.current.reset();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!captchaToken) {
      setError("Please complete the CAPTCHA");
      return;
    }
    setError("");
    const toastId = notify("Please wait...");

    try {
      const result = await login(loginEmail, loginPassword, captchaToken);
      if (result && result.token) {
        toast.dismiss(toastId);
        
        // Check if user is pending approval
        if (result.isPendingApproval) {
          const welcomeMessage = `Welcome ${result.user.full_name || "User"}! Your account is pending approval.`;
          toast.success(welcomeMessage);
          localStorage.setItem("rememberMe", rememberMe);
          setTimeout(() => {
            router.push("/dashboard");
          }, 100);
        } else {
          const welcomeMessage = `Authenticated, Welcome ${
            result.user.full_name || "User"
          }`;
          toast.success(welcomeMessage);
          localStorage.setItem("rememberMe", rememberMe);
          setTimeout(() => {
            router.push("/dashboard");
          }, 100);
        }
      } else {
        throw new Error("No token received from login");
      }
    } catch (error) {
      toast.dismiss(toastId);
      setError(error.message);
      toast.error(`Login failed: ${error.message}`);
      setCaptchaToken(null);
      if (recaptchaRef.current) recaptchaRef.current.reset();
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const onCaptchaChange = (token) => {
    setCaptchaToken(token);
  };

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="flex h-full max-w-sm lg:max-w-full w-full">
        <div className="flex flex-col md:flex-row shadow-2xl overflow-hidden w-full">
          <div className="w-full md:w-1/3 p-8 px-10 h-full flex flex-col overflow-y-auto">
            <div className="pb-8">
              <Link
                href="https://sustainableinsurancedeclaration.org/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/assets/images/logo.svg"
                  alt="Logo"
                  width={180}
                  height={50}
                />
              </Link>
            </div>
            <div className="flex flex-col justify-start flex-1">
              <div className="mb-6">
                <p className="text-3xl leading-10 mobile:text-2xl pb-2 text-black font-medium">
                  {isRegistering
                    ? "Join the NDSI Community"
                    : "Welcome Back to NDSI"}
                </p>
                <p>
                  {isRegistering
                    ? "Become a member of the National Dialogue on Sustainable Insurance (NDSI) platform to access exclusive resources, training, and collaborative tools that support a more sustainable future in the insurance sector."
                    : "Sign in to access your personalized dashboard and stay connected with sustainable insurance initiatives."}
                </p>
              </div>

              {isRegistering ? (
                <Register
                  closeRegister={handleFormSwitch}
                  notify={notify}
                  setError={setError}
                  router={router}
                  recaptchaRef={recaptchaRef}
                  onCaptchaChange={onCaptchaChange}
                />
              ) : (
                <form onSubmit={handleLogin}>
                  <div className="mt-8">
                    <label className="text-gray-900 text-sm mb-2">E-mail</label>
                    <div className="flex items-center border border-[#28A8E0] rounded focus:outline-none focus:border-fuchsia-900 hover:border-fuchsia-900 transition-all duration-700 ease-in-out">
                      <input
                        className="bg-transparent py-2 px-4 block w-full rounded"
                        type="text"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="example@gmail.com"
                        required
                      />
                      {/* Replaced FaRegEnvelope with Iconify icon */}
                      <Icon
                        icon="mdi:email-outline"
                        className="text-gray-500 h-5 w-5 mr-2"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="text-gray-900 text-sm mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <span
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                        onClick={togglePasswordVisibility}
                      >
                        {showPassword ? (
                          <Icon
                            icon="mdi:eye-off-outline"
                            className="text-gray-500 h-5 w-5"
                          />
                        ) : (
                          <Icon
                            icon="mdi:eye-outline"
                            className="text-gray-500 h-5 w-5"
                          />
                        )}
                      </span>
                      <input
                        className="bg-transparent border border-[#28A8E0] rounded py-2 px-4 block w-full focus:outline-none focus:border-fuchsia-900 hover:border-fuchsia-900 transition-all duration-700 ease-in-out"
                        type={showPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                      onChange={onCaptchaChange}
                    />
                  </div>

                  {error && (
                    <p className="mt-2 text-red-500 text-sm">{error}</p>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <label className="flex items-center text-xs text-gray-500">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={rememberMe}
                        onChange={() => setRememberMe(!rememberMe)}
                      />
                      Remember me
                    </label>
                    <Link
                      href="#"
                      className="text-gray-400 hover:text-gray-900"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsForgotPasswordModalOpen(true);
                      }}
                    >
                      Forgot my password?
                    </Link>
                  </div>

                  <div className="mt-8">
                    <button
                      type="submit"
                      className="bg-[#28A8E0] text-white font-bold py-4 px-4 w-full rounded-lg transform transition-transform duration-700 ease-in-out hover:scale-105"
                    >
                      Login
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-6 flex items-center w-full space-x-2">
                <span className="text-gray-400">
                  {isRegistering
                    ? "Already have an account?"
                    : "Don't have an account yet?"}{" "}
                </span>
                <Link
                  href="#"
                  className="hover:text-gray-900 underline"
                  onClick={(e) => handleFormSwitch(e)}
                >
                  <span className="text-[#28A8E0] underline hover:text-gray-900">
                    {isRegistering ? "Back to Login" : "Sign Up Here"}
                  </span>
                </Link>
              </div>
              
              <div className="mt-4 text-center">
                <Link
                  href="/admin/login"
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Admin Login
                </Link>
              </div>
            </div>
          </div>

          <div
            className="md:block lg:w-2/3 bg-cover bg-center transition-all duration-700 ease-in-out h-full relative"
            style={{ backgroundImage: `url('/assets/images/form-bg.png')` }}
          >
            {quotes.length > 0 && (
              <Swiper
                spaceBetween={50}
                slidesPerView={1}
                pagination={{
                  clickable: true,
                  type: "bullets",
                  dynamicBullets: false,
                }}
                autoplay={{
                  delay: 10000,
                  disableOnInteraction: false,
                }}
                loop={true}
                modules={[Pagination, Autoplay]}
                className="h-full"
              >
                {quotes.map((quote, index) => (
                  <SwiperSlide key={index}>
                    <div className="h-full flex flex-col justify-end items-start text-left p-10 text-white">
                      <div className="mb-12">
                        <p className="text-xl">{quote.q}</p>
                        <p className="mt-2 text-lg text-green-400">
                          - {quote.a}
                        </p>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </div>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={isForgotPasswordModalOpen}
        closeModal={() => setIsForgotPasswordModalOpen(false)}
        notify={notify}
      />
    </div>
  );
}
