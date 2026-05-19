import React, { useMemo, useState, useCallback } from 'react';
import {
  FaMapMarkerAlt,
  FaSearch,
  FaChevronDown,
  FaTh,
  FaList,
  FaArrowRight,
  FaTimes,
  FaUsers,
  FaHospital,
  FaExternalLinkAlt,
  FaImage
} from 'react-icons/fa';
import logo from '../../img/logo.png';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export const getBarangayFullAddress = (name) =>
  `${name}, General Luna, Quezon Province, Philippines`;

export const getMapEmbedUrl = (address) => {
  const query = encodeURIComponent(address);
  if (GOOGLE_MAPS_API_KEY) {
    return `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${query}`;
  }
  return `https://www.google.com/maps?q=${query}&z=14&output=embed`;
};

export const getMapSearchUrl = (address) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

export const getMapDirectionsUrl = (address) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

export function enrichBarangays(barangays) {
  return barangays.map((brgy) => ({
    ...brgy,
    fullAddress: getBarangayFullAddress(brgy.name),
    popCount: brgy.pop.split(' ')[0],
    householdsCount: brgy.households.split(' ')[0]
  }));
}

export default function BarangayExplorer({ barangays, expanded, onToggleExpanded }) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selected, setSelected] = useState(null);
  const [modalTab, setModalTab] = useState('overview');
  const [showModal, setShowModal] = useState(false);

  const enriched = useMemo(() => enrichBarangays(barangays), [barangays]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return enriched;
    return enriched.filter(
      (b) => b.name.toLowerCase().includes(q) || b.fullAddress.toLowerCase().includes(q)
    );
  }, [enriched, search]);

  const openDetails = useCallback((barangay) => {
    setSelected(barangay);
    setModalTab('overview');
    setShowModal(true);
  }, []);

  const closeModal = () => {
    setShowModal(false);
    setSelected(null);
  };

  return (
    <>
      <div className="mb-8">
        <button
          type="button"
          onClick={onToggleExpanded}
          className="w-full bg-white rounded-xl shadow-md border-2 border-orange-200 p-4 sm:p-5 hover:shadow-lg transition-all text-left"
          aria-expanded={expanded}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-gradient-to-r from-orange-500 to-blue-700 w-11 h-11 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                <FaMapMarkerAlt className="text-lg sm:text-xl text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">27 Barangays of General Luna</h2>
                <p className="text-xs sm:text-sm text-gray-600">
                  Explore locations, maps, and community profiles
                </p>
              </div>
            </div>
            <FaChevronDown className={`text-xl text-gray-400 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {expanded && (
          <div className="mt-4 bg-white rounded-xl border-2 border-orange-200 p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col gap-3 mb-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search by barangay or location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 text-sm flex items-center gap-1.5 ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    <FaTh /> Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 text-sm flex items-center gap-1.5 border-l border-gray-200 ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    <FaList /> List
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  {filtered.length} of {enriched.length} barangays
                </p>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FaMapMarkerAlt className="mx-auto text-3xl text-gray-300 mb-2" />
                <p>No barangay matches your search.</p>
              </div>
            ) : viewMode === 'list' ? (
              <div className="space-y-3">
                {filtered.map((barangay) => (
                  <button
                    key={barangay.name}
                    type="button"
                    onClick={() => openDetails(barangay)}
                    className="w-full flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border-2 border-orange-100 hover:border-orange-400 bg-white text-left transition-all hover:shadow-md"
                  >
                    <img
                      src={barangay.image}
                      alt=""
                      className="w-full sm:w-24 h-24 object-cover rounded-lg flex-shrink-0"
                      onError={(e) => { e.target.onerror = null; e.target.src = logo; }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900">{barangay.name}</h3>
                      <p className="text-xs text-gray-600 mt-1 flex items-start gap-1">
                        <FaMapMarkerAlt className="text-orange-500 mt-0.5 flex-shrink-0" />
                        {barangay.fullAddress}
                      </p>
                      <p className="text-sm text-gray-700 mt-2">Pop. {barangay.popCount} · {barangay.area}</p>
                    </div>
                    <span className="text-sm font-semibold text-blue-700 flex items-center gap-1">
                      Open <FaArrowRight className="text-xs" />
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((barangay) => (
                  <article
                    key={barangay.name}
                    className="group bg-white rounded-xl border-2 border-orange-100 hover:border-orange-400 overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => openDetails(barangay)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && openDetails(barangay)}
                  >
                    <div className="relative h-36 sm:h-40 bg-gray-100">
                      <img
                        src={barangay.image}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.target.onerror = null; e.target.src = logo; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <h3 className="absolute bottom-3 left-3 right-3 text-white font-bold text-base sm:text-lg drop-shadow">
                        {barangay.name}
                      </h3>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-gray-600 flex items-start gap-1.5 mb-3 line-clamp-2">
                        <FaMapMarkerAlt className="text-orange-500 mt-0.5 flex-shrink-0" />
                        {barangay.fullAddress}
                      </p>
                      <div className="flex justify-between text-sm mb-3">
                        <span className="text-gray-500">Population</span>
                        <span className="font-semibold">{barangay.popCount}</span>
                      </div>
                      <span className="block w-full text-center py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-blue-700 text-white text-sm font-semibold">
                        View Details & Map
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            <div className="relative bg-gradient-to-r from-orange-500 via-orange-600 to-blue-700 p-4 sm:p-5 flex-shrink-0">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="inline-block bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold text-white mb-1">
                    BARANGAY PROFILE
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                    <FaMapMarkerAlt className="flex-shrink-0" />
                    <span className="truncate">{selected.name}</span>
                  </h3>
                  <p className="text-orange-100 text-xs sm:text-sm mt-1">{selected.fullAddress}</p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white flex-shrink-0"
                  aria-label="Close"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
                {['overview', 'map', 'illustration'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setModalTab(tab)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap capitalize ${
                      modalTab === tab ? 'bg-white text-orange-600' : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {tab === 'illustration' ? 'Map image' : tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-grow overflow-auto bg-gradient-to-br from-orange-50 via-white to-blue-50 p-4 sm:p-5">
              {modalTab === 'overview' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
                      <p className="text-xs text-orange-100">Land Area</p>
                      <p className="text-lg font-bold">{selected.area}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl p-4 text-white">
                      <p className="text-xs text-blue-100 flex items-center gap-1"><FaUsers /> Population</p>
                      <p className="text-lg font-bold">{selected.pop}</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-600 to-blue-700 rounded-xl p-4 text-white">
                      <p className="text-xs text-orange-100 flex items-center gap-1"><FaHospital /> Households</p>
                      <p className="text-lg font-bold">{selected.households}</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-orange-200 p-4 mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Full location</p>
                    <p className="text-sm text-gray-900 font-medium">{selected.fullAddress}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <a
                      href={getMapSearchUrl(selected.fullAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800"
                    >
                      <FaExternalLinkAlt /> Open in Google Maps
                    </a>
                    <a
                      href={getMapDirectionsUrl(selected.fullAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-orange-500 text-orange-700 text-sm font-semibold hover:bg-orange-50"
                    >
                      <FaMapMarkerAlt /> Get directions
                    </a>
                  </div>
                </>
              )}

              {modalTab === 'map' && (
                <div className="bg-white rounded-xl border-2 border-orange-200 overflow-hidden shadow-lg">
                  <iframe
                    title={`Map of ${selected.name}`}
                    src={getMapEmbedUrl(selected.fullAddress)}
                    className="w-full h-[50vh] sm:h-[400px] border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                  <p className="text-xs text-gray-500 p-3 border-t border-gray-100">
                    Interactive map for {selected.fullAddress}.
                    {!GOOGLE_MAPS_API_KEY && ' Using map search embed (no API key required).'}
                  </p>
                </div>
              )}

              {modalTab === 'illustration' && (
                <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-orange-200">
                  <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                    <FaImage className="text-orange-500" />
                    Official barangay map illustration (reference only)
                  </p>
                  <div className="flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden min-h-[240px]">
                    <img
                      src={selected.image}
                      alt={`${selected.name} illustration`}
                      className="w-full h-auto object-contain max-h-[50vh]"
                      onError={(e) => { e.target.onerror = null; e.target.src = logo; }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-orange-200 bg-white p-4 flex-shrink-0">
              <button
                type="button"
                onClick={closeModal}
                className="w-full sm:w-auto sm:ml-auto sm:flex bg-gradient-to-r from-orange-500 to-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
