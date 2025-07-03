'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getPocketBaseClient } from '@/lib/pocketbaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Filter, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    SortingState,
    ColumnFiltersState,
    VisibilityState,
} from '@tanstack/react-table';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { BookUser, Building, GraduationCap, Info, Lightbulb, MapPin, ShieldCheck, Users, Video } from 'lucide-react';

// Types
interface CutoffRecord {
    id: string;
    college_code: string;
    college_name: string;
    course_code: string;
    course_name: string;
    category: string;
    seat_allocation_section: string;
    cutoff_score: string;
    last_rank: string;
    total_admitted: number;
    created: string;
    updated: string;
}

interface FilterState {
    search: string;
    categories: string[];
    seatAllocations: string[];
    courses: string[];
    percentileInput: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}

interface PendingFilters {
    search: string;
    categories: string[];
    seatAllocations: string[];
    courses: string[];
    percentileInput: string;
}

// Improved category definitions - more human-usable groupings
const CATEGORY_GROUPS = {
    'Open Category (General)': [
        'GOPENS', 'GOPENH', 'GOPENO', 'LOPENS', 'LOPENH', 'LOPENO'
    ],
    'OBC (Other Backward Classes)': [
        'GOBCS', 'GOBCH', 'GOBCO', 'LOBCS', 'LOBCH', 'LOBCO'
    ],
    'SC/ST (Scheduled Castes/Tribes)': [
        'GSCS', 'GSCH', 'GSCO', 'GSTS', 'GSTH', 'GSTO',
        'LSCS', 'LSCH', 'LSCO', 'LSTS', 'LSTH', 'LSTO'
    ],
    'SEBC (Socially and Educationally Backward Classes)': [
        'GSEBCS', 'GSEBCH', 'GSEBCO', 'LSEBCS', 'LSEBCH', 'LSEBCO'
    ],
    'VJ/DT (Vimukta Jati/Denotified Tribes)': [
        'GVJS', 'GVJH', 'GVJO', 'LVJS', 'LVJH', 'LVJO'
    ],
    'Defence Personnel': [
        'DEFOPENS', 'DEFOBCS', 'DEFSCS', 'DEFSTS', 'DEFSEBCS',
        'DEFRVJS', 'DEFROBCS', 'DEFRSCS', 'DEFRSEBCS', 'DEFRSTS'
    ],
    'Persons with Disabilities (PWD)': [
        'PWDOPENS', 'PWDOPENH', 'PWDOBCS', 'PWDOBCH', 'PWDSCS', 'PWDSCH',
        'PWDRSTS', 'PWDRSTH', 'PWDRSCS', 'PWDRSCH', 'PWDRSEBCS', 'PWDRSEBCH',
        'PWDRVJS', 'PWDROBCS', 'PWDROBCH'
    ],
    'Economically Weaker Sections (EWS)': [
        'EWS'
    ],
    'Special Categories': [
        'ORPHAN', 'TFWS', 'MI'
    ],
    'NRI/Foreign Nationals': [
        'GNT1H', 'GNT1O', 'GNT1S', 'GNT2H', 'GNT2O', 'GNT2S',
        'GNT3H', 'GNT3O', 'GNT3S', 'LNT1H', 'LNT1O', 'LNT1S',
        'LNT2H', 'LNT2O', 'LNT2S', 'LNT3H', 'LNT3O', 'LNT3S'
    ]
};

// Course definitions grouped logically
const COURSE_GROUPS = {
    'Computer Science & IT': [
        'Computer Engineering',
        'Computer Science',
        'Computer Science and Engineering',
        'Computer Science and Business Systems',
        'Computer Science and Design',
        'Computer Science and Information Technology',
        'Computer Science and Technology',
        'Computer Technology',
        'Information Technology',
        'Electronics and Computer Engineering',
        'Electronics and Computer Science',
        'Computer Engineering (Software Engineering)'
    ],
    'AI & Data Science': [
        'Artificial Intelligence',
        'Artificial Intelligence (AI) and Data Science',
        'Artificial Intelligence and Data Science',
        'Artificial Intelligence and Machine Learning',
        'Computer Science and Engineering (Artificial Intelligence)',
        'Computer Science and Engineering (Artificial Intelligence and Data Science)',
        'Computer Science and Engineering(Artificial Intelligence and Machine Learning)',
        'Computer Science and Engineering(Data Science)',
        'Data Engineering',
        'Data Science',
        'Robotics and Artificial Intelligence'
    ],
    'Cybersecurity & IoT': [
        'Cyber Security',
        'Computer Science and Engineering (Cyber Security)',
        'Computer Science and Engineering (Internet of Things and Cyber Security Including Block Chain Technology)',
        'Computer Science and Engineering (IoT)',
        'Computer Science and Engineering(Cyber Security)',
        'Internet of Things (IoT)',
        'Industrial IoT'
    ],
    'Electronics & Communication': [
        'Electronics Engineering',
        'Electronics Engineering ( VLSI Design and Technology)',
        'Electronics and Biomedical Engineering',
        'Electronics and Communication Engineering',
        'Electronics and Communication (Advanced Communication Technology)',
        'Electronics and Communication(Advanced Communication Technology)',
        'Electronics and Telecommunication Engg',
        'VLSI'
    ],
    'Electrical Engineering': [
        'Electrical Engineering',
        'Electrical Engg[Electronics and Power]',
        'Electrical and Computer Engineering',
        'Electrical and Electronics Engineering',
        'Electrical, Electronics and Power'
    ],
    'Mechanical Engineering': [
        'Mechanical Engineering',
        'Mechanical Engineering Automobile',
        'Mechanical Engineering[Sandwich]',
        'Mechanical & Automation Engineering',
        'Mechanical and Mechatronics Engineering (Additive Manufacturing)',
        'Production Engineering',
        'Production Engineering[Sandwich]',
        'Manufacturing Science and Engineering'
    ],
    'Civil & Environmental': [
        'Civil Engineering',
        'Civil Engineering and Planning',
        'Civil and Environmental Engineering',
        'Civil and infrastructure Engineering',
        'Structural Engineering'
    ],
    'Chemical & Process': [
        'Chemical Engineering',
        'Petro Chemical Engineering',
        'Oil Technology',
        'Oil Fats and Waxes Technology',
        'Oil and Paints Technology',
        'Oil,Oleochemicals and Surfactants Technology',
        'Pharmaceutical and Fine Chemical Technology',
        'Pharmaceuticals Chemistry and Technology'
    ],
    'Biotechnology & Food': [
        'Bio Technology',
        'Bio Medical Engineering',
        'Food Engineering and Technology',
        'Food Technology',
        'Food Technology And Management'
    ],
    'Textile & Materials': [
        'Textile Engineering / Technology',
        'Textile Technology',
        'Textile Chemistry',
        'Technical Textiles',
        'Fibres and Textile Processing Technology',
        'Man Made Textile Technology',
        'Fashion Technology',
        'Plastic Technology',
        'Plastic and Polymer Engineering',
        'Polymer Engineering and Technology',
        'Metallurgy and Material Technology'
    ],
    'Automation & Robotics': [
        'Automation and Robotics',
        'Mechatronics Engineering',
        'Robotics and Automation',
        'Instrumentation Engineering',
        'Instrumentation and Control Engineering'
    ],
    'Specialized Engineering': [
        'Aeronautical Engineering',
        'Agricultural Engineering',
        'Automobile Engineering',
        'Mining Engineering',
        'Fire Engineering',
        'Safety and Fire Engineering',
        'Dyestuff Technology',
        'Paints Technology',
        'Surface Coating Technology',
        'Paper and Pulp Technology',
        'Printing and Packing Technology',
        'Architectural Assistantship'
    ],
    'Emerging Technologies': [
        '5G',
    ]
};

const SEAT_ALLOCATION_OPTIONS = [
    { value: 'OTHER_TO_OTHER', label: 'Other to Other University' },
    { value: 'HOME_TO_OTHER', label: 'Home to Other University' },
    { value: 'HOME_TO_HOME', label: 'Home to Home University' },
    { value: 'STATE_LEVEL', label: 'State Level Seats' }
];

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 200];

// Helper function to calculate percentile from rank (approximate)
const calculatePercentile = (rank: string | number): number => {
    const numRank = typeof rank === 'string' ? parseInt(rank) : rank;
    if (isNaN(numRank)) return 0;

    // Approximate calculation: assuming ~150,000 total candidates
    // This is a rough estimate and should be adjusted based on actual data
    const totalCandidates = 150000;
    const percentile = Math.max(0, Math.min(100, ((totalCandidates - numRank) / totalCandidates) * 100));
    return Math.round(percentile * 100) / 100; // Round to 2 decimal places
};

// Helper function to handle precise decimal arithmetic for percentile range
const getPrecisePercentileRange = (targetPercentile: number): { min: number; max: number } => {
    // Use higher precision (10 decimal places) to avoid floating-point errors
    const max = Math.round(targetPercentile * 10000000000) / 10000000000;
    const min = Math.max(0, Math.round((targetPercentile - 1) * 10000000000) / 10000000000);
    return { min, max };
};

// Debounce hook for performance optimization
const useDebounce = (value: any, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

export default function StateCutoffsPage() {
    const [records, setRecords] = useState<CutoffRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalItems, setTotalItems] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isRequestActive, setIsRequestActive] = useState(false);

    // Applied filters (what's actually being used for search)
    const [filters, setFilters] = useState<FilterState>({
        search: '',
        categories: [],
        seatAllocations: [],
        courses: [],
        percentileInput: '',
        sortBy: 'last_rank',
        sortOrder: 'desc'
    });

    // Pending filters (what user is currently selecting)
    const [pendingFilters, setPendingFilters] = useState<PendingFilters>({
        search: '',
        categories: [],
        seatAllocations: [],
        courses: [],
        percentileInput: ''
    });

    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Performance optimizations
    const abortControllerRef = useRef<AbortController | null>(null);
    const cacheRef = useRef<Map<string, any>>(new Map());
    const debouncedFilters = useDebounce(filters, 300); // 300ms debounce
    const paginationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const currentRequestParamsRef = useRef<string>('');
    const requestIdRef = useRef<number>(0);
    const lastPaginationClickRef = useRef<number>(0);

    // Table state
    const [sorting, setSorting] = useState<SortingState>([{ id: 'cutoff_score', desc: true }])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [isSearching, setIsSearching] = useState(false)

    // Memoize expensive data transformations
    const memoizedRecords = useMemo(() => records, [records]);
    const memoizedTotalItems = useMemo(() => totalItems, [totalItems]);

    // Define columns for the enhanced table with Abel font and swapped score/percentile
    const columns: ColumnDef<CutoffRecord>[] = useMemo(
        () => [
            {
                accessorKey: "college_name",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="link"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="h-8 px-2 lg:px-3 font-abel"
                        >
                            College Name
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    )
                },
                cell: ({ row }) => (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="font-abel font-medium max-w-[250px] truncate cursor-help text-sm">
                                    {row.getValue("college_name")}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-sm font-abel">{row.getValue("college_name")}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ),
                size: 250,
            },
            {
                accessorKey: "course_name",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="link"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="h-8 px-2 lg:px-3 font-abel"
                        >
                            Course Name
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    )
                },
                cell: ({ row }) => (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="font-abel font-medium max-w-[200px] truncate cursor-help text-sm">
                                    {row.getValue("course_name")}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-sm font-abel">{row.getValue("course_name")}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ),
                size: 200,
            },
            {
                accessorKey: "category",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="link"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="h-8 px-2 lg:px-3 font-abel"
                        >
                            Category
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    )
                },
                cell: ({ row }) => (
                    <Badge variant="neutral" className="font-abel text-xs w-fit font-medium">
                        {row.getValue("category")}
                    </Badge>
                ),
                size: 100,
            },
            {
                accessorKey: "last_rank",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="link"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="h-8 px-2 lg:px-3 font-abel"
                        >
                            Rank
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    )
                },
                cell: ({ row }) => {
                    const rank = row.getValue("last_rank") as string;
                    const numRank = parseInt(rank);
                    return (
                        <div className="text-right font-abel font-medium w-[80px] text-sm">
                            {isNaN(numRank) ? rank : numRank.toLocaleString()}
                        </div>
                    );
                },
                size: 80,
            },
            {
                accessorKey: "cutoff_score",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="link"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="h-8 px-2 lg:px-3 font-abel"
                        >
                            Percentile
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    )
                },
                cell: ({ row }) => (
                    <div className="text-right font-abel font-medium w-[80px] text-sm">
                        {row.getValue("cutoff_score")}
                    </div>
                ),
                size: 80,
            },
            {
                accessorKey: "seat_allocation_section",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="link"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="h-8 px-2 lg:px-3 font-abel"
                        >
                            Seat Allocation
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    )
                },
                cell: ({ row }) => {
                    const value = row.getValue("seat_allocation_section") as string;
                    const option = SEAT_ALLOCATION_OPTIONS.find(s => s.value === value);
                    const label = option?.label || value;
                    return (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="font-abel text-xs max-w-[120px] truncate cursor-help font-medium">
                                        {label}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="font-abel">{label}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                },
                size: 120,
            },
            {
                accessorKey: "total_admitted",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="link"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="h-8 px-2 lg:px-3 font-abel"
                        >
                            Admitted
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    )
                },
                cell: ({ row }) => {
                    const value = row.getValue("total_admitted") as number;
                    return (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="text-right font-abel font-medium w-[80px] text-sm cursor-help">
                                        {value.toLocaleString()}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="font-abel">Total students admitted: {value}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                },
                size: 80,
            },
            {
                accessorKey: "college_code",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="link"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="h-8 px-2 lg:px-3 font-abel"
                        >
                            College Code
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    )
                },
                cell: ({ row }) => (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="font-abel text-xs w-[90px] font-medium cursor-help">
                                    {row.getValue("college_code")}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="font-abel">College Code: {row.getValue("college_code")}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ),
                size: 90,
            },
            {
                accessorKey: "course_code",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="link"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="h-8 px-2 lg:px-3 font-abel"
                        >
                            Course Code
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    )
                },
                cell: ({ row }) => (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="font-abel text-xs w-[90px] font-medium cursor-help">
                                    {row.getValue("course_code")}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="font-abel">Course Code: {row.getValue("course_code")}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ),
                size: 90,
            },
        ],
        []
    );

    // Create table instance
    const table = useReactTable({
        data: memoizedRecords,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        manualPagination: true,
        pageCount: Math.ceil(memoizedTotalItems / itemsPerPage),
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            pagination: {
                pageIndex: currentPage - 1,
                pageSize: itemsPerPage,
            },
        },
        onPaginationChange: (updaterOrValue) => {
            // Don't use the table's pagination handler, we'll handle it manually
            // This prevents conflicts with our custom pagination
        },
    });

    // Track changes to pending filters
    useEffect(() => {
        const filtersChanged = (
            pendingFilters.search !== filters.search ||
            JSON.stringify(pendingFilters.categories) !== JSON.stringify(filters.categories) ||
            JSON.stringify(pendingFilters.seatAllocations) !== JSON.stringify(filters.seatAllocations) ||
            JSON.stringify(pendingFilters.courses) !== JSON.stringify(filters.courses) ||
            pendingFilters.percentileInput !== filters.percentileInput
        );
        setHasUnsavedChanges(filtersChanged);
    }, [pendingFilters, filters]);

    useEffect(() => {
        table.setPageSize(itemsPerPage);
        // Reset to first page when items per page changes
        if (currentPage > 1) {
            setCurrentPage(1);
        }
    }, [itemsPerPage, table, currentPage]);

    // Ensure current page is valid when total items change
    useEffect(() => {
        if (memoizedTotalItems > 0) {
            const maxPages = Math.ceil(memoizedTotalItems / itemsPerPage);
            if (currentPage > maxPages) {
                setCurrentPage(Math.max(1, maxPages));
            }
        }
    }, [memoizedTotalItems, itemsPerPage, currentPage]);

    const fetchRecords = useCallback(async () => {
        // Don't fetch if no percentile is provided
        if (!debouncedFilters.percentileInput || debouncedFilters.percentileInput.trim() === '') {
            setRecords([]);
            setTotalItems(0);
            setLoading(false);
            setIsSearching(false);
            setIsRequestActive(false);
            return;
        }

        console.log('Fetching records for page:', currentPage, 'with filters:', debouncedFilters);

        // Only cancel previous request if it's for different filters (not just pagination)
        const params = new URLSearchParams({
            page: currentPage.toString(),
            perPage: itemsPerPage.toString(),
            search: debouncedFilters.search,
            categories: debouncedFilters.categories.join(','),
            seatAllocations: debouncedFilters.seatAllocations.join(','),
            courses: debouncedFilters.courses.join(','),
            percentileInput: debouncedFilters.percentileInput,
            sortBy: debouncedFilters.sortBy,
            sortOrder: debouncedFilters.sortOrder
        });

        const cacheKey = params.toString();

        // Check if this is the same request type (only different pagination)
        const currentRequestKey = `${debouncedFilters.search}-${debouncedFilters.categories.join(',')}-${debouncedFilters.seatAllocations.join(',')}-${debouncedFilters.courses.join(',')}-${debouncedFilters.percentileInput}`;
        const isOnlyPaginationChange = currentRequestParamsRef.current === currentRequestKey;

        // Check cache first
        if (cacheRef.current.has(cacheKey)) {
            const cachedResult = cacheRef.current.get(cacheKey);
            setRecords(cachedResult.data);
            setTotalItems(cachedResult.totalItems);
            setLoading(false);
            setIsSearching(false);
            setIsRequestActive(false);
            return;
        }

        // Only cancel previous request if filters changed (not just pagination)
        if (abortControllerRef.current && !isOnlyPaginationChange) {
            abortControllerRef.current.abort();
        }

        // Update current request params
        currentRequestParamsRef.current = currentRequestKey;

        // Generate unique request ID
        const requestId = ++requestIdRef.current;

        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();

        setIsRequestActive(true);
        setLoading(true);

        try {
            console.log(`Making API request ${requestId} with params:`, params.toString());

            const response = await fetch(`/api/mht-cet/state-cutoffs?${params}`, {
                signal: abortControllerRef.current.signal,
                headers: {
                    'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
                }
            });

            // Check if this is still the latest request
            if (requestId !== requestIdRef.current) {
                console.log(`Request ${requestId} is outdated, ignoring response`);
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // Double-check we're still the latest request
            if (requestId !== requestIdRef.current) {
                console.log(`Request ${requestId} is outdated after parsing, ignoring response`);
                return;
            }

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch data');
            }

            console.log(`Request ${requestId} completed successfully`);

            // Cache the result (limit cache size to prevent memory issues)
            if (cacheRef.current.size > 50) {
                const firstKey = cacheRef.current.keys().next().value;
                if (firstKey) {
                    cacheRef.current.delete(firstKey);
                }
            }
            cacheRef.current.set(cacheKey, {
                data: result.data,
                totalItems: result.totalItems
            });

            setRecords(result.data);
            setTotalItems(result.totalItems);

            // Show notification if using mock data
            if (result.note) {
                toast.info(result.note);
            }
        } catch (error: any) {
            // Check if this is still the latest request
            if (requestId !== requestIdRef.current) {
                console.log(`Request ${requestId} error is outdated, ignoring`);
                return;
            }

            if (error.name === 'AbortError') {
                // Request was cancelled, don't show error
                console.log(`Request ${requestId} was cancelled`);
                return;
            }

            console.error(`Request ${requestId} error:`, error);
            toast.error('Failed to fetch cutoff data. Please try again.');
        } finally {
            // Only update loading state if this is still the latest request
            if (requestId === requestIdRef.current) {
                setLoading(false);
                setIsSearching(false);
                setIsRequestActive(false);
            }
        }
    }, [currentPage, itemsPerPage, debouncedFilters]);

    useEffect(() => {
        // Clear any pending pagination timeout
        if (paginationTimeoutRef.current) {
            clearTimeout(paginationTimeoutRef.current);
        }

        // Debounce pagination requests to prevent rapid-fire API calls
        paginationTimeoutRef.current = setTimeout(() => {
            fetchRecords();
        }, 150); // 150ms debounce for pagination

        return () => {
            if (paginationTimeoutRef.current) {
                clearTimeout(paginationTimeoutRef.current);
            }
        };
    }, [fetchRecords]);

    // Cleanup effect
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (paginationTimeoutRef.current) {
                clearTimeout(paginationTimeoutRef.current);
            }
        };
    }, []);

    const handleCategoryToggle = useCallback((category: string) => {
        setPendingFilters(prev => ({
            ...prev,
            categories: prev.categories.includes(category)
                ? prev.categories.filter(c => c !== category)
                : [...prev.categories, category]
        }));
    }, []);

    const handleSeatAllocationToggle = useCallback((seatAllocation: string) => {
        setPendingFilters(prev => ({
            ...prev,
            seatAllocations: prev.seatAllocations.includes(seatAllocation)
                ? prev.seatAllocations.filter(s => s !== seatAllocation)
                : [...prev.seatAllocations, seatAllocation]
        }));
    }, []);

    const handleCourseToggle = useCallback((course: string) => {
        setPendingFilters(prev => ({
            ...prev,
            courses: prev.courses.includes(course)
                ? prev.courses.filter(c => c !== course)
                : [...prev.courses, course]
        }));
    }, []);

    const applyFilters = useCallback(() => {
        setIsSearching(true);
        // Clear cache when filters change
        cacheRef.current.clear();
        setFilters(prev => ({
            ...prev,
            search: pendingFilters.search,
            categories: pendingFilters.categories,
            seatAllocations: pendingFilters.seatAllocations,
            courses: pendingFilters.courses,
            percentileInput: pendingFilters.percentileInput
        }));
        setSorting([{ id: 'cutoff_score', desc: true }]); // Ensure default sorting
        setCurrentPage(1); // Always reset to first page when applying filters
        setIsRequestActive(false); // Reset request state
    }, [pendingFilters]);

    const clearAllFilters = useCallback(() => {
        const clearedFilters = {
            search: '',
            categories: [],
            seatAllocations: [],
            courses: [],
            percentileInput: ''
        };
        // Clear cache when filters are cleared
        cacheRef.current.clear();
        setPendingFilters(clearedFilters);
        setFilters(prev => ({
            ...prev,
            ...clearedFilters
        }));
        setSorting([{ id: 'cutoff_score', desc: true }]); // Reset to default sorting
        setCurrentPage(1); // Reset to first page
        setIsRequestActive(false); // Reset request state
    }, []);

    // Throttled pagination function to prevent rapid clicking
    const handlePageChange = useCallback((newPage: number) => {
        const now = Date.now();
        const timeSinceLastClick = now - lastPaginationClickRef.current;

        // Throttle pagination clicks to prevent rapid requests
        if (timeSinceLastClick < 200) { // 200ms throttle
            return;
        }

        lastPaginationClickRef.current = now;

        if (newPage >= 1 && newPage <= Math.ceil(memoizedTotalItems / itemsPerPage)) {
            setCurrentPage(newPage);
        }
    }, [memoizedTotalItems, itemsPerPage]);

    return (
        <div className="container mx-auto py-32 px-4 space-y-6 font-abel">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-black font-abel">
                        MHT-CET State Cutoffs 2024
                    </h1>
                    <p className="text-muted-foreground text-lg font-medium mt-2 font-abel">
                        Round 1 cutoffs for engineering colleges
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="neutral" onClick={fetchRecords} disabled={loading} className="font-abel">
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-abel">
                        <Filter className="h-5 w-5" />
                        Filters
                        {hasUnsavedChanges && (
                            <Badge variant="neutral" className="ml-2 font-abel bg-red-100 text-red-800 border-red-300">
                                Changes Pending
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search colleges, courses..."
                            value={pendingFilters.search}
                            onChange={(e) => setPendingFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="pl-10 font-abel"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                        {/* Percentile Input */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2 font-abel">
                                Target Percentile (-1 range)
                            </Label>
                            <Input
                                placeholder="Enter percentile (e.g., 95.5)"
                                value={pendingFilters.percentileInput}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    // Allow numbers and decimal point
                                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                        const numValue = parseFloat(value);
                                        if (value === '' || (numValue >= 0 && numValue <= 100)) {
                                            setPendingFilters(prev => ({ ...prev, percentileInput: value }));
                                        }
                                    }
                                }}
                                type="text"
                                className="font-abel"
                            />
                            {pendingFilters.percentileInput && (
                                <p className="text-xs text-muted-foreground font-abel">
                                    {(() => {
                                        const target = parseFloat(pendingFilters.percentileInput);
                                        const range = getPrecisePercentileRange(target);
                                        return `Will show percentiles from ${range.min}% to ${range.max}%`;
                                    })()}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {/* Enhanced Category Filter */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="neutral" className="justify-between h-10 font-abel">
                                    <span>Categories</span>
                                    <div className="flex items-center gap-2">
                                        {pendingFilters.categories.length > 0 && (
                                            <Badge variant="neutral" className="ml-2 text-xs px-2 py-0 font-abel">
                                                {pendingFilters.categories.length}
                                            </Badge>
                                        )}
                                        <Filter className="h-4 w-4" />
                                    </div>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-96 p-0">
                                <div className="p-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-medium font-abel">Select Categories</h4>
                                        <Button
                                            variant="link"
                                            size="sm"
                                            onClick={() => {
                                                setPendingFilters(prev => ({ ...prev, categories: [] }));
                                            }}
                                            className="font-abel"
                                        >
                                            Clear All
                                        </Button>
                                    </div>
                                </div>
                                <ScrollArea className="h-80">
                                    <div className="px-4 pb-4 space-y-4">
                                        {Object.entries(CATEGORY_GROUPS).map(([group, categories]) => (
                                            <div key={group}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <Label className="text-sm font-medium text-foreground font-abel">{group}</Label>
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="h-auto p-0 text-xs font-abel"
                                                        onClick={() => {
                                                            const allSelected = categories.every(cat => pendingFilters.categories.includes(cat));
                                                            if (allSelected) {
                                                                setPendingFilters(prev => ({
                                                                    ...prev,
                                                                    categories: prev.categories.filter(c => !categories.includes(c))
                                                                }));
                                                            } else {
                                                                setPendingFilters(prev => ({
                                                                    ...prev,
                                                                    categories: [...new Set([...prev.categories, ...categories])]
                                                                }));
                                                            }
                                                        }}
                                                    >
                                                        {categories.every(cat => pendingFilters.categories.includes(cat)) ? 'Deselect All' : 'Select All'}
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {categories.map((category) => (
                                                        <div key={category} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={category}
                                                                checked={pendingFilters.categories.includes(category)}
                                                                onCheckedChange={() => handleCategoryToggle(category)}
                                                            />
                                                            <Label htmlFor={category} className="text-xs font-abel cursor-pointer">
                                                                {category}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                                <Separator className="mt-3" />
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>

                        {/* Enhanced Course Filter */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="neutral" className="justify-between h-10 font-abel">
                                    <span>Courses</span>
                                    <div className="flex items-center gap-2">
                                        {pendingFilters.courses.length > 0 && (
                                            <Badge variant="neutral" className="ml-2 text-xs px-2 py-0 font-abel">
                                                {pendingFilters.courses.length}
                                            </Badge>
                                        )}
                                        <Filter className="h-4 w-4" />
                                    </div>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-96 p-0">
                                <div className="p-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-medium font-abel">Select Courses</h4>
                                        <Button
                                            variant="link"
                                            size="sm"
                                            onClick={() => {
                                                setPendingFilters(prev => ({ ...prev, courses: [] }));
                                            }}
                                            className="font-abel"
                                        >
                                            Clear All
                                        </Button>
                                    </div>
                                </div>
                                <ScrollArea className="h-80">
                                    <div className="px-4 pb-4 space-y-4">
                                        {Object.entries(COURSE_GROUPS).map(([group, courses]) => (
                                            <div key={group}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <Label className="text-sm font-medium text-foreground font-abel">{group}</Label>
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="h-auto p-0 text-xs font-abel"
                                                        onClick={() => {
                                                            const allSelected = courses.every(course => pendingFilters.courses.includes(course));
                                                            if (allSelected) {
                                                                setPendingFilters(prev => ({
                                                                    ...prev,
                                                                    courses: prev.courses.filter(c => !courses.includes(c))
                                                                }));
                                                            } else {
                                                                setPendingFilters(prev => ({
                                                                    ...prev,
                                                                    courses: [...new Set([...prev.courses, ...courses])]
                                                                }));
                                                            }
                                                        }}
                                                    >
                                                        {courses.every(course => pendingFilters.courses.includes(course)) ? 'Deselect All' : 'Select All'}
                                                    </Button>
                                                </div>
                                                <div className="space-y-1">
                                                    {courses.map((course) => (
                                                        <div key={course} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={course}
                                                                checked={pendingFilters.courses.includes(course)}
                                                                onCheckedChange={() => handleCourseToggle(course)}
                                                            />
                                                            <Label htmlFor={course} className="text-xs font-abel cursor-pointer">
                                                                {course}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                                <Separator className="mt-3" />
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>

                        {/* Seat Allocation Filter */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="neutral" className="justify-between h-10 font-abel">
                                    <span>Seat Allocation</span>
                                    <div className="flex items-center gap-2">
                                        {pendingFilters.seatAllocations.length > 0 && (
                                            <Badge variant="neutral" className="ml-2 text-xs px-2 py-0 font-abel">
                                                {pendingFilters.seatAllocations.length}
                                            </Badge>
                                        )}
                                        <Filter className="h-4 w-4" />
                                    </div>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                                <div className="space-y-3">
                                    {SEAT_ALLOCATION_OPTIONS.map((option) => (
                                        <div key={option.value} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={option.value}
                                                checked={pendingFilters.seatAllocations.includes(option.value)}
                                                onCheckedChange={() => handleSeatAllocationToggle(option.value)}
                                            />
                                            <Label htmlFor={option.value} className="text-sm font-abel">
                                                {option.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* Search and Clear Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:ml-auto">
                            <Button
                                onClick={applyFilters}
                                disabled={!pendingFilters.percentileInput || !hasUnsavedChanges || isSearching}
                                className="px-4 sm:px-6 py-2 font-abel text-sm sm:text-base w-full sm:w-auto"
                            >
                                {isSearching || loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Searching...
                                    </>
                                ) : (
                                    <>
                                        <Search className="mr-2 h-4 w-4" />
                                        Search Cutoffs
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="neutral"
                                onClick={clearAllFilters}
                                className="px-4 py-2 font-abel text-sm sm:text-base w-full sm:w-auto"
                            >
                                Clear All
                            </Button>
                        </div>
                    </div>

                    {/* Changes Indicator */}
                    {!pendingFilters.percentileInput ? (
                        <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-blue-800 font-abel">
                                Please enter a target percentile to search for cutoffs.
                            </span>
                        </div>
                    ) : hasUnsavedChanges ? (
                        <div className="flex items-center justify-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-amber-800 font-abel">
                                You have unsaved filter changes. Click &quot;Search Cutoffs&quot; to apply them.
                            </span>
                        </div>
                    ) : null}
                </CardContent>
            </Card>

            {/* Active Filters Display */}
            {(filters.percentileInput || filters.categories.length > 0 || filters.seatAllocations.length > 0 || filters.courses.length > 0) && (
                <Card className="bg-blue-50/50 border-blue-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Filter className="h-4 w-4 text-blue-600" />
                            <h3 className="text-sm font-semibold text-blue-900 font-abel">Active Filters</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {filters.percentileInput && (
                                <Badge variant="default" className="bg-blue-100 text-blue-800 font-abel">
                                    Target Percentile: {filters.percentileInput}%
                                </Badge>
                            )}
                            {filters.categories.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    <Badge variant="default" className="bg-green-100 text-green-800 font-abel">
                                        Categories ({filters.categories.length}):
                                    </Badge>
                                    {filters.categories.slice(0, 3).map((category, index) => (
                                        <Badge key={index} variant="neutral" className="bg-green-50 text-green-700 font-abel text-xs">
                                            {category}
                                        </Badge>
                                    ))}
                                    {filters.categories.length > 3 && (
                                        <Badge variant="neutral" className="bg-green-50 text-green-700 font-abel text-xs">
                                            +{filters.categories.length - 3} more
                                        </Badge>
                                    )}
                                </div>
                            )}
                            {filters.seatAllocations.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    <Badge variant="default" className="bg-purple-100 text-purple-800 font-abel">
                                        Seat Allocations ({filters.seatAllocations.length}):
                                    </Badge>
                                    {filters.seatAllocations.slice(0, 2).map((allocation, index) => {
                                        const option = SEAT_ALLOCATION_OPTIONS.find(s => s.value === allocation);
                                        const label = option?.label || allocation;
                                        return (
                                            <Badge key={index} variant="neutral" className="bg-purple-50 text-purple-700 font-abel text-xs">
                                                {label}
                                            </Badge>
                                        );
                                    })}
                                    {filters.seatAllocations.length > 2 && (
                                        <Badge variant="neutral" className="bg-purple-50 text-purple-700 font-abel text-xs">
                                            +{filters.seatAllocations.length - 2} more
                                        </Badge>
                                    )}
                                </div>
                            )}
                            {filters.courses.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    <Badge variant="default" className="bg-orange-100 text-orange-800 font-abel">
                                        Courses ({filters.courses.length}):
                                    </Badge>
                                    {filters.courses.slice(0, 2).map((course, index) => (
                                        <Badge key={index} variant="neutral" className="bg-orange-50 text-orange-700 font-abel text-xs">
                                            {course.length > 30 ? `${course.substring(0, 30)}...` : course}
                                        </Badge>
                                    ))}
                                    {filters.courses.length > 2 && (
                                        <Badge variant="neutral" className="bg-orange-50 text-orange-700 font-abel text-xs">
                                            +{filters.courses.length - 2} more
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Compact Results Summary */}
            <div className="flex flex-wrap gap-2 sm:gap-3 text-sm font-abel">
                <div className="flex items-center gap-2 bg-muted/50 px-2 sm:px-3 py-2 rounded-md">
                    <span className="font-medium">{memoizedTotalItems.toLocaleString()}</span>
                    <span className="text-muted-foreground">total</span>
                </div>
                <div className="flex items-center gap-2 bg-muted/50 px-2 sm:px-3 py-2 rounded-md">
                    <span className="font-medium">{records.length}</span>
                    <span className="text-muted-foreground">showing</span>
                </div>
                <div className="flex items-center gap-2 bg-muted/50 px-2 sm:px-3 py-2 rounded-md">
                    <span className="font-medium">{filters.categories.length}</span>
                    <span className="text-muted-foreground">categories</span>
                </div>
                <div className="flex items-center gap-2 bg-muted/50 px-2 sm:px-3 py-2 rounded-md">
                    <span className="font-medium">{filters.percentileInput ? '-1%' : 'All'}</span>
                    <span className="text-muted-foreground">percentile range</span>
                </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <p className="text-sm text-muted-foreground font-abel">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, memoizedTotalItems)} of {memoizedTotalItems.toLocaleString()} results
                </p>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-abel">Rows per page:</span>
                    <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) => {
                            setItemsPerPage(parseInt(value));
                            setCurrentPage(1);
                        }}
                    >
                        <SelectTrigger className="w-20 font-abel">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {ITEMS_PER_PAGE_OPTIONS.map(option => (
                                <SelectItem key={option} value={option.toString()} className="font-abel">
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Enhanced Table with @tanstack/react-table */}
            <Card>
                <CardContent className="p-0">
                    {!filters.percentileInput ? (
                        <div className="flex flex-col items-center justify-center py-16 space-y-4">
                            <div className="text-center space-y-2">
                                <h3 className="text-lg font-medium font-abel">Enter Target Percentile</h3>
                                <p className="text-sm text-muted-foreground font-abel">
                                    Please enter a target percentile above to search for MHT-CET cutoffs
                                </p>
                                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground font-abel">
                                    <span>Example: 95.5 for 95.5 percentile cutoffs</span>
                                </div>
                            </div>
                        </div>
                    ) : loading ? (
                        <div className="flex flex-col items-center justify-center py-16 space-y-4">
                            <div className="relative">
                                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                                <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-blue-100"></div>
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-lg font-medium font-abel">Loading Cutoff Data</h3>
                                <p className="text-sm text-muted-foreground font-abel">
                                    Fetching the latest MHT-CET state cutoffs...
                                </p>
                                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground font-abel">
                                    <span>This may take a few seconds</span>
                                    <div className="flex gap-1">
                                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Enhanced Table with consistent row heights */}
                            <div className="rounded-md border overflow-hidden">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            {table.getHeaderGroups().map((headerGroup) => (
                                                <TableRow key={headerGroup.id} className="h-12 bg-muted/30">
                                                    {headerGroup.headers.map((header) => {
                                                        return (
                                                            <TableHead
                                                                key={header.id}
                                                                className="h-12 font-semibold whitespace-nowrap"
                                                                style={{ width: header.column.columnDef.size }}
                                                            >
                                                                {header.isPlaceholder
                                                                    ? null
                                                                    : flexRender(
                                                                        header.column.columnDef.header,
                                                                        header.getContext()
                                                                    )}
                                                            </TableHead>
                                                        )
                                                    })}
                                                </TableRow>
                                            ))}
                                        </TableHeader>
                                        <TableBody>
                                            {table.getRowModel().rows?.length ? (
                                                table.getRowModel().rows.map((row) => (
                                                    <TableRow
                                                        key={row.id}
                                                        data-state={row.getIsSelected() && "selected"}
                                                        className="h-14 hover:bg-muted/50 transition-colors duration-150"
                                                    >
                                                        {row.getVisibleCells().map((cell) => (
                                                            <TableCell
                                                                key={cell.id}
                                                                className="py-2 h-14 whitespace-nowrap"
                                                                style={{ width: cell.column.columnDef.size }}
                                                            >
                                                                {flexRender(
                                                                    cell.column.columnDef.cell,
                                                                    cell.getContext()
                                                                )}
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={columns.length}
                                                        className="h-24 text-center"
                                                    >
                                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                            <Search className="h-8 w-8" />
                                                            <span className="font-abel">No cutoff data found matching your criteria</span>
                                                            <span className="text-xs font-abel">Try adjusting your filters</span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {/* Enhanced Pagination */}
                            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-2 gap-4">
                                <div className="flex items-center space-x-2">
                                    <p className="text-sm font-medium font-abel">Rows per page</p>
                                    <Select
                                        value={`${itemsPerPage}`}
                                        onValueChange={(value) => {
                                            const newPerPage = Number(value);
                                            setItemsPerPage(newPerPage);
                                            setCurrentPage(1); // Reset to first page when changing items per page
                                        }}
                                    >
                                        <SelectTrigger className="h-8 w-[70px] font-abel">
                                            <SelectValue placeholder={itemsPerPage} />
                                        </SelectTrigger>
                                        <SelectContent side="top">
                                            {ITEMS_PER_PAGE_OPTIONS.map((pageSize) => (
                                                <SelectItem key={pageSize} value={`${pageSize}`} className="font-abel">
                                                    {pageSize}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center space-x-2 sm:space-x-6 lg:space-x-8">                                <div className="flex w-[100px] items-center justify-center text-sm font-medium font-abel">
                                    Page {currentPage} of {Math.ceil(memoizedTotalItems / itemsPerPage)}
                                </div>
                                    <div className="flex items-center space-x-1 sm:space-x-2">
                                        <Button
                                            variant="neutral"
                                            className="hidden sm:flex h-8 w-8 p-0"
                                            onClick={() => handlePageChange(1)}
                                            disabled={currentPage === 1 || loading || memoizedTotalItems === 0}
                                        >
                                            <span className="sr-only">Go to first page</span>
                                            <ChevronsLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="neutral"
                                            className="h-8 w-8 p-0"
                                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1 || loading || memoizedTotalItems === 0}
                                        >
                                            <span className="sr-only">Go to previous page</span>
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="neutral"
                                            className="h-8 w-8 p-0"
                                            onClick={() => {
                                                const totalPages = Math.ceil(memoizedTotalItems / itemsPerPage);
                                                handlePageChange(Math.min(totalPages, currentPage + 1));
                                            }}
                                            disabled={currentPage >= Math.ceil(memoizedTotalItems / itemsPerPage) || loading || memoizedTotalItems === 0}
                                        >
                                            <span className="sr-only">Go to next page</span>
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="neutral"
                                            className="hidden sm:flex h-8 w-8 p-0"
                                            onClick={() => {
                                                const totalPages = Math.ceil(memoizedTotalItems / itemsPerPage);
                                                handlePageChange(totalPages);
                                            }}
                                            disabled={currentPage >= Math.ceil(memoizedTotalItems / itemsPerPage) || loading || memoizedTotalItems === 0}
                                        >
                                            <span className="sr-only">Go to last page</span>
                                            <ChevronsRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Table Info */}
                            <div className="flex flex-col sm:flex-row items-center justify-between px-4 pb-4 gap-2">
                                <div className="flex-1 text-sm text-muted-foreground font-abel text-center sm:text-left">
                                    Showing {table.getRowModel().rows.length} of {memoizedTotalItems.toLocaleString()} results
                                </div>
                                <div className="text-sm text-muted-foreground font-abel">
                                    {table.getFilteredRowModel().rows.length} row(s) displayed.
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Informational Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
                {/* How to Use This Tool */}
                <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-3 text-lg font-abel text-blue-900">
                            <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Lightbulb className="h-5 w-5 text-blue-600" />
                            </div>
                            How to Use This Tool
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-2">
                        <div className="space-y-3 text-sm font-abel">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-1 h-5 w-5 flex items-center justify-center rounded-full bg-blue-200 text-blue-700 font-bold text-xs">1</div>
                                <div>
                                    <p className="font-semibold text-gray-800">Enter Your Percentile</p>
                                    <p className="text-gray-600 text-xs">Type your MHT-CET percentile to see colleges in a -1% range.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-1 h-5 w-5 flex items-center justify-center rounded-full bg-blue-200 text-blue-700 font-bold text-xs">2</div>
                                <div>
                                    <p className="font-semibold text-gray-800">Filter Your Preferences</p>
                                    <p className="text-gray-600 text-xs">Select categories, courses, and seat types to narrow down results.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-1 h-5 w-5 flex items-center justify-center rounded-full bg-blue-200 text-blue-700 font-bold text-xs">3</div>
                                <div>
                                    <p className="font-semibold text-gray-800">Analyze & Strategize</p>
                                    <p className="text-gray-600 text-xs">Results are sorted by highest cutoff. Use this to plan your CAP round choices.</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
                            <p className="text-xs font-abel text-amber-900">
                                <span className="font-bold">Pro Tip:</span> The -1% range shows realistic options, helping you find colleges where you have a strong chance of admission.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Seat Allocation Types */}
                <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-3 text-lg font-abel text-purple-900">
                            <div className="h-10 w-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                <MapPin className="h-5 w-5 text-purple-600" />
                            </div>
                            Seat Allocation Types
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-2 text-sm font-abel">
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-white border border-gray-200">
                            <ShieldCheck className="h-5 w-5 text-green-600 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-gray-800">State Level</p>
                                <p className="text-xs text-gray-600">Open to all Maharashtra candidates.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-white border border-gray-200">
                            <Building className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-gray-800">Home University</p>
                                <p className="text-xs text-gray-600">For students within the same university region.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-white border border-gray-200">
                            <Users className="h-5 w-5 text-orange-600 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-gray-800">Other University</p>
                                <p className="text-xs text-gray-600">For students from different university regions.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Category and Code Legends */}
                <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-3 text-lg font-abel text-emerald-900">
                            <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <BookUser className="h-5 w-5 text-emerald-600" />
                            </div>
                            Category & Code Legends
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <Accordion type="single" collapsible className="w-full space-y-2">
                            <AccordionItem value="item-1" className="border rounded-lg px-3">
                                <AccordionTrigger className="font-abel text-sm font-semibold text-gray-700 hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        <Info className="h-4 w-4" /> Category Code Format
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="font-abel text-xs pb-3">
                                    <div className="space-y-2 p-3 bg-white rounded-md border">
                                        <p><span className="font-bold">G</span> = General, <span className="font-bold">L</span> = Ladies</p>
                                        <p><span className="font-bold">H</span> = Home Uni, <span className="font-bold">O</span> = Other Uni, <span className="font-bold">S</span> = State</p>
                                        <p>Example: <span className="font-mono bg-gray-100 px-1 rounded">GOPENH</span> is General Open Home University.</p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2" className="border rounded-lg px-3">
                                <AccordionTrigger className="font-abel text-sm font-semibold text-gray-700 hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        <GraduationCap className="h-4 w-4" /> Special Category Codes
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="font-abel text-xs pb-3">
                                    <div className="space-y-2 p-3 bg-white rounded-md border">
                                        <p><span className="font-bold">TFWS:</span> Tuition Fee Waiver Scheme</p>
                                        <p><span className="font-bold">EWS:</span> Economically Weaker Section</p>
                                        <p><span className="font-bold">DEF:</span> Defence Reserved</p>
                                        <p><span className="font-bold">PWD:</span> Persons with Disability</p>
                                        <p><span className="font-bold">MI:</span> Minority Seats</p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-3" className="border rounded-lg px-3">
                                <AccordionTrigger className="font-abel text-sm font-semibold text-gray-700 hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        <Video className="h-4 w-4" /> Video Guide
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-3">
                                    <div className="space-y-3">
                                        <p className="text-xs font-abel text-gray-600 italic">
                                            Educational content from an independent creator (not affiliated with our platform)
                                        </p>
                                        <div className="w-full" style={{ aspectRatio: '16/9' }}>
                                            <iframe
                                                className="w-full h-full rounded-lg border"
                                                src="https://www.youtube-nocookie.com/embed/1WA_Vh1jaU4?si=-4H9MJYD8tOzjRTs"
                                                title="YouTube video player"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                referrerPolicy="strict-origin-when-cross-origin"
                                                allowFullScreen
                                                style={{ minHeight: '200px' }}
                                            ></iframe>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
