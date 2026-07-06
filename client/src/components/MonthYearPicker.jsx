import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

const MonthYearPicker = ({ selectedMonth, selectedYear, onChange, label, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempYear, setTempYear] = useState(selectedYear);
  const pickerRef = useRef(null);
  const popoverRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = [2025, 2026, 2027, 2028];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && pickerRef.current.contains(event.target)) return;
      if (popoverRef.current && popoverRef.current.contains(event.target)) return;
      setIsOpen(false);
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      const updatePosition = () => {
        if (pickerRef.current) {
          const rect = pickerRef.current.getBoundingClientRect();
          setPosition({
            top: rect.bottom + window.scrollY + 8,
            left: rect.left + window.scrollX + (rect.width / 2)
          });
        }
      };
      
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true); // Catch scrolls

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    setTempYear(selectedYear);
  }, [selectedYear, isOpen]);

  const popoverContent = isOpen ? (
    <div 
      ref={popoverRef}
      className="absolute p-4 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[99999] w-64 -translate-x-1/2"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      <div className="mb-4">
        <div className="relative">
          <select
            value={tempYear}
            onChange={(e) => setTempYear(parseInt(e.target.value, 10))}
            className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-center text-sm shadow-sm"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {months.map((m, index) => {
          const isSelected = (index + 1) === selectedMonth && tempYear === selectedYear;
          return (
            <button
              key={m}
              onClick={() => {
                onChange(tempYear, index + 1);
                setIsOpen(false);
              }}
              className={`py-2 text-sm font-semibold rounded-xl transition-all ${isSelected ? 'bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200'}`}
            >
              {m}
            </button>
          );
        })}
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className={`relative ${className}`} ref={pickerRef}>
        <div 
          className="cursor-pointer select-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          {label}
        </div>
      </div>
      {isOpen && createPortal(popoverContent, document.body)}
    </>
  );
};

export default MonthYearPicker;
