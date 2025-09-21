"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LandingPage() {
     const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState("roles");

  const [adminData, setAdminData] = useState({
    fullName: "",
    email: "",
    phone_number: "",
  });
  const [residentData, setResidentData] = useState({
    fullName: "",
    email: "",
    phone_number: "",
  });
  const [staffData, setStaffData] = useState({
    fullName: "",
    email: "",
    phone_number: "",
  });
  const [commonPassword, setCommonPassword] = useState("");

  const handleCloseModal = () => {
    setShowModal(false);
    setStep("roles");
  };

  // Simulate wallet connection
 const handleConnectWallet = async () => {
   if (typeof window.ethereum !== "undefined") {
     try {
       const accounts = await window.ethereum.request({
         method: "eth_requestAccounts",
       });

       const walletAddress = accounts[0];
       console.log("Connected wallet:", walletAddress);

       // Optional: store in localStorage for session persistence
       localStorage.setItem("walletAddress", walletAddress);

       // Redirect to dashboard
       router.push("/participant-dashboard"); // change this route as needed
     } catch (err) {
       console.error(err);
       alert("Wallet connection failed");
     }
   } else {
     alert(
       "MetaMask is not installed! Please install it from https://metamask.io/"
     );
   }
 };

  return (
    <section
      id="#home"
      className="min-h-screen flex flex-col items-center justify-center px-4 py-20"
    >
      <div className="max-w-7xl bg-black w-full flex flex-col lg:flex-row items-center gap-12">
        {/* Left content */}
        <div className="flex-1 max-w-2xl text-center lg:text-left">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
            CERTIMOS.
          </h1>
          <h1 className="text-3xl md:text-3xl lg:text-3xl font-bold text-[#358289] leading-tight">
            Life Verified.
          </h1>
          <p className="text-xl md:text-2xl lg:text-3xl mt-4 mb-8">
            Tamper-proof, permanent, and verifiable credentials
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center lg:justify-start">
            <button
              onClick={() => setShowModal(true)}
              className="rounded-lg bg-[#358289] px-8 py-4 text-2xl font-bold hover:scale-105 transition-transform"
            >
              SIGN-IN WITH GOOGLE
            </button>

            <button
              onClick={handleConnectWallet}
              className="rounded-lg bg-[#54D1DC] px-8 py-4 text-2xl font-bold hover:scale-105 transition-transform"
            >
              CONNECT WALLET
            </button>
          </div>
        </div>

        {/* Right illustration */}
        <div className="flex-1 flex justify-center items-center relative min-h-[400px]">
          <Image
            src="/certimos.svg"
            width={450}
            height={450}
            alt=""
          />
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={handleCloseModal}
          ></div>
          <div className="relative z-10 w-full max-w-2xl bg-black/90 p-6 md:p-10 rounded-2xl overflow-y-auto max-h-[90vh]">
            {/* Step components */}
            {step === "roles" && (
              <div className="flex flex-col gap-5 text-center">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Select your Role
                </h2>
                <button onClick={() => setStep("adminStep1")} className="btn">
                  Admin
                </button>
                <button
                  onClick={() => setStep("residentStep1")}
                  className="btn"
                >
                  Resident
                </button>
                <button onClick={() => setStep("staffStep1")} className="btn">
                  Staff
                </button>
              </div>
            )}

            {/* Admin */}
            {step === "adminStep1" && (
              <FormStep
                role="Admin"
                title="Step 1: Personal Info"
                fields={["fullName", "email", "phone_number"]}
                fieldLabels={["Name*", "Email*", "Phone*"]}
                formData={adminData}
                setFormData={setAdminData}
                onBack={() => setStep("roles")}
                onNext={() => setStep("adminStep2")}
              />
            )}
            {step === "adminStep2" && (
              <FinalStep
                role="Admin"
                password={commonPassword}
                setPassword={setCommonPassword}
                onBack={() => setStep("adminStep1")}
                onSubmit={() => alert("Admin Registered!")}
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}
