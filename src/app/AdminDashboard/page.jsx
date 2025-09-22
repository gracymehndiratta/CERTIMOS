//  "use client";

//  import { useSession, signOut } from "next-auth/react";
//  import { useRouter } from "next/navigation";
//  import { useState, useEffect } from "react";
//  import {
//    FaUpload,
//    FaSpinner,
//    FaCheckCircle,
//    FaExclamationCircle,
//  } from "react-icons/fa";
//  import StarBorder from "../components/ui/StarBorder";

//  export default function AdminDashboard() {
   
//    const router = useRouter();

//    const [loading, setLoading] = useState(false);
//    const [success, setSuccess] = useState(null);
//    const [error, setError] = useState(null);

//    const [formState, setFormState] = useState({
//      eventName: "",
//      eventDate: "",
//      templateImage: null,
//      participantList: null,
//    });

//    const handleInputChange = (e) => {
//      const { name, value } = e.target;
//      setFormState((prev) => ({ ...prev, [name]: value }));
//    };

//    const handleFileChange = (e) => {
//      const { name, files } = e.target;
//      if (files.length > 0) {
//        setFormState((prev) => ({ ...prev, [name]: files[0] }));
//      }
//    };

//    const handleSubmit = async (e) => {
//      e.preventDefault();
//      setLoading(true);
//      setSuccess(null);
//      setError(null);

//      const formData = new FormData();
//      formData.append("eventName", formState.eventName);
//      formData.append("eventDate", formState.eventDate);
//      if (formState.templateImage) {
//        formData.append("templateImage", formState.templateImage);
//      }
//      if (formState.participantList) {
//        formData.append("participantList", formState.participantList);
//      }

//      try {
//        const response = await fetch("/api/issue-certificates", {
//          method: "POST",
//          body: formData,
//        });

//        if (!response.ok) {
//          const errorData = await response.json();
//          throw new Error(errorData.message || "Failed to issue certificates");
//        }

//        const result = await response.json();
//        setSuccess(result);
//        setLoading(false);
//      } catch (err) {
//        setError(err.message);
//        setLoading(false);
//      }
//    };

 

//    return (
//      <div className="min-h-screen bg-black text-white px-4 md:px-8 py-12">
//        <header className="flex justify-between items-center mb-12 pb-6">
//          <div className="flex items-center">
//            <h1 className="text-4xl font-extrabold text-white animate-fade-in">
//              Organizer Portal
//            </h1>
//          </div>
//          <div className="flex items-center gap-4">
//            <p className="text-lg text-gray-400">
//              Welcome,!
//            </p>
//            <button
//              onClick={() => signOut({ callbackUrl: "/" })}
//              className="rounded-lg bg-red-600 px-6 py-3 text-lg font-bold hover:scale-105 transition-transform"
//            >
//              Sign Out
//            </button>
//          </div>
//        </header>
//        <main className="flex justify-center items-center">
//          <StarBorder>
//            <div className="w-full max-w-7xl p-8 md:p-12 transition-all duration-300 transform hover:scale-[1.01]">
//              <h2 className="text-3xl font-bold mb-8 text-center text-[#2cf2f9]">
//                Issue New Certificates
//              </h2>
//              <form onSubmit={handleSubmit} className="space-y-8">
//                {/* Step A: Event Details */}
//                <div className="border-b border-gray-700 pb-6">
//                  <h3 className="text-2xl font-semibold mb-4 text-white">
//                    Step A: Event Details
//                  </h3>
//                  <div className="space-y-4">
//                    <input
//                      type="text"
//                      name="eventName"
//                      placeholder="Event Name"
//                      value={formState.eventName}
//                      onChange={handleInputChange}
//                      required
//                      className="w-full bg-gray-700 p-4 rounded-xl border border-gray-600 text-gray-200 placeholder-gray-400 focus:outline-none focus:border-[#2cf2f9] transition-colors"
//                    />
//                    <input
//                      type="date"
//                      name="eventDate"
//                      value={formState.eventDate}
//                      onChange={handleInputChange}
//                      required
//                      className="w-full bg-gray-700 p-4 rounded-xl border border-gray-600 text-gray-200 focus:outline-none focus:border-[#2cf2f9] transition-colors"
//                    />
//                    <div>
//                      <label className="block text-gray-400 mb-2">
//                        Upload Certificate Template Image:
//                      </label>
//                      <div className="flex items-center space-x-4">
//                        <input
//                          type="file"
//                          name="templateImage"
//                          accept="image/*"
//                          onChange={handleFileChange}
//                          required
//                          className="w-full text-sm text-gray-400 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#00b9c0] file:text-white hover:file:bg-[#2cf2f9] cursor-pointer transition-colors"
//                        />
//                        <FaUpload className="text-xl text-gray-400" />
//                      </div>
//                    </div>
//                  </div>
//                </div>

//                {/* Step B: Participant List */}
//                <div className="border-b border-gray-700 pb-6">
//                  <h3 className="text-2xl font-semibold mb-4 text-white">
//                    Step B: Participant List
//                  </h3>
//                  <div>
//                    <label className="block text-gray-400 mb-2">
//                      Upload CSV File (participant_name, wallet_address):
//                    </label>
//                    <div className="flex items-center space-x-4">
//                      <input
//                        type="file"
//                        name="participantList"
//                        accept=".csv"
//                        onChange={handleFileChange}
//                        required
//                        className="w-full text-sm text-gray-400 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#00b9c0] file:text-white hover:file:bg-[#2cf2f9] cursor-pointer transition-colors"
//                      />
//                      <FaUpload className="text-xl text-gray-400" />
//                    </div>
//                  </div>
//                </div>
//                <div className="border-b border-gray-700 pb-6">
//                  <h3 className="2xl font-semibold mb-4 text-white">
//                    Step C: Submission
//                  </h3>
//                  <div>
//                    <button
//                      type="submit"
//                      disabled={loading}
//                      className={`w-full py-4 text-2xl font-bold rounded-xl transition-all duration-300 transform ${
//                        loading
//                          ? "bg-gray-600 cursor-not-allowed flex items-center justify-center"
//                          : "bg-gradient-to-r from-[#00b9c0] to-[#2cf2f9] hover:scale-[1.02] active:scale-95"
//                      }`}
//                    >
//                      {loading ? (
//                        <>
//                          <FaSpinner className="animate-spin mr-3 text-white" />
//                          <span className="text-white">
//                            Minting in Progress...
//                          </span>
//                        </>
//                      ) : (
//                        "Issue Certificates"
//                      )}
//                    </button>
//                  </div>
//                </div>
//                {success && (
//                  <div className="flex items-center p-4 rounded-lg bg-green-600">
//                    <FaCheckCircle className="text-2xl mr-4" />
//                    <div>
//                      <p className="font-semibold text-white">
//                        Certificates issued successfully!
//                      </p>
//                      <p className="text-sm text-green-100 mt-1">
//                        View transactions:{" "}
//                        <a
//                          href={`https://explorer.apothem.network/tx/${success.transactionHash}`}
//                          target="_blank"
//                          rel="noopener noreferrer"
//                          className="underline hover:text-white"
//                        >
//                          Click here
//                        </a>
//                      </p>
//                    </div>
//                  </div>
//                )}
//                {error && (
//                  <div className="flex items-center p-4 rounded-lg bg-red-600">
//                    <FaExclamationCircle className="text-2xl mr-4" />
//                    <div>
//                      <p className="font-semibold text-white">Error: {error}</p>
//                    </div>
//                  </div>
//                )}
//              </form>
//            </div>
//          </StarBorder>
//        </main>
//      </div>
//    );
//  }