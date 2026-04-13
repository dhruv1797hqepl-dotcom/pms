import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, CalendarRange, FileText } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const formatHours = (value) => {
  const hours = Number(value);
  if (!Number.isFinite(hours)) return '0';
  if (Number.isInteger(hours)) return String(hours);
  return hours.toFixed(1);
};

const formatDateTime = (isoString) => {
  if (!isoString) return '';
  const dt = new Date(isoString);
  if (Number.isNaN(dt.getTime())) return '';

  return dt.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const RC7Preview = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const previewPayload = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const rawPayload = params.get('payload');
    if (!rawPayload) return null;

    try {
      return JSON.parse(decodeURIComponent(rawPayload));
    } catch (error) {
      console.error('Failed to parse RC7 preview payload:', error);
      return null;
    }
  }, [location.search]);

  const dayColumns = previewPayload?.days || [];
  const maxDeliverableRows = dayColumns.reduce((max, day) => {
    const count = Array.isArray(day?.items) ? day.items.length : 0;
    return Math.max(max, count);
  }, 0);
  const deliverableRowCount = Math.max(maxDeliverableRows, 1);

  return (
    <div className="flex min-h-screen w-screen overflow-hidden bg-[#f7f7f7] antialiased">
      <Sidebar />

      <main className="flex-1 overflow-y-auto pb-12">
        <div className="mx-auto max-w-7xl px-4 py-4 md:px-6 md:py-8">
          <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => navigate('/rc7')}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100"
                >
                  <ArrowLeft size={14} /> Back to RC7
                </button>
                <div>
                  <h1 className="flex items-center gap-2 text-lg md:text-2xl font-black text-slate-900">
                    <CalendarRange size={22} className="text-rose-500" /> RC7 Preview
                  </h1>
                  <p className="mt-1 text-sm text-slate-600">
                    Read-only RC7 preview generated from current page data.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 print:hidden">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-sm transition-colors hover:bg-black"
                >
                  <Printer size={14} /> Print
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Employee</div>
                <div className="mt-1 text-sm font-bold text-slate-900">{previewPayload?.employeeLabel || 'Unknown'}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cycle</div>
                <div className="mt-1 text-sm font-bold text-slate-900">{previewPayload?.planLabel || previewPayload?.planType?.toUpperCase() || 'RC7'}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Preview Generated</div>
                <div className="mt-1 text-sm font-bold text-slate-900">{formatDateTime(previewPayload?.generatedAt) || '—'}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Submitted At</div>
                <div className="mt-1 text-sm font-bold text-slate-900">{formatDateTime(previewPayload?.submittedAt) || '—'}</div>
              </div>
            </div>
          </div>

          {!previewPayload ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <FileText size={24} />
              </div>
              <h2 className="mt-4 text-lg font-bold text-slate-900">No preview found</h2>
              <p className="mt-2 text-sm text-slate-500">
                Open this page using the Preview button on RC7.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="max-h-[74vh] overflow-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="sticky top-0 z-20 bg-slate-900 text-white">
                    <tr>
                      <th className="border-b border-slate-700 bg-slate-900 px-4 py-3 text-[11px] font-black uppercase tracking-widest sticky left-0 z-30 min-w-32">
                        Item
                      </th>
                      {dayColumns.map((day, index) => (
                        <th key={`${day.dayLabel}-${day.dateLabel}-${index}`} className="border-b border-slate-700 px-4 py-3 min-w-56 align-top">
                          <div className="text-[11px] font-black uppercase tracking-widest">
                            {day.dayLabel} {formatHours(day.totalHours)}h
                          </div>
                          <div className="mt-0.5 text-[11px] font-semibold text-slate-300 normal-case tracking-normal">
                            {day.dateLabel}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-slate-50/70">
                      <th className="border-b border-slate-200 bg-slate-100 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-600 sticky left-0 z-20">
                        Office
                      </th>
                      {dayColumns.map((day, index) => (
                        <td key={`office-${index}`} className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                          {day.office || '-'}
                        </td>
                      ))}
                    </tr>

                    {Array.from({ length: deliverableRowCount }).map((_, rowIndex) => (
                      <tr key={`deliverable-row-${rowIndex}`} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                        <th className="border-b border-slate-200 bg-slate-100 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-600 sticky left-0 z-20">
                          Deliverable {rowIndex + 1}
                        </th>
                        {dayColumns.map((day, dayIndex) => {
                          const item = day.items?.[rowIndex];
                          return (
                            <td key={`cell-${rowIndex}-${dayIndex}`} className="border-b border-slate-200 px-4 py-3 align-top">
                              {item ? (
                                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                                  <div className="text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">{item.deliverable}</div>
                                  <div className="mt-2 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                                    {formatHours(item.estimatedHours)}h
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default RC7Preview;
