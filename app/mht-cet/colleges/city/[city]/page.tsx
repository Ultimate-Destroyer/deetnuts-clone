'use client'

import { useState, useEffect, useMemo, use } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { formatInstituteName } from '@/lib/formatInstituteName';
import { Montserrat } from "next/font/google"
import fuzzysort from 'fuzzysort'

const lato = Montserrat({
  subsets: ["latin"],
  weight: ['400', '700', '900'],
})

interface CollegeRecord {
  ID: number;
  College: string | null;
  City: string | null;
}

export default function CityColleges(props: { params: Promise<{ city: string }> }) {
  const params = use(props.params);
  const [colleges, setColleges] = useState<CollegeRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchColleges() {
      try {
        const decodedCity = decodeURIComponent(params.city);
        const { data, error } = await supabase
          .from('colleges_within_mhtcet_pcm')
          .select('*')
          .eq('City', decodedCity)
          .order('College')
          .returns<CollegeRecord[]>();

        if (error) throw error;
        setColleges(data || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching colleges:', err);
        setError('Error loading colleges. Please try again later.');
        setLoading(false);
      }
    }

    fetchColleges();
  }, [params.city]);

  const filteredColleges = useMemo(() => {
    if (!searchQuery) return colleges;
    const results = fuzzysort.go(searchQuery, colleges, {
      key: 'College',
      threshold: -10000, // Don't return bad results
      limit: 5 // Don't return too many results
    });
    return results.map(result => result.obj);
  }, [searchQuery, colleges]);

  const decodedCity = decodeURIComponent(params.city);

  return (
    <div className={`${lato.className}`}>
      <main className='px-3 py-4 md:p-8 lg:p-12 xl:p-20 text-center mt-20'>
        <section className='pt-8 md:pt-12 lg:pt-16 pb-12 lg:pb-20 relative'>
          {/* Decorative elements - updated with subtle colors */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
            <div className="absolute top-4 md:top-12 left-2 md:left-8 
              w-12 h-12 md:w-20 md:h-20 lg:w-24 lg:h-24 
              bg-pink-300 border-2 md:border-4 border-black transform -rotate-12 
              animate-[float_6s_ease-in-out_infinite]"></div>
            <div className="absolute bottom-4 md:bottom-12 right-2 md:right-8 
              w-16 h-16 md:w-24 md:h-24 lg:w-32 lg:h-32 
              bg-cyan-300 rounded-full border-2 md:border-4 border-black
              animate-[float_8s_ease-in-out_infinite]"></div>
          </div>

          {/* City Title - updated with subtle colors */}
          <div className="relative z-10">
            <h1 className='text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-center'>
              <span className="relative inline-block px-2 xs:px-3 md:px-4 lg:px-6 py-1 md:py-2 lg:py-3
                before:content-[''] before:absolute before:inset-0 
                before:bg-cyan-300 before:border-2 md:before:border-4 
                before:border-black before:rotate-1 before:-z-10">
                {decodedCity}
              </span>
            </h1>

            {/* Engineering Title - updated with subtle colors */}
            <div className="mt-8 md:mt-12 lg:mt-16 flex justify-center items-center gap-4 md:gap-6 lg:gap-8">
              <div className="w-12 md:w-16 lg:w-24 h-1 md:h-2 bg-black rotate-[-12deg]"></div>
              <span className="relative inline-block px-3 md:px-4 lg:px-6 py-2 md:py-3
                text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black
                before:content-[''] before:absolute before:inset-0 
                before:bg-pink-300 before:border-2 md:before:border-4 
                before:border-black before:skew-x-6 before:-z-10
                after:content-[''] after:absolute after:inset-0 
                after:border-2 md:after:border-4 after:border-black 
                after:translate-x-1 after:translate-y-1 after:-z-20
                hover:scale-105 transition-transform">
                ENGINEERING
              </span>
              <div className="w-12 md:w-16 lg:w-24 h-1 md:h-2 bg-black rotate-[12deg]"></div>
            </div>
          </div>
        </section>

        {/* Enhanced Search Input */}
        <div className="max-w-4xl mx-auto mb-8 md:mb-12 px-4 md:px-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search colleges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-4 md:p-6 border-4 md:border-8 border-black 
                shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
                focus:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]
                transition-all duration-300 bg-white text-lg md:text-xl
                focus:outline-none transform -rotate-1 hover:rotate-0"
            />
          </div>
        </div>

        {/* Results Section */}
        {loading ? (
          <div className="text-center p-6 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-xl md:text-2xl font-bold animate-pulse">Loading colleges...</p>
          </div>
        ) : error ? (
          <div className="text-center p-6 bg-pink-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-xl md:text-2xl font-bold text-black">{error}</p>
          </div>
        ) : filteredColleges.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 md:gap-4 lg:gap-6 max-w-4xl mx-auto px-3 md:px-6">
            {filteredColleges.map((institute: CollegeRecord, index: number) => (
              <Link 
                href={`/mht-cet/colleges/${institute.ID}/${institute.College ? formatInstituteName(institute.College) : 'unknown'}`}
                key={institute.ID}
                className={`p-3 md:p-4 lg:p-6 border-2 md:border-4 border-black 
                  shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                  hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
                  transition-all hover:-translate-x-[1px] hover:-translate-y-[1px]
                  md:hover:-translate-x-[2px] md:hover:-translate-y-[2px]
                  text-left transform 
                  ${index % 2 ? 'rotate-1' : '-rotate-1'}
                  ${index % 4 === 0 ? 'bg-yellow-300' : 
                    index % 4 === 1 ? 'bg-pink-300' : 
                    index % 4 === 2 ? 'bg-cyan-300' : 
                    'bg-green-300'}`}
              >
                <h2 className="text-sm xs:text-base md:text-lg lg:text-xl font-bold break-words">{institute.College || 'Unknown College'}</h2>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center border-4 md:border-8 border-black p-6 md:p-8 lg:p-10 
            inline-block bg-white mx-4
            shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-xl md:text-2xl lg:text-3xl font-black">
              {searchQuery ? 'No colleges found matching your search' : 'No colleges found in this city'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
