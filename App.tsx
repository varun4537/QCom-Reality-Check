import React, { useState } from 'react';
import { Coordinates, SimulationResult, AnalysisResponse } from './types';
import { discoverStores, analyzeFeasibility } from './services/geminiService';
import EstimatesChart from './components/EstimatesChart';
import AnalysisCard from './components/AnalysisCard';
import { MapPinIcon, TruckIcon, BoltIcon, GlobeAltIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { MapPinIcon as SolidMapPin } from '@heroicons/react/24/solid';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Handle "Use My Location"
  const handleGeoLocation = () => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordsStr = `${position.coords.latitude}, ${position.coords.longitude}`;
        runLiveCheck(coordsStr, "Your Coordinates");
      },
      (err) => {
        console.error(err);
        setError("Unable to retrieve location. Please try manually entering a nearby landmark.");
        setLoading(false);
      }
    );
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    runLiveCheck(manualInput, manualInput);
  };

  const runLiveCheck = async (locationQuery: string, label: string) => {
    setLoading(true);
    setError(null);
    setSimulation(null);
    setAnalysis(null);

    try {
      // 1. Live Search for Stores
      const estimates = await discoverStores(locationQuery);
      
      setSimulation({
        userLocation: null, // We rely on query string for search now
        addressLabel: label,
        estimates: estimates,
        timestamp: new Date()
      });

      // 2. Analyze
      setAnalyzing(true);
      const analysisResult = await analyzeFeasibility(label, estimates);
      setAnalysis(analysisResult);
    } catch (err) {
      setError("Failed to perform reality check. Please try again.");
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BoltIcon className="w-6 h-6 text-yellow-500 fill-yellow-500" />
            <h1 className="font-bold text-lg tracking-tight">Q-Commerce Reality Check</h1>
          </div>
          <div className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">Live Search Mode</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-8">
        
        {/* Hero / Input Section */}
        {!simulation && !loading && (
          <div className="max-w-xl mx-auto text-center mt-10">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">
              Is that 10-minute promise realistic?
            </h2>
            <p className="text-slate-600 mb-8 leading-relaxed">
              We search the live web for <strong>real dark store locations</strong> near you to estimate actual travel times, exposing infrastructure gaps.
            </p>

            <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
              <form onSubmit={handleManualSearch} className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Enter specific area (e.g., 'HSR Layout Sector 2')"
                  className="flex-1 border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 rounded-lg transition disabled:opacity-50"
                >
                  Check
                </button>
              </form>
              
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">OR</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button
                onClick={handleGeoLocation}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-medium py-3 rounded-lg transition mt-2"
              >
                <MapPinIcon className="w-5 h-5" />
                Use My Current Location
              </button>
              
              {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
            </div>
            
            <div className="mt-8 flex justify-center gap-2 text-xs text-slate-400">
               <GlobeAltIcon className="w-4 h-4" /> Powered by Google Search Grounding
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="max-w-xl mx-auto text-center mt-20">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
             <h3 className="text-lg font-semibold text-slate-800">Searching the real world...</h3>
             <p className="text-slate-500 text-sm mt-2">Locating fulfillment centers and calculating distances.</p>
          </div>
        )}

        {/* Results Section */}
        {simulation && !loading && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Search Results</h2>
                <p className="text-slate-500 text-sm flex items-center gap-1">
                  <SolidMapPin className="w-3 h-3" /> Area: {simulation.addressLabel}
                </p>
              </div>
              <button 
                onClick={() => { setSimulation(null); setAnalysis(null); setManualInput(''); }}
                className="text-sm text-slate-500 hover:text-indigo-600 font-medium underline"
              >
                Check another location
              </button>
            </div>

            {/* Feasibility Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {simulation.estimates.map((est) => (
                <div key={est.platform} className={`rounded-xl p-5 border shadow-sm transition relative overflow-hidden flex flex-col h-full ${est.source === 'Not Found' ? 'bg-slate-50 border-slate-200 opacity-80' : 'bg-white border-slate-100 hover:shadow-md'}`}>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: est.color }}></div>
                    <h3 className="font-bold text-slate-700">{est.platform}</h3>
                  </div>
                  
                  {est.source === 'Not Found' ? (
                    <div className="flex-grow flex flex-col justify-center text-slate-400 text-sm">
                      <p className="font-medium">No verified hub found.</p>
                      <p className="text-xs mt-1">Could not locate a listed dark store near this location.</p>
                    </div>
                  ) : (
                    <div className="space-y-1 flex-grow">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-slate-900">{est.estimatedTravelTimeMin}</span>
                        <span className="text-sm text-slate-500">mins</span>
                      </div>
                      <p className={`text-sm font-semibold ${
                        est.feasibility === 'Highly Feasible' ? 'text-green-600' :
                        est.feasibility === 'Borderline' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {est.feasibility}
                      </p>
                      <div className="text-xs text-slate-500 mt-1">
                        (~{est.distanceKm} km drive)
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400">
                    <span className="uppercase tracking-wider font-semibold text-[10px] text-slate-300 block mb-1">Found Location</span>
                    <span className="text-slate-700 font-medium block truncate" title={est.storeAddress}>{est.storeName}</span>
                    <span className="text-slate-500 block truncate" title={est.storeAddress}>{est.storeAddress}</span>
                    
                    {est.evidenceLink && (
                       <a href={est.evidenceLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 mt-2 text-indigo-500 hover:text-indigo-700">
                         <GlobeAltIcon className="w-3 h-3" />
                         Verify Source
                         <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                       </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Chart - Only show if we found at least one store */}
            {simulation.estimates.some(e => e.source !== 'Not Found') && (
               <EstimatesChart data={simulation.estimates.filter(e => e.source !== 'Not Found')} />
            )}

            {/* Gemini Analysis */}
            <AnalysisCard data={analysis} loading={analyzing} />
            
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-400 mb-2">
            <strong>Disclaimer:</strong> Results are based on live web search of public listings. 
            Companies may operate undisclosed dark stores not visible here.
          </p>
          <div className="flex justify-center gap-4 text-sm text-slate-500">
             <span>Methodology</span>
             <span>•</span>
             <span>About</span>
             <span>•</span>
             <span>Data Sources</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;