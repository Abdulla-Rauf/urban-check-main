import React, { useState } from 'react';
import { X, Ruler } from 'lucide-react';
import { SIZE_GUIDE_CHART } from '../../constants';

export const SizeGuideModal = ({ isOpen, onClose, category = 'tops' }) => {
  const [unit, setUnit] = useState('in'); // 'in' or 'cm'
  const [guideTab, setGuideTab] = useState(
    category.toLowerCase().includes('trouser') || category.toLowerCase().includes('pant')
      ? 'trousers'
      : 'tops'
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white shadow-2xl border border-urban-border z-10 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-urban-border">
          <div className="flex items-center space-x-2">
            <Ruler size={18} className="text-urban-teal" />
            <h3 className="font-serif text-lg font-semibold text-urban-black">
              Sizing Reference Guide
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-urban-warm-grey hover:text-urban-black transition-colors"
            aria-label="Close Size Guide"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-urban-warm-grey">
          {/* Controls: Category Switcher + Unit Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-urban-border/60">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setGuideTab('tops')}
                className={`px-3 py-1.5 uppercase tracking-wider font-semibold text-[11px] transition-colors border ${
                  guideTab === 'tops'
                    ? 'border-urban-black bg-urban-black text-white'
                    : 'border-urban-border bg-white text-urban-black hover:border-urban-black'
                }`}
              >
                Jackets & Tops
              </button>
              <button
                type="button"
                onClick={() => setGuideTab('trousers')}
                className={`px-3 py-1.5 uppercase tracking-wider font-semibold text-[11px] transition-colors border ${
                  guideTab === 'trousers'
                    ? 'border-urban-black bg-urban-black text-white'
                    : 'border-urban-border bg-white text-urban-black hover:border-urban-black'
                }`}
              >
                Trousers & Bottoms
              </button>
            </div>

            <div className="flex items-center space-x-1 border border-urban-border p-0.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setUnit('in')}
                className={`px-2.5 py-1 text-[10px] font-semibold uppercase ${
                  unit === 'in' ? 'bg-urban-teal text-white' : 'text-urban-warm-grey'
                }`}
              >
                Inches
              </button>
              <button
                type="button"
                onClick={() => setUnit('cm')}
                className={`px-2.5 py-1 text-[10px] font-semibold uppercase ${
                  unit === 'cm' ? 'bg-urban-teal text-white' : 'text-urban-warm-grey'
                }`}
              >
                CM
              </button>
            </div>
          </div>

          {/* Measurements Table */}
          <div className="overflow-x-auto">
            {guideTab === 'tops' ? (
              <table className="w-full text-left border-collapse border border-urban-border">
                <thead>
                  <tr className="bg-urban-light-grey text-urban-black font-semibold uppercase text-[10px] tracking-wider">
                    <th className="p-3 border border-urban-border">Size</th>
                    <th className="p-3 border border-urban-border">Chest</th>
                    <th className="p-3 border border-urban-border">Waist</th>
                    <th className="p-3 border border-urban-border">Shoulder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-urban-border font-mono text-[11px]">
                  {SIZE_GUIDE_CHART.tops.map((row) => (
                    <tr key={row.size} className="hover:bg-urban-light-grey/40">
                      <td className="p-3 font-semibold text-urban-black border border-urban-border">
                        {row.size}
                      </td>
                      <td className="p-3 border border-urban-border">{row.chest}</td>
                      <td className="p-3 border border-urban-border">{row.waist}</td>
                      <td className="p-3 border border-urban-border">{row.shoulder}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse border border-urban-border">
                <thead>
                  <tr className="bg-urban-light-grey text-urban-black font-semibold uppercase text-[10px] tracking-wider">
                    <th className="p-3 border border-urban-border">Waist Size</th>
                    <th className="p-3 border border-urban-border">Natural Waist</th>
                    <th className="p-3 border border-urban-border">Hip Width</th>
                    <th className="p-3 border border-urban-border">Inseam Length</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-urban-border font-mono text-[11px]">
                  {SIZE_GUIDE_CHART.trousers.map((row) => (
                    <tr key={row.size} className="hover:bg-urban-light-grey/40">
                      <td className="p-3 font-semibold text-urban-black border border-urban-border">
                        {row.size}
                      </td>
                      <td className="p-3 border border-urban-border">{row.waist}</td>
                      <td className="p-3 border border-urban-border">{row.hip}</td>
                      <td className="p-3 border border-urban-border">{row.inseam}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Measuring Guidance */}
          <div className="bg-urban-light-grey/60 p-4 border border-urban-border/60">
            <h4 className="font-semibold text-urban-black uppercase tracking-editorial text-[10px] mb-2">
              Measurement Advice
            </h4>
            <ul className="space-y-1.5 text-xs text-urban-warm-grey list-disc list-inside">
              <li>
                <strong className="text-urban-black">Chest:</strong> Measure around the fullest part of your chest, keeping the tape comfortably horizontal under the arms.
              </li>
              <li>
                <strong className="text-urban-black">Waist:</strong> Measure around your natural waistline, slightly above the navel.
              </li>
              <li>
                <strong className="text-urban-black">Fit Recommendation:</strong> Urban Check tailored pieces feature an architectural contour cut. If between sizes, we suggest choosing the larger size for layering.
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-urban-border bg-white flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-urban-black text-white text-xs uppercase tracking-widest font-semibold hover:bg-urban-teal transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
