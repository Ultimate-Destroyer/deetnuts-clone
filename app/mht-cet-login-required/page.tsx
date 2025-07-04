import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function MHTCETLoginRequired({ searchParams }: {
    searchParams: Promise<{ redirect?: string }>
}) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-32">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="space-y-4">
                    <Image
                        src="/MHT-CET_logo.png"
                        alt="MHT-CET Logo"
                        width={120}
                        height={120}
                        className="mx-auto rounded-lg"
                    />
                    <h1 className="text-3xl font-bold text-gray-900">
                        MHT-CET Resources
                    </h1>
                    <p className="text-lg text-gray-600">
                        Access exclusive MHT-CET cutoffs
                    </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-blue-900 mb-2">
                        Login Required
                    </h2>
                    <p className="text-blue-700 mb-4">
                        Please sign in to access MHT-CET resources that includs state cutoffs
                    </p>

                    <div className="space-y-3">
                        <Link
                            href={`/login?redirect=${encodeURIComponent('/mht-cet')}`}
                            className="block w-full"
                        >
                            <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                Sign In
                            </Button>
                        </Link>

                        <Link
                            href="/signup"
                            className="block w-full"
                        >
                            <Button variant="neutral" className="w-full">
                                Create Account
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="text-sm text-gray-500">
                    <Link href="/" className="hover:underline">
                        ← Back to Homepage
                    </Link>
                </div>

            </div>
            <div className="mt-20 overflow-hidden flex justify-center">
                <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none">
                    <Image
                        src="https://res.cloudinary.com/dfyrk32ua/image/upload/v1751627283/gdgc/clipboard-image-1751627216_j5fqdd.webp"
                        alt="Page Screenshot"
                        width="1432"
                        height="442"
                        className="w-3xl max-w-none rounded-xl shadow-xl ring-1 ring-white/10 sm:w-228 md:-ml-4 lg:-ml-0"
                        priority
                    />
                </div>
            </div>
        </div >
    );
}
