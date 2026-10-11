import React from 'react';
import {
  Plane,
  CheckCircle2,
  Luggage,
  ShieldAlert,
  ArrowRight,
  LogOut,
  MessageSquare,
  Phone,
  Sparkles
} from 'lucide-react';
import VisaGuyLogo from './VisaGuyLogo';
import { MOCK_VISA_JOURNEY } from '../data/mockVisaData';

export default function VisaDashboard({
  user,
  onOpenPackingStudio,
  onSignOut,
  packingItemCount = 0,
  isPacked = false
}) {
  const journey = MOCK_VISA_JOURNEY;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-amber-500 selection:text-white pb-24 relative overflow-x-hidden">
      {/* Background Decorative Gold Accents matching visaguy.ae */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-amber-200/35 via-amber-100/15 to-transparent rounded-full blur-3xl pointer-events-none -mr-32 -mt-32" />
      <div className="absolute top-96 left-0 w-96 h-96 bg-gradient-to-tr from-amber-300/20 via-amber-100/10 to-transparent rounded-full blur-3xl pointer-events-none -ml-32" />

      {/* Top Header Bar */}
      <header className="w-full bg-white/85 backdrop-blur-md border-b border-slate-200/70 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <VisaGuyLogo size="md" />

        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* User Profile Pill */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{user?.name || journey.traveler.name}</span>
          </div>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={onSignOut}
            title="Sign out of Visa Guy Portal"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-xs font-medium text-slate-600 hover:text-rose-600 transition-all cursor-pointer shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 z-10">
        {/* Trust Badges matching visaguy.ae */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3.5 py-1 rounded-full bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-xs">
            80k+ Visas Processed
          </span>
          <span className="px-3.5 py-1 rounded-full bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-xs">
            75+ Countries
          </span>
          <span className="px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 shadow-xs flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Visa Sanctioned (Demo)</span>
          </span>
        </div>

        {/* Personalized Welcome Headline */}
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Welcome, <span className="text-slate-900">{journey.traveler.name}</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1 font-medium">
            Your UK travel visa has been <span className="font-serif italic text-emerald-700 font-semibold">sanctioned</span>. Your journey is ready for preparation.
          </p>
        </div>

        {/* 1. Hero Journey Card (Screen B) */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-200/40 relative overflow-hidden">
          {/* Top Gold Ribbon Accent */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500" />

          {/* Card Meta: Application Ref & Status Badge */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Application:
              </span>
              <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                {journey.applicationId}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-800 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>SANCTIONED (DEMO)</span>
              </span>
            </div>
          </div>

          {/* Route Directional Graphic (Dubai -> London) */}
          <div className="py-6 sm:py-8 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-100">
            {/* Origin (Dubai, UAE) */}
            <div className="flex items-center space-x-3.5 text-left w-full md:w-auto">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl shadow-sm shrink-0">
                {journey.journey.departureFlag}
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono block">
                  {journey.journey.departureAirportCode}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-700 block">
                  {journey.journey.departureCity}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {journey.journey.departureCountry}
                </span>
              </div>
            </div>

            {/* Flight Path Directional Visual */}
            <div className="flex-1 flex flex-col items-center px-4 w-full md:w-auto">
              <div className="flex items-center space-x-2 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-3 py-1 rounded-full shadow-xs mb-2">
                <Plane className="w-3.5 h-3.5 text-amber-600" />
                <span>Flight {journey.journey.flightNumber} • {journey.journey.flightDate}</span>
              </div>
              <div className="w-full flex items-center relative">
                <div className="h-0.5 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 border-dashed" />
                <div className="absolute left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center shadow-md">
                  <Plane className="w-3.5 h-3.5 transform rotate-45" />
                </div>
              </div>
              <span className="text-[10px] text-slate-500 mt-2 font-medium">
                Direct Scheduled Flight • Approx 7h 45m
              </span>
            </div>

            {/* Destination (London, UK) */}
            <div className="flex items-center space-x-3.5 text-left md:text-right w-full md:w-auto justify-start md:justify-end">
              <div className="order-2 md:order-1">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono block">
                  {journey.journey.destinationAirportCode}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-700 block">
                  {journey.journey.destinationCity}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {journey.journey.destinationCountry}
                </span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-2xl shadow-sm shrink-0 order-1 md:order-2">
                {journey.journey.destinationFlag}
              </div>
            </div>
          </div>

          {/* Visa Details Grid */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 block uppercase">Visa Type</span>
              <span className="font-semibold text-slate-900 mt-0.5 block truncate">
                UK Standard Visitor
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 block uppercase">Valid From</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">
                {journey.visa.validFrom}
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 block uppercase">Valid Until</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">
                {journey.visa.validUntil}
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 block uppercase">Authority</span>
              <span className="font-semibold text-slate-900 mt-0.5 block truncate">
                UK Visas & Immigr.
              </span>
            </div>
          </div>

          {/* Visa Expert Live Chat Card matching visaguy.ae */}
          <div className="mt-4 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative w-9 h-9 rounded-full bg-slate-900 border border-amber-400 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                TA
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block leading-tight">
                  Chat with Visa Expert ({journey.expert.name})
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center space-x-1">
                  <span>●</span>
                  <span>Available now for flight departure assistance</span>
                </span>
              </div>
            </div>

            <a
              href="https://wa.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-slate-800 hover:text-emerald-700 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 px-3 py-1.5 rounded-full transition-all flex items-center space-x-1 shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden xs:inline">WhatsApp</span>
            </a>
          </div>
        </div>

        {/* 2. Prominent Suitcase-Packing Section (Screen C) */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-white border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle 3D Suitcase Glow Backdrop */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl text-left">
              {/* Badge */}
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Integrated Layover 3D Luggage Studio</span>
              </div>

              {/* Main Heading */}
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Ready to pack for London?
              </h2>

              {/* Supporting Text */}
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Check your essentials, scan your belongings with our AI camera detector, and review verified UK & UAE travel restrictions before your journey.
              </p>

              {/* Status pills about current suitcase list */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <div className="px-3 py-1 rounded-xl bg-white/10 border border-white/10 text-slate-200 font-medium flex items-center space-x-1.5">
                  <Luggage className="w-3.5 h-3.5 text-blue-400" />
                  <span>
                    {packingItemCount > 0
                      ? `${packingItemCount} item${packingItemCount > 1 ? 's' : ''} in suitcase`
                      : 'Suitcase is currently empty'}
                  </span>
                </div>

                {isPacked && (
                  <div className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-semibold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>3D Packing Solved</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action CTA Box with Suitcase Preview */}
            <div className="w-full md:w-auto shrink-0 flex flex-col items-center sm:items-end">
              <button
                type="button"
                onClick={onOpenPackingStudio}
                className="w-full sm:w-auto px-7 py-4 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm sm:text-base shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-[0.98] transition-all flex items-center justify-center space-x-2.5 cursor-pointer"
              >
                <Luggage className="w-5 h-5 text-slate-950" />
                <span>Pack My Suitcase</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <span className="text-[11px] text-slate-400 mt-2 text-center sm:text-right">
                Launches interactive 3D packing & AI item scanner
              </span>
            </div>
          </div>
        </div>

        {/* 3. Route Travel Policy & Customs Overview (Screen D connection) */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">
                UK & UAE Travel Policy Summary (Dubai ➔ London)
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Verified Aviation Rules
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3.5 text-xs">
            {/* Rule 1: Liquids */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Cabin Liquids (100ml)</span>
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded">
                  Restricted
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-tight">
                Containers must be 100ml or under inside 1 transparent resealable 1L bag (UK CAA / ICAO).
              </p>
            </div>

            {/* Rule 2: Lithium Batteries */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Laptops & Power Banks</span>
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded">
                  Cabin Only
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-tight">
                Spare lithium batteries strictly prohibited in checked luggage. Keep in carry-on.
              </p>
            </div>

            {/* Rule 3: Food / Biosecurity */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Food & Snacks</span>
                <span className="text-[10px] font-semibold text-rose-700 bg-rose-100/70 px-1.5 py-0.5 rounded">
                  Biosecurity
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-tight">
                Meat & dairy prohibited from non-EU countries. Packaged commercial snacks allowed (DEFRA).
              </p>
            </div>

            {/* Rule 4: Cash */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Cash / Currency</span>
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded">
                  £10,000 Limit
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-tight">
                Declare amounts exceeding £10,000 (or equivalent foreign currency) to UK Border Force.
              </p>
            </div>
          </div>
        </div>

        {/* 4. Assisted Countries Pill Row matching visaguy.ae */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-900">
              Assisted Countries & Destinations
            </span>
            <span className="text-[11px] text-slate-500 font-medium">75+ Global Hubs</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {journey.assistedCountries.map((country) => (
              <span
                key={country}
                className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  country === 'United Kingdom'
                    ? 'bg-amber-100/80 text-amber-900 border-amber-300 font-bold'
                    : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
                }`}
              >
                {country}
              </span>
            ))}
          </div>
        </div>
      </main>

      {/* Sticky Bottom Consultation Bar matching visaguy.ae */}
      <footer className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-3 z-30 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <a
            href="tel:+971501234567"
            title="Call The Visa Guy Office"
            className="w-11 h-11 rounded-full bg-white border-2 border-amber-400 flex items-center justify-center text-slate-800 shadow-md hover:bg-amber-50 transition-colors shrink-0"
          >
            <Phone className="w-4 h-4 text-slate-900" />
          </a>

          <button
            type="button"
            onClick={onOpenPackingStudio}
            className="flex-1 p-0.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 shadow-md cursor-pointer"
          >
            <div className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-full bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold transition-all">
              <Luggage className="w-4 h-4 text-amber-400" />
              <span>Pack Suitcase for London</span>
            </div>
          </button>
        </div>
      </footer>
    </div>
  );
}
