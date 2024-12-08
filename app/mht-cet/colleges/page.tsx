import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Montserrat } from "next/font/google"

const lato = Montserrat({
  subsets: ["latin"],
  weight: ['400', '700', '900'],
})

const InstitutesList = async () => {
  try {
    const { data, error } = await supabase
      .from('colleges_within_mhtcet_pcm')
      .select('City')
      .order('City');

    if (error) throw error;

    // Create a frequency map of cities
    const cityFrequencyMap = data.reduce((acc: { [key: string]: number }, item) => {
      if (item.City) {
        acc[item.City] = (acc[item.City] || 0) + 1;
      } 
      return acc;
    }, {});

    // Convert to array and sort by frequency
    const citiesWithFrequency = Object.entries(cityFrequencyMap)
      .map(([city, count]) => ({ City: city, count }))
      .sort((a, b) => b.count - a.count);

    // Get top 4 cities
    const topCities = citiesWithFrequency.slice(0, 8);
    // Get remaining cities
    const remainingCities = citiesWithFrequency.slice(8);

    return (
      <div className={`${lato.className}`}>
        <main className='px-3 py-4 sm:p-8 lg:p-16 text-center mt-16 sm:mt-20 lg:mt-24'>
          <section className='pt-12 sm:pt-20 lg:pt-24 pb-12 sm:pb-24 lg:pb-32'>
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
              {/* Scaled decorative elements */}
              <div className="absolute top-2 sm:top-8 left-2 sm:left-8 w-8 h-8 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-yellow-300 rounded-full border-2 sm:border-4 border-black"></div>
              <div className="absolute bottom-2 sm:bottom-8 right-2 sm:right-8 w-12 h-12 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-blue-300 border-2 sm:border-4 border-black transform rotate-45"></div>
            </div>
            <div className="relative z-10">
              <h1 className='text-3xl sm:text-5xl lg:text-8xl font-black text-center relative'>
                <span className="relative inline-block px-2 sm:px-4 py-1 sm:py-2 before:content-[''] before:absolute before:inset-0 before:bg-pink-300 before:border-2 sm:before:border-4 before:border-black before:-rotate-2 before:-z-10">
                  Maharashtra
                </span>
                <br className="sm:hidden"/>
                <span className="relative inline-block px-2 sm:px-4 py-1 sm:py-2 mt-2 before:content-[''] before:absolute before:inset-0 before:bg-cyan-300 before:border-2 sm:before:border-4 before:border-black before:rotate-1 before:-z-10">
                  Cities
                </span>
              </h1>
              <div className="mt-6 sm:mt-10 lg:mt-16 relative">
                {/* Decorative crossed lines */}
                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 
                  w-[140%] h-1 sm:h-2 bg-black rotate-[-8deg] -z-10"></div>
                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 
                  w-[140%] h-1 sm:h-2 bg-black rotate-[8deg] -z-10"></div>
                <span className="relative inline-block px-3 sm:px-6 py-2 sm:py-3 
                  text-xl sm:text-3xl lg:text-5xl font-black
                  before:content-[''] before:absolute before:inset-0 
                  before:bg-yellow-300 before:border-2 sm:before:border-4 
                  before:border-black before:skew-x-6 before:-z-10
                  after:content-[''] after:absolute after:inset-0 
                  after:border-2 sm:after:border-4 after:border-black 
                  after:translate-x-1 after:translate-y-1 sm:after:translate-x-2 sm:after:translate-y-2 after:-z-20">
                  ENGINEERING
                </span>
              </div>
            </div>
          </section>
          
          {citiesWithFrequency.length > 0 ? (
            <>
              <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 max-w-7xl mx-auto mb-6 sm:mb-12">
                {topCities.map((item, index) => (
                  <Link 
                    href={`/mht-cet/colleges/city/${encodeURIComponent(item.City)}`} 
                    key={item.City}
                    className={`p-3 sm:p-6 border-2 sm:border-4 border-black 
                      shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
                      hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
                      transition-all hover:-translate-x-[1px] sm:hover:-translate-x-[2px]
                      hover:-translate-y-[1px] sm:hover:-translate-y-[2px]
                      transform rotate-${index % 2 ? '1' : '-1'}
                      ${['bg-yellow-300', 'bg-pink-300', 'bg-cyan-300', 'bg-green-300', 'bg-purple-300', 'bg-orange-300', 'bg-red-300', 'bg-blue-300'][index]}`}
                  >
                    <h2 className="text-base sm:text-xl lg:text-2xl font-black">{item.City}</h2>
                    <p className="mt-1 sm:mt-2 font-bold text-xs sm:text-sm">{item.count} colleges</p>
                  </Link>
                ))}
              </div>

              <div className="max-w-7xl mx-auto my-6 sm:my-10">
                <div className="relative">
                  <hr className="border-t-2 sm:border-t-4 lg:border-t-8 border-black" />
                  <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 px-2 sm:px-4">
                    <span className="text-lg sm:text-xl lg:text-2xl font-bold relative inline-block
                      before:content-[''] before:absolute before:inset-0 
                      before:bg-purple-200 before:border-2 before:border-black 
                      before:-skew-x-6 before:-z-10 px-3 sm:px-4 py-1">
                      More Cities
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 max-w-7xl mx-auto">
                {remainingCities.map((item, index) => (
                  <Link 
                    href={`/mht-cet/colleges/city/${encodeURIComponent(item.City)}`} 
                    key={item.City}
                    className={`group relative p-4 sm:p-6 border-2 sm:border-4 border-black
                      ${[
                        'bg-gradient-to-br from-blue-200 to-blue-100',
                        'bg-gradient-to-br from-green-200 to-green-100',
                        'bg-gradient-to-br from-yellow-200 to-yellow-100'
                      ][index % 3]}
                      shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] 
                      hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                      transition-all duration-200
                      hover:-translate-x-[1px] hover:-translate-y-[1px]
                      overflow-hidden
                      ${index % 2 ? 'rotate-[1deg]' : '-rotate-[1deg]'}
                    `}
                  >
                    {/* Decorative background patterns */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 left-0 w-full h-full grid grid-cols-4 gap-4">
                        {[...Array(16)].map((_, i) => (
                          <div key={i} className="border-2 border-black rotate-45"></div>
                        ))}
                      </div>
                    </div>

                    <div className="relative">
                      <h2 className="text-base sm:text-xl lg:text-2xl font-black mb-3">{item.City}</h2>
                      <div className="flex items-center justify-between">
                        <div className="relative">
                          <span className="relative z-10 text-sm sm:text-base font-bold 
                            before:content-[''] before:absolute before:-inset-1 
                            before:bg-white before:border-2 before:border-black 
                            before:-skew-y-1 before:-z-10 px-2 py-1"
                          >
                            {item.count} colleges
                          </span>
                        </div>
                        <div className="relative">
                          <span className="flex w-8 h-8 sm:w-10 sm:h-10 bg-black text-white
                            border-2 border-black group-hover:translate-x-1
                            transition-transform duration-200 rotate-3
                            items-center justify-center text-lg sm:text-xl"
                          >
                            →
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Corner accent */}
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-black transform rotate-45"></div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-600">No cities found</div>
          )}
        </main>
      </div>
    );
  } catch (error) {
    console.error('Error fetching cities:', error);
    return <div>Error loading cities. Please try again later.</div>;
  }
};

export default InstitutesList;
