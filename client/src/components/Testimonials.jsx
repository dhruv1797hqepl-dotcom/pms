import React from 'react';

const Testimonials = () => {
  return (
    <section className="py-24 px-6 bg-slate-50/50">
      <div className="max-w-4xl mx-auto text-center">
        <span className="text-emerald-600 font-bold tracking-widest uppercase text-xs">Testimonials</span>
        <h2 className="text-4xl font-bold text-slate-900 mt-4 mb-16">Results that speak for themselves.</h2>
        
        <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-100 relative">
          <div className="text-6xl text-emerald-200 absolute top-10 left-10 font-serif leading-none">“</div>
          <p className="text-2xl text-slate-700 leading-relaxed italic relative z-10">
            The handholding support from HQEPL transformed our business growth strategies. Their 25 years of experience ensured that every plan was executed to perfection.
          </p>
          <div className="mt-10">
            <p className="font-bold text-slate-900">Industry Leader</p>
            <p className="text-slate-500">Total Business Transformation Client</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;