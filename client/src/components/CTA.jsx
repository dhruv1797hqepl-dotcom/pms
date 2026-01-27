import React from "react";

const CTA = () => {
  return (
    <section className="relative bg-gradient-to-r from-indigo-600 to-violet-600 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-24 text-center text-white">

        <h2 className="text-4xl md:text-5xl font-extrabold">
          Ready to transform your business?
        </h2>

        <p className="mt-6 max-w-2xl mx-auto text-lg text-indigo-100">
          Get a structured assessment, expert guidance, and a clear execution
          roadmap tailored to your organization.
        </p>

        <div className="mt-10 flex justify-center gap-6">
          <a
            href="#"
            className="inline-flex items-center justify-center rounded-full bg-white px-10 py-4 text-base font-semibold text-indigo-700 hover:bg-indigo-50 transition shadow-xl"
          >
            Schedule Free Consultation
          </a>

          <a
            href="#"
            className="inline-flex items-center justify-center rounded-full border border-white/40 px-10 py-4 text-base font-semibold text-white hover:bg-white/10 transition"
          >
            Talk to an Expert
          </a>
        </div>

      </div>
    </section>
  );
};

export default CTA;
