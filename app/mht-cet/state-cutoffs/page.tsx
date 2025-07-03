'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
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
import CategoryFlowChart from '@/components/CategoryFlowChart';

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
    status: string;
    home_university: string;
    created: string;
    updated: string;
}

interface FilterState {
    search: string;
    categories: string[];
    courses: string[];
    statuses: string[];
    homeUniversities: string[];
    percentileInput: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}

interface PendingFilters {
    search: string;
    categories: string[];
    courses: string[];
    statuses: string[];
    homeUniversities: string[];
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

const STATUS_OPTIONS = [
    { value: 'Deemed University Autonomous', label: 'Deemed University Autonomous' },
    { value: 'Government', label: 'Government' },
    { value: 'Government Autonomous', label: 'Government Autonomous' },
    { value: 'Government-Aided Autonomous', label: 'Government-Aided Autonomous' },
    { value: 'Un-Aided', label: 'Un-Aided' },
    { value: 'Un-Aided Autonomous', label: 'Un-Aided Autonomous' },
    { value: 'Un-Aided Autonomous Linguistic Minority - Gujarathi', label: 'Un-Aided Autonomous Linguistic Minority - Gujarathi' },
    { value: 'Un-Aided Autonomous Linguistic Minority - Gujarathi(Jain)', label: 'Un-Aided Autonomous Linguistic Minority - Gujarathi(Jain)' },
    { value: 'Un-Aided Autonomous Linguistic Minority - Hindi', label: 'Un-Aided Autonomous Linguistic Minority - Hindi' },
    { value: 'Un-Aided Autonomous Linguistic Minority - Malyalam', label: 'Un-Aided Autonomous Linguistic Minority - Malyalam' },
    { value: 'Un-Aided Autonomous Linguistic Minority - Sindhi', label: 'Un-Aided Autonomous Linguistic Minority - Sindhi' },
    { value: 'Un-Aided Autonomous Linguistic Minority - Tamil', label: 'Un-Aided Autonomous Linguistic Minority - Tamil' },
    { value: 'Un-Aided Autonomous Religious Minority - Christian', label: 'Un-Aided Autonomous Religious Minority - Christian' },
    { value: 'Un-Aided Autonomous Religious Minority - Jain', label: 'Un-Aided Autonomous Religious Minority - Jain' },
    { value: 'Un-Aided Linguistic Minority - Gujar', label: 'Un-Aided Linguistic Minority - Gujar' },
    { value: 'Un-Aided Linguistic Minority - Gujarathi', label: 'Un-Aided Linguistic Minority - Gujarathi' },
    { value: 'Un-Aided Linguistic Minority - Hindi', label: 'Un-Aided Linguistic Minority - Hindi' },
    { value: 'Un-Aided Linguistic Minority - Malyalam', label: 'Un-Aided Linguistic Minority - Malyalam' },
    { value: 'Un-Aided Linguistic Minority - Punjabi', label: 'Un-Aided Linguistic Minority - Punjabi' },
    { value: 'Un-Aided Linguistic Minority - Sindhi', label: 'Un-Aided Linguistic Minority - Sindhi' },
    { value: 'Un-Aided Religious Minority - Christian', label: 'Un-Aided Religious Minority - Christian' },
    { value: 'Un-Aided Religious Minority - Jain', label: 'Un-Aided Religious Minority - Jain' },
    { value: 'Un-Aided Religious Minority - Muslim', label: 'Un-Aided Religious Minority - Muslim' },
    { value: 'Un-Aided Religious Minority - Roman Catholics', label: 'Un-Aided Religious Minority - Roman Catholics' },
    { value: 'University', label: 'University' },
    { value: 'University Autonomous', label: 'University Autonomous' },
    { value: 'University Department', label: 'University Department' },
    { value: 'University Managed (Un-Aided)', label: 'University Managed (Un-Aided)' },
    { value: 'University Managed Autonomous', label: 'University Managed Autonomous' }
];

const HOME_UNIVERSITY_OPTIONS = [
    { value: 'Autonomous Institute', label: 'Autonomous Institute' },
    { value: 'Deemed to be University', label: 'Deemed to be University' },
    { value: 'Dr. Babasaheb Ambedkar Marathwada University', label: 'Dr. Babasaheb Ambedkar Marathwada University' },
    { value: 'Dr. Babasaheb Ambedkar Technological University Lonere', label: 'Dr. Babasaheb Ambedkar Technological University Lonere' },
    { value: 'Gondwana University', label: 'Gondwana University' },
    { value: 'Kavayitri Bahinabai Chaudhari North Maharashtra University Jalgaon', label: 'Kavayitri Bahinabai Chaudhari North Maharashtra University Jalgaon' },
    { value: 'Mumbai University', label: 'Mumbai University' },
    { value: 'Punyashlok Ahilyadevi Holkar Solapur University', label: 'Punyashlok Ahilyadevi Holkar Solapur University' },
    { value: 'Rashtrasant Tukadoji Maharaj Nagpur University', label: 'Rashtrasant Tukadoji Maharaj Nagpur University' },
    { value: 'SNDT Women s University', label: 'SNDT Women s University' },
    { value: 'Sant Gadge Baba Amravati University', label: 'Sant Gadge Baba Amravati University' },
    { value: 'Savitribai Phule Pune University', label: 'Savitribai Phule Pune University' },
    { value: 'Shivaji University', label: 'Shivaji University' },
    { value: 'Swami Ramanand Teerth Marathwada University Nanded', label: 'Swami Ramanand Teerth Marathwada University Nanded' }
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
    const min = Math.max(0, Math.round((targetPercentile - 10) * 10000000000) / 10000000000);
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
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [isRequestActive, setIsRequestActive] = useState(false);

    // Applied filters (what's actually being used for search)
    const [filters, setFilters] = useState<FilterState>({
        search: '',
        categories: [],
        courses: [],
        statuses: [],
        homeUniversities: [],
        percentileInput: '',
        sortBy: 'last_rank',
        sortOrder: 'desc'
    });

    // Pending filters (what user is currently selecting)
    const [pendingFilters, setPendingFilters] = useState<PendingFilters>({
        search: '',
        categories: [],
        courses: [],
        statuses: [],
        homeUniversities: [],
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
    const prevItemsPerPageRef = useRef<number>(itemsPerPage);

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
                            className="h-8 sm:h-10 px-2 sm:px-3 lg:px-4 font-abel text-xs sm:text-sm lg:text-base"
                        >
                            College Name
                            <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                    )
                },
                cell: ({ row }) => (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="font-abel font-medium max-w-[200px] sm:max-w-[300px] truncate cursor-help text-xs sm:text-sm lg:text-base px-2 sm:px-3">
                                    {row.getValue("college_name")}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-md font-abel text-sm">{row.getValue("college_name")}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ),
                size: 300,
            },
            {
                accessorKey: "course_name",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="link"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="h-8 sm:h-10 px-2 sm:px-3 lg:px-4 font-abel text-xs sm:text-sm lg:text-base"
                        >
                            Course Name
                            <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                    )
                },
                cell: ({ row }) => (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="font-abel font-medium max-w-[180px] sm:max-w-[250px] truncate cursor-help text-xs sm:text-sm lg:text-base px-2 sm:px-3">
                                    {row.getValue("course_name")}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-md font-abel text-sm">{row.getValue("course_name")}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ),
                size: 250,
            },
            {
                accessorKey: "category",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="link"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="h-8 sm:h-10 px-2 sm:px-3 lg:px-4 font-abel text-xs sm:text-sm lg:text-base"
                        >
                            Category
                            <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                    )
                },
                cell: ({ row }) => (
                    <div className="px-2 sm:px-3">
                        <Badge variant="neutral" className="font-abel text-xs sm:text-sm w-fit font-medium">
                            {row.getValue("category")}
                        </Badge>
                    </div>
                ),
                size: 120,
            },
            {
                accessorKey: "last_rank",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="link"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="h-8 sm:h-10 px-2 sm:px-3 lg:px-4 font-abel text-xs sm:text-sm lg:text-base"
                        >
                            Rank
                            <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                    )
                },
                cell: ({ row }) => {
                    const rank = row.getValue("last_rank") as string;
                    const numRank = parseInt(rank);
                    return (
                        <div className="text-right font-abel font-medium w-[80px] sm:w-[100px] text-xs sm:text-sm lg:text-base px-2 sm:px-3">
                            {isNaN(numRank) ? rank : numRank.toLocaleString()}
                        </div>
                    );
                },
                size: 100,
            },
            {
                accessorKey: "cutoff_score",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="link"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="h-8 sm:h-10 px-2 sm:px-3 lg:px-4 font-abel text-xs sm:text-sm lg:text-base"
                        >
                            Percentile
                            <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                    )
                },
                cell: ({ row }) => (
                    <div className="text-right font-abel font-medium w-[80px] sm:w-[100px] text-xs sm:text-sm lg:text-base px-2 sm:px-3">
                        {row.getValue("cutoff_score")}
                    </div>
                ),
                size: 100,
            },
            {
                accessorKey: "total_admitted",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="link"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="h-8 sm:h-10 px-2 sm:px-3 lg:px-4 font-abel text-xs sm:text-sm lg:text-base"
                        >
                            Admitted
                            <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                    )
                },
                cell: ({ row }) => {
                    const value = row.getValue("total_admitted") as number;
                    return (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="text-right font-abel font-medium w-[80px] sm:w-[100px] text-xs sm:text-sm lg:text-base cursor-help px-2 sm:px-3">
                                        {value.toLocaleString()}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="font-abel text-sm">Total students admitted: {value}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                },
                size: 100,
            },
            {
                accessorKey: "college_code",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="link"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="h-8 sm:h-10 px-2 sm:px-3 lg:px-4 font-abel text-xs sm:text-sm lg:text-base"
                        >
                            College Code
                            <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                    )
                },
                cell: ({ row }) => (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="font-abel text-xs sm:text-sm w-[90px] sm:w-[110px] font-medium cursor-help px-2 sm:px-3">
                                    {row.getValue("college_code")}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="font-abel text-sm">College Code: {row.getValue("college_code")}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ),
                size: 110,
            },
            {
                accessorKey: "course_code",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="link"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="h-8 sm:h-10 px-2 sm:px-3 lg:px-4 font-abel text-xs sm:text-sm lg:text-base"
                        >
                            Course Code
                            <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                    )
                },
                cell: ({ row }) => (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="font-abel text-xs sm:text-sm w-[90px] sm:w-[110px] font-medium cursor-help px-2 sm:px-3">
                                    {row.getValue("course_code")}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="font-abel text-sm">Course Code: {row.getValue("course_code")}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ),
                size: 110,
            },
            {
                accessorKey: "status",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="link"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="h-8 sm:h-10 px-2 sm:px-3 lg:px-4 font-abel text-xs sm:text-sm lg:text-base"
                        >
                            Status
                            <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                    )
                },
                cell: ({ row }) => (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="font-abel text-xs sm:text-sm w-[150px] sm:w-[180px] font-medium cursor-help px-2 sm:px-3 truncate">
                                    {row.getValue("status")}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="font-abel text-sm max-w-md">{row.getValue("status")}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ),
                size: 180,
            },
            {
                accessorKey: "home_university",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="link"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="h-8 sm:h-10 px-2 sm:px-3 lg:px-4 font-abel text-xs sm:text-sm lg:text-base"
                        >
                            Home University
                            <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                    )
                },
                cell: ({ row }) => (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="font-abel text-xs sm:text-sm w-[200px] sm:w-[250px] font-medium cursor-help px-2 sm:px-3 truncate">
                                    {row.getValue("home_university")}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="font-abel text-sm max-w-md">{row.getValue("home_university")}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ),
                size: 250,
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
            JSON.stringify(pendingFilters.courses) !== JSON.stringify(filters.courses) ||
            JSON.stringify(pendingFilters.statuses) !== JSON.stringify(filters.statuses) ||
            JSON.stringify(pendingFilters.homeUniversities) !== JSON.stringify(filters.homeUniversities) ||
            pendingFilters.percentileInput !== filters.percentileInput
        );
        setHasUnsavedChanges(filtersChanged);
    }, [pendingFilters, filters]);

    useEffect(() => {
        table.setPageSize(itemsPerPage);
        // Reset to first page when items per page changes (but not on currentPage changes)
        if (prevItemsPerPageRef.current !== itemsPerPage && currentPage > 1) {
            setCurrentPage(1);
        }
        prevItemsPerPageRef.current = itemsPerPage;
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

        const requestBody = {
            page: currentPage,
            perPage: itemsPerPage,
            search: debouncedFilters.search,
            categories: debouncedFilters.categories,
            courses: debouncedFilters.courses,
            statuses: debouncedFilters.statuses,
            homeUniversities: debouncedFilters.homeUniversities,
            percentileInput: debouncedFilters.percentileInput,
            sortBy: debouncedFilters.sortBy,
            sortOrder: debouncedFilters.sortOrder,
        };

        const cacheKey = JSON.stringify(requestBody);

        // Check if this is the same request type (only different pagination)
        const currentRequestKey = `${debouncedFilters.search}-${debouncedFilters.categories.join(',')}-${debouncedFilters.courses.join(',')}-${debouncedFilters.statuses.join(',')}-${debouncedFilters.homeUniversities.join(',')}-${debouncedFilters.percentileInput}`;
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
            const response = await fetch(`/api/mht-cet/state-cutoffs`, {
                method: 'POST',
                signal: abortControllerRef.current.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
                },
                body: JSON.stringify(requestBody),
            });

            // Check if this is still the latest request
            if (requestId !== requestIdRef.current) {
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // Double-check we're still the latest request
            if (requestId !== requestIdRef.current) {
                return;
            }

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch data');
            }

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
                return;
            }

            if (error.name === 'AbortError') {
                // Request was cancelled, don't show error
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
    }, [fetchRecords, currentPage]);

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

    const handleCourseToggle = useCallback((course: string) => {
        setPendingFilters(prev => ({
            ...prev,
            courses: prev.courses.includes(course)
                ? prev.courses.filter(c => c !== course)
                : [...prev.courses, course]
        }));
    }, []);

    const handleStatusToggle = useCallback((status: string) => {
        setPendingFilters(prev => ({
            ...prev,
            statuses: prev.statuses.includes(status)
                ? prev.statuses.filter(s => s !== status)
                : [...prev.statuses, status]
        }));
    }, []);

    const handleHomeUniversityToggle = useCallback((homeUniversity: string) => {
        setPendingFilters(prev => ({
            ...prev,
            homeUniversities: prev.homeUniversities.includes(homeUniversity)
                ? prev.homeUniversities.filter(h => h !== homeUniversity)
                : [...prev.homeUniversities, homeUniversity]
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
            courses: pendingFilters.courses,
            statuses: pendingFilters.statuses,
            homeUniversities: pendingFilters.homeUniversities,
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
            courses: [],
            statuses: [],
            homeUniversities: [],
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

        // Always allow the page change, just throttle the timing
        if (newPage >= 1 && newPage <= Math.ceil(memoizedTotalItems / itemsPerPage)) {
            setCurrentPage(newPage);

            // Update the timestamp to prevent rapid successive clicks
            lastPaginationClickRef.current = now;
        }
    }, [memoizedTotalItems, itemsPerPage]);

    return (
        <div className="w-full max-w-full md:max-w-7xl lg:max-w-7xl xl:max-w-7xl 2xl:max-w-7xl mx-auto py-4 md:py-8 lg:py-16 xl:py-24 px-3 md:px-4 lg:px-6 space-y-4 md:space-y-6 font-abel">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 pt-20 lg:pt-6">
                <div className="flex-1 min-w-0">
                    <h1 className="text-3xl lg:text-3xl xl:text-4xl font-black tracking-tight text-black font-abel break-words">
                        MHT-CET State Cutoffs 2024
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-base lg:text-lg font-medium mt-1 md:mt-2 font-abel">
                        Round 1 cutoffs for engineering colleges
                    </p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader className="pb-3 md:pb-4">
                    <CardTitle className="flex items-center gap-2 font-abel text-lg md:text-xl">
                        <Filter className="h-4 w-4 md:h-5 md:w-5" />
                        Filters
                        {hasUnsavedChanges && (
                            <Badge variant="neutral" className="ml-2 font-abel bg-red-100 text-red-800 border-red-300 text-xs md:text-sm">
                                Changes Pending
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-6">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search colleges, courses..."
                            value={pendingFilters.search}
                            onChange={(e) => setPendingFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="pl-10 font-abel text-sm md:text-base h-12"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {/* Percentile Input */}
                        <div className="space-y-2">
                            <Label className="text-sm md:text-base font-medium flex items-center gap-2 font-abel">
                                Target Percentile (-10 range)
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
                                className="font-abel text-sm md:text-base h-12"
                            />
                            {pendingFilters.percentileInput && (
                                <p className="text-xs sm:text-sm text-muted-foreground font-abel">
                                    {(() => {
                                        const target = parseFloat(pendingFilters.percentileInput);
                                        const range = getPrecisePercentileRange(target);
                                        return `Will show percentiles from ${range.min}% to ${range.max}%`;
                                    })()}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                        {/* Enhanced Category Filter */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="neutral" className="justify-between h-12 font-abel text-sm md:text-base hover:bg-blue-50 border-2 hover:border-blue-300 transition-all duration-200">
                                    <span className="truncate mr-2">Categories</span>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {pendingFilters.categories.length > 0 && (
                                            <Badge variant="default" className="ml-2 text-xs px-2 py-0 font-abel bg-blue-600 text-white">
                                                {pendingFilters.categories.length}
                                            </Badge>
                                        )}
                                        <Filter className="h-4 w-4" />
                                    </div>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-96 md:w-[450px] p-0 max-h-[85vh] overflow-hidden shadow-xl border-2">
                                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-semibold font-abel text-base md:text-lg text-blue-900">Select Categories</h4>
                                        <Button
                                            variant="link"
                                            size="sm"
                                            onClick={() => {
                                                setPendingFilters(prev => ({ ...prev, categories: [] }));
                                            }}
                                            className="font-abel text-xs md:text-sm text-blue-700 hover:text-blue-900 hover:bg-blue-100"
                                        >
                                            Clear All
                                        </Button>
                                    </div>
                                </div>
                                <ScrollArea className="h-96 bg-white">
                                    <div className="px-4 pb-4 pt-2 space-y-5">
                                        {Object.entries(CATEGORY_GROUPS).map(([group, categories]) => (
                                            <div key={group} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                                <div className="flex items-center justify-between mb-3">
                                                    <Label className="text-sm font-semibold text-gray-800 font-abel">{group}</Label>
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="h-auto p-1 text-xs font-abel text-blue-600 hover:text-blue-800 hover:bg-blue-100"
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
                                                        <div key={category} className="flex items-center space-x-2 p-1 hover:bg-white rounded transition-colors">
                                                            <Checkbox
                                                                id={category}
                                                                checked={pendingFilters.categories.includes(category)}
                                                                onCheckedChange={() => handleCategoryToggle(category)}
                                                                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                                            />
                                                            <Label htmlFor={category} className="text-xs font-abel cursor-pointer leading-tight text-gray-700 hover:text-gray-900">
                                                                {category}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>

                        {/* Enhanced Course Filter */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="neutral" className="justify-between h-12 font-abel text-sm md:text-base hover:bg-green-50 border-2 hover:border-green-300 transition-all duration-200">
                                    <span className="truncate mr-2">Courses</span>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {pendingFilters.courses.length > 0 && (
                                            <Badge variant="default" className="ml-2 text-xs px-2 py-0 font-abel bg-green-600 text-white">
                                                {pendingFilters.courses.length}
                                            </Badge>
                                        )}
                                        <Filter className="h-4 w-4" />
                                    </div>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-96 md:w-[500px] p-0 max-h-[85vh] overflow-hidden shadow-xl border-2">
                                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-semibold font-abel text-base md:text-lg text-green-900">Select Courses</h4>
                                        <Button
                                            variant="link"
                                            size="sm"
                                            onClick={() => {
                                                setPendingFilters(prev => ({ ...prev, courses: [] }));
                                            }}
                                            className="font-abel text-xs md:text-sm text-green-700 hover:text-green-900 hover:bg-green-100"
                                        >
                                            Clear All
                                        </Button>
                                    </div>
                                </div>
                                <ScrollArea className="h-96 bg-white">
                                    <div className="px-4 pb-4 pt-2 space-y-5">
                                        {Object.entries(COURSE_GROUPS).map(([group, courses]) => (
                                            <div key={group} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                                <div className="flex items-center justify-between mb-3">
                                                    <Label className="text-sm font-semibold text-gray-800 font-abel">{group}</Label>
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="h-auto p-1 text-xs font-abel text-green-600 hover:text-green-800 hover:bg-green-100"
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
                                                <div className="space-y-2">
                                                    {courses.map((course) => (
                                                        <div key={course} className="flex items-start space-x-2 p-1 hover:bg-white rounded transition-colors">
                                                            <Checkbox
                                                                id={course}
                                                                checked={pendingFilters.courses.includes(course)}
                                                                onCheckedChange={() => handleCourseToggle(course)}
                                                                className="mt-1 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                                            />
                                                            <Label htmlFor={course} className="text-xs font-abel cursor-pointer leading-tight text-gray-700 hover:text-gray-900">
                                                                {course}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>

                        {/* Enhanced Status Filter */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="neutral" className="justify-between h-12 font-abel text-sm md:text-base hover:bg-orange-50 border-2 hover:border-orange-300 transition-all duration-200">
                                    <span className="truncate mr-2">Status</span>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {pendingFilters.statuses.length > 0 && (
                                            <Badge variant="default" className="ml-2 text-xs px-2 py-0 font-abel bg-orange-600 text-white">
                                                {pendingFilters.statuses.length}
                                            </Badge>
                                        )}
                                        <Filter className="h-4 w-4" />
                                    </div>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 md:w-[450px] p-0 max-h-[85vh] overflow-hidden shadow-xl border-2">
                                <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-semibold font-abel text-base md:text-lg text-orange-900">Select Status</h4>
                                        <Button
                                            variant="link"
                                            size="sm"
                                            onClick={() => {
                                                setPendingFilters(prev => ({ ...prev, statuses: [] }));
                                            }}
                                            className="font-abel text-xs md:text-sm text-orange-700 hover:text-orange-900 hover:bg-orange-100"
                                        >
                                            Clear All
                                        </Button>
                                    </div>
                                </div>
                                <ScrollArea className="h-96 bg-white">
                                    <div className="px-4 pb-4 pt-2 space-y-2">
                                        {STATUS_OPTIONS.map((option) => (
                                            <div key={option.value} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded transition-colors border border-gray-100">
                                                <Checkbox
                                                    id={option.value}
                                                    checked={pendingFilters.statuses.includes(option.value)}
                                                    onCheckedChange={() => handleStatusToggle(option.value)}
                                                    className="mt-1 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                                                />
                                                <Label htmlFor={option.value} className="text-xs font-abel leading-tight cursor-pointer text-gray-700 hover:text-gray-900 flex-1">
                                                    {option.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>

                        {/* Enhanced Home University Filter */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="neutral" className="justify-between h-12 font-abel text-sm md:text-base hover:bg-teal-50 border-2 hover:border-teal-300 transition-all duration-200">
                                    <span className="truncate mr-2">Home University</span>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {pendingFilters.homeUniversities.length > 0 && (
                                            <Badge variant="default" className="ml-2 text-xs px-2 py-0 font-abel bg-teal-600 text-white">
                                                {pendingFilters.homeUniversities.length}
                                            </Badge>
                                        )}
                                        <Filter className="h-4 w-4" />
                                    </div>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 md:w-[450px] p-0 max-h-[85vh] overflow-hidden shadow-xl border-2">
                                <div className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 border-b">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-semibold font-abel text-base md:text-lg text-teal-900">Select Home University</h4>
                                        <Button
                                            variant="link"
                                            size="sm"
                                            onClick={() => {
                                                setPendingFilters(prev => ({ ...prev, homeUniversities: [] }));
                                            }}
                                            className="font-abel text-xs md:text-sm text-teal-700 hover:text-teal-900 hover:bg-teal-100"
                                        >
                                            Clear All
                                        </Button>
                                    </div>
                                </div>
                                <ScrollArea className="h-96 bg-white">
                                    <div className="px-4 pb-4 pt-2 space-y-2">
                                        {HOME_UNIVERSITY_OPTIONS.map((option) => (
                                            <div key={option.value} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded transition-colors border border-gray-100">
                                                <Checkbox
                                                    id={option.value}
                                                    checked={pendingFilters.homeUniversities.includes(option.value)}
                                                    onCheckedChange={() => handleHomeUniversityToggle(option.value)}
                                                    className="mt-1 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                                                />
                                                <Label htmlFor={option.value} className="text-xs font-abel leading-tight cursor-pointer text-gray-700 hover:text-gray-900 flex-1">
                                                    {option.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>

                        {/* Enhanced Search and Clear Buttons */}
                        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto md:ml-auto col-span-full">
                            <Button
                                onClick={applyFilters}
                                disabled={!pendingFilters.percentileInput || !hasUnsavedChanges || isSearching}
                                className="px-6 py-3 font-abel text-sm md:text-base w-full md:w-auto h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                            >
                                {isSearching || loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        <span className="hidden md:inline">Searching...</span>
                                        <span className="md:hidden">...</span>
                                    </>
                                ) : (
                                    <>
                                        <Search className="mr-2 h-4 w-4" />
                                        <span className="hidden md:inline">Search Cutoffs</span>
                                        <span className="md:hidden">Search</span>
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="neutral"
                                onClick={clearAllFilters}
                                className="px-4 py-3 font-abel text-sm md:text-base w-full md:w-auto h-12 border-2 hover:bg-gray-50 transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                                <span className="hidden md:inline">Clear All Filters</span>
                                <span className="md:hidden">Clear</span>
                            </Button>
                        </div>
                    </div>

                    {/* Changes Indicator */}
                    {!pendingFilters.percentileInput ? (
                        <div className="flex items-center justify-center gap-2 p-3 md:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse flex-shrink-0"></div>
                            <span className="text-xs md:text-sm font-medium text-blue-800 font-abel text-center">
                                Please enter a target percentile to search for cutoffs.
                            </span>
                        </div>
                    ) : hasUnsavedChanges ? (
                        <div className="flex items-center justify-center gap-2 p-3 md:p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse flex-shrink-0"></div>
                            <span className="text-xs md:text-sm font-medium text-amber-800 font-abel text-center">
                                You have unsaved filter changes. Click &quot;Search Cutoffs&quot; to apply them.
                            </span>
                        </div>
                    ) : null}
                </CardContent>
            </Card>

            {/* Active Filters Display */}
            {(filters.percentileInput || filters.categories.length > 0 || filters.courses.length > 0 || filters.statuses.length > 0 || filters.homeUniversities.length > 0) && (
                <Card className="bg-blue-100 border-blue-300 rounded-lg shadow-md">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Filter className="h-6 w-6 text-blue-700 flex-shrink-0" />
                            <h3 className="text-lg sm:text-xl font-bold text-blue-900 font-abel">Active Filters</h3>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {filters.percentileInput && (
                                <Badge variant="default" className="bg-blue-200 text-blue-900 font-abel text-sm sm:text-base">
                                    Target: {filters.percentileInput}%
                                </Badge>
                            )}
                            {filters.categories.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="default" className="bg-green-200 text-green-900 font-abel text-sm sm:text-base">
                                        Categories ({filters.categories.length})
                                    </Badge>
                                    {filters.categories.map((category, index) => (
                                        <Badge key={index} variant="neutral" className="bg-green-100 text-green-800 font-abel text-sm sm:text-base">
                                            {category}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            {filters.courses.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="default" className="bg-orange-200 text-orange-900 font-abel text-sm sm:text-base">
                                        Courses ({filters.courses.length})
                                    </Badge>
                                    {filters.courses.map((course, index) => (
                                        <Badge key={index} variant="neutral" className="bg-orange-100 text-orange-800 font-abel text-sm sm:text-base">
                                            {course.length > 20 ? `${course.substring(0, 20)}...` : course}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            {filters.statuses.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="default" className="bg-red-200 text-red-900 font-abel text-sm sm:text-base">
                                        Status ({filters.statuses.length})
                                    </Badge>
                                    {filters.statuses.map((status, index) => (
                                        <Badge key={index} variant="neutral" className="bg-red-100 text-red-800 font-abel text-sm sm:text-base">
                                            {status.length > 25 ? `${status.substring(0, 25)}...` : status}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            {filters.homeUniversities.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="default" className="bg-teal-200 text-teal-900 font-abel text-sm sm:text-base">
                                        Universities ({filters.homeUniversities.length})
                                    </Badge>
                                    {filters.homeUniversities.map((university, index) => (
                                        <Badge key={index} variant="neutral" className="bg-teal-100 text-teal-800 font-abel text-sm sm:text-base">
                                            {university.length > 30 ? `${university.substring(0, 30)}...` : university}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="mt-4 flex justify-end">
                            <Button
                                variant="neutral"
                                onClick={clearAllFilters}
                                className="px-2 py-1 font-abel text-xs md:text-sm h-8 md:h-9 rounded-md border border-blue-200 bg-white text-blue-900 hover:bg-blue-50 shadow-sm transition-all duration-150"
                            >
                                Clear All Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Compact Results Summary */}
            <div className="flex flex-wrap gap-2 text-xs md:text-sm font-abel">
                <div className="flex items-center gap-1 md:gap-2 bg-muted/50 px-2 md:px-3 py-1 md:py-2 rounded-md">
                    <span className="font-medium">{memoizedTotalItems.toLocaleString()}</span>
                    <span className="text-muted-foreground">total</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2 bg-muted/50 px-2 md:px-3 py-1 md:py-2 rounded-md">
                    <span className="font-medium">{records.length}</span>
                    <span className="text-muted-foreground">showing</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2 bg-muted/50 px-2 md:px-3 py-1 md:py-2 rounded-md">
                    <span className="font-medium">{filters.categories.length}</span>
                    <span className="text-muted-foreground">categories</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2 bg-muted/50 px-2 md:px-3 py-1 md:py-2 rounded-md">
                    <span className="font-medium">{filters.statuses.length}</span>
                    <span className="text-muted-foreground">statuses</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2 bg-muted/50 px-2 md:px-3 py-1 md:py-2 rounded-md">
                    <span className="font-medium">{filters.homeUniversities.length}</span>
                    <span className="text-muted-foreground">universities</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2 bg-muted/50 px-2 md:px-3 py-1 md:py-2 rounded-md">
                    <span className="font-medium">{filters.percentileInput ? '-10%' : 'All'}</span>
                    <span className="text-muted-foreground">range</span>
                </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
                <p className="text-xs md:text-sm text-muted-foreground font-abel">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, memoizedTotalItems)} of {memoizedTotalItems.toLocaleString()} results
                </p>
                <div className="flex items-center gap-2 text-xs md:text-sm">
                    <span className="font-abel">Rows per page:</span>
                    <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) => {
                            setItemsPerPage(parseInt(value));
                            setCurrentPage(1);
                        }}
                    >
                        <SelectTrigger className="w-16 md:w-20 font-abel h-8 md:h-10">
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
                        <div className="flex flex-col items-center justify-center py-12 md:py-16 space-y-4 px-4">
                            <div className="text-center space-y-2">
                                <h3 className="text-base md:text-lg font-medium font-abel">Enter Target Percentile</h3>
                                <p className="text-xs md:text-sm text-muted-foreground font-abel max-w-md">
                                    Please enter a target percentile above to search for MHT-CET cutoffs
                                </p>
                                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground font-abel">
                                    <span>Example: 95.5 for 95.5 percentile cutoffs</span>
                                </div>
                            </div>
                        </div>
                    ) : loading ? (
                        <div className="flex flex-col items-center justify-center py-12 md:py-16 space-y-4 px-4">
                            <div className="relative">
                                <Loader2 className="h-8 w-8 md:h-12 md:w-12 animate-spin text-blue-500" />
                                <div className="absolute inset-0 h-8 w-8 md:h-12 md:w-12 rounded-full border-2 border-blue-100"></div>
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-base md:text-lg font-medium font-abel">Loading Cutoff Data</h3>
                                <p className="text-xs md:text-sm text-muted-foreground font-abel max-w-md">
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
                                                <TableRow key={headerGroup.id} className="h-10 md:h-12 bg-muted/30">
                                                    {headerGroup.headers.map((header) => {
                                                        return (
                                                            <TableHead
                                                                key={header.id}
                                                                className="h-10 md:h-12 font-semibold whitespace-nowrap text-xs md:text-sm px-2 md:px-4"
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
                                                        className="h-12 md:h-14 hover:bg-muted/50 transition-colors duration-150"
                                                    >
                                                        {row.getVisibleCells().map((cell) => (
                                                            <TableCell
                                                                key={cell.id}
                                                                className="py-2 h-12 md:h-14 text-xs md:text-sm px-2 md:px-4"
                                                                style={{ width: cell.column.columnDef.size }}
                                                            >
                                                                <div className="truncate">
                                                                    {flexRender(
                                                                        cell.column.columnDef.cell,
                                                                        cell.getContext()
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={columns.length}
                                                        className="h-20 md:h-24 text-center"
                                                    >
                                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                            <Search className="h-6 w-6 md:h-8 md:w-8" />
                                                            <span className="font-abel text-sm md:text-base">No cutoff data found matching your criteria</span>
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
                            <div className="flex flex-col md:flex-row items-center justify-between px-2 md:px-4 py-2 md:py-3 gap-3 md:gap-4">
                                <div className="flex items-center space-x-2">
                                    <p className="text-xs md:text-sm font-medium font-abel">Rows per page</p>
                                    <Select
                                        value={`${itemsPerPage}`}
                                        onValueChange={(value) => {
                                            const newPerPage = Number(value);
                                            setItemsPerPage(newPerPage);
                                            setCurrentPage(1); // Reset to first page when changing items per page
                                        }}
                                    >
                                        <SelectTrigger className="h-8 w-[60px] md:w-[70px] font-abel">
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

                                <div className="flex items-center space-x-2 md:space-x-6 lg:space-x-8">
                                    <div className="flex w-[80px] md:w-[100px] items-center justify-center text-xs md:text-sm font-medium font-abel">
                                        Page {currentPage} of {Math.ceil(memoizedTotalItems / itemsPerPage)}
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <Button
                                            variant="neutral"
                                            className="hidden md:flex h-8 w-8 p-0"
                                            onClick={() => {
                                                console.log('First page button clicked!');
                                                handlePageChange(1);
                                            }}
                                            disabled={currentPage === 1 || loading || memoizedTotalItems === 0}
                                        >
                                            <span className="sr-only">Go to first page</span>
                                            <ChevronsLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="neutral"
                                            className="h-8 w-8 p-0"
                                            onClick={() => {
                                                console.log('Previous button clicked!');
                                                handlePageChange(Math.max(1, currentPage - 1));
                                            }}
                                            disabled={currentPage === 1 || loading || memoizedTotalItems === 0}
                                        >
                                            <span className="sr-only">Go to previous page</span>
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="neutral"
                                            className="h-8 w-8 p-0"
                                            onClick={() => {
                                                console.log('Next button clicked!');
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
                                            className="hidden md:flex h-8 w-8 p-0"
                                            onClick={() => {
                                                console.log('Last page button clicked!');
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
                            <div className="flex flex-col md:flex-row items-center justify-between px-2 md:px-4 pb-3 md:pb-4 gap-2">
                                <div className="flex-1 text-xs md:text-sm text-muted-foreground font-abel text-center md:text-left">
                                    Showing {table.getRowModel().rows.length} of {memoizedTotalItems.toLocaleString()} results
                                </div>
                                <div className="text-xs md:text-sm text-muted-foreground font-abel">
                                    {table.getFilteredRowModel().rows.length} row(s) displayed.
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Informational Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
                {/* How to Use This Tool */}
                <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg font-abel text-blue-900">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                            </div>
                            How to Use This Tool
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4 pt-2">
                        <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm font-abel">
                            <div className="flex items-start gap-2 sm:gap-3">
                                <div className="flex-shrink-0 mt-0.5 sm:mt-1 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center rounded-full bg-blue-200 text-blue-700 font-bold text-xs">1</div>
                                <div>
                                    <p className="font-semibold text-gray-800">Enter Your Percentile</p>
                                    <p className="text-gray-600 text-xs">Type your MHT-CET percentile to see colleges in a -10% range.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 sm:gap-3">
                                <div className="flex-shrink-0 mt-0.5 sm:mt-1 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center rounded-full bg-blue-200 text-blue-700 font-bold text-xs">2</div>
                                <div>
                                    <p className="font-semibold text-gray-800">Filter Your Preferences</p>
                                    <p className="text-gray-600 text-xs">Select categories, courses, and seat types to narrow down results.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 sm:gap-3">
                                <div className="flex-shrink-0 mt-0.5 sm:mt-1 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center rounded-full bg-blue-200 text-blue-700 font-bold text-xs">3</div>
                                <div>
                                    <p className="font-semibold text-gray-800">Analyze & Strategize</p>
                                    <p className="text-gray-600 text-xs">Results are sorted by highest cutoff. Use this to plan your CAP round choices.</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
                            <p className="text-xs font-abel text-amber-900">
                                <span className="font-bold">Pro Tip:</span> The -10% range shows realistic options, helping you find colleges where you have a strong chance of admission.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Seat Allocation Types */}
                <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg font-abel text-purple-900">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                            </div>
                            Seat Allocation Types
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 sm:space-y-3 pt-2 text-xs sm:text-sm font-abel">
                        <div className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg bg-white border border-gray-200">
                            <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-gray-800">State Level</p>
                                <p className="text-xs text-gray-600">Open to all Maharashtra candidates.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg bg-white border border-gray-200">
                            <Building className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-gray-800">Home University</p>
                                <p className="text-xs text-gray-600">For students within the same university region.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg bg-white border border-gray-200">
                            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-gray-800">Other University</p>
                                <p className="text-xs text-gray-600">For students from different university regions.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Category and Code Legends */}
                <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100 shadow-sm hover:shadow-md transition-shadow duration-300 md:col-span-2 xl:col-span-1">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg font-abel text-emerald-900">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <BookUser className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                            </div>
                            Category & Code Legends
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <Accordion type="single" collapsible className="w-full space-y-3">
                            <AccordionItem value="item-1" className="border-none bg-gradient-to-br from-emerald-100/60 to-white shadow-lg rounded-xl overflow-hidden">
                                <AccordionTrigger className="font-abel text-sm sm:text-base font-semibold text-emerald-900 hover:no-underline px-4 py-3 bg-emerald-50/80 rounded-t-xl group transition-all duration-200">
                                    <div className="flex items-center gap-2">
                                        <Info className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 group-data-[state=open]:text-emerald-800 transition-colors" />
                                        <span>Category Code Format</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="font-abel text-xs sm:text-sm pb-3 bg-white rounded-b-xl border-t border-emerald-100/80 shadow-inner">
                                    <div className="space-y-2 p-3">
                                        <p><span className="font-bold">G</span> = General, <span className="font-bold">L</span> = Ladies</p>
                                        <p><span className="font-bold">H</span> = Home Uni, <span className="font-bold">O</span> = Other Uni, <span className="font-bold">S</span> = State</p>
                                        <p>Example: <span className="font-mono bg-gray-100 px-1 rounded text-xs">GOPENH</span> is General Open Home University.</p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2" className="border-none bg-gradient-to-br from-purple-100/60 to-white shadow-lg rounded-xl overflow-hidden">
                                <AccordionTrigger className="font-abel text-sm sm:text-base font-semibold text-purple-900 hover:no-underline px-4 py-3 bg-purple-50/80 rounded-t-xl group transition-all duration-200">
                                    <div className="flex items-center gap-2">
                                        <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 group-data-[state=open]:text-purple-800 transition-colors" />
                                        <span>Special Category Codes</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="font-abel text-xs sm:text-sm pb-3 bg-white rounded-b-xl border-t border-purple-100/80 shadow-inner">
                                    <div className="space-y-2 p-3">
                                        <p><span className="font-bold">TFWS:</span> Tuition Fee Waiver Scheme</p>
                                        <p><span className="font-bold">EWS:</span> Economically Weaker Section</p>
                                        <p><span className="font-bold">DEF:</span> Defence Reserved</p>
                                        <p><span className="font-bold">PWD:</span> Persons with Disability</p>
                                        <p><span className="font-bold">MI:</span> Minority Institutions</p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-3" className="border-none bg-gradient-to-br from-emerald-100/60 to-white shadow-lg rounded-xl overflow-hidden">
                                <AccordionTrigger className="font-abel text-sm sm:text-base font-semibold text-emerald-900 hover:no-underline px-4 py-3 bg-emerald-50/80 rounded-t-xl group transition-all duration-200">
                                    <div className="flex items-center gap-2">
                                        <Info className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 group-data-[state=open]:text-emerald-800 transition-colors" />
                                        <span>Video Explanation</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="font-abel text-xs sm:text-sm pb-3 bg-white rounded-b-xl border-t border-emerald-100/80 shadow-inner">
                                    <iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/1WA_Vh1jaU4?si=bBGUzsa5AoHX6ONh" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>
            </div>

            {/* Category Flow Chart */}
            <div className="mt-8 md:mt-12">
                <CategoryFlowChart />
            </div>
        </div>
    );
}
