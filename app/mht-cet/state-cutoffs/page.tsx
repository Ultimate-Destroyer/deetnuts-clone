'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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

const ITEMS_PER_PAGE_OPTIONS = [25, 50, 100, 200];

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

export default function StateCutoffsPage() {
    const [records, setRecords] = useState<CutoffRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalItems, setTotalItems] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [filters, setFilters] = useState<FilterState>({
        search: '',
        categories: [],
        seatAllocations: [],
        courses: [],
        percentileInput: '',
        sortBy: 'last_rank',
        sortOrder: 'desc'
    });

    // Table state
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [isSearching, setIsSearching] = useState(false)
    const [isFilteringPercentile, setIsFilteringPercentile] = useState(false)

    // Debounced search and filters
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [debouncedPercentile, setDebouncedPercentile] = useState('');
    const [percentileInput, setPercentileInput] = useState('');

    // Define columns for the enhanced table with consistent widths and hover tooltips
    const columns: ColumnDef<CutoffRecord>[] = useMemo(
        () => [
            {
                accessorKey: "college_name",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="link"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="h-8 px-2 lg:px-3"
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
                                <div className="font-semibold max-w-[250px] truncate cursor-help text-sm">
                                    {row.getValue("college_name")}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-sm">{row.getValue("college_name")}</p>
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
                            className="h-8 px-2 lg:px-3"
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
                                <div className="font-medium max-w-[200px] truncate cursor-help text-sm">
                                    {row.getValue("course_name")}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-sm">{row.getValue("course_name")}</p>
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
                            className="h-8 px-2 lg:px-3"
                        >
                            Category
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    )
                },
                cell: ({ row }) => (
                    <Badge variant="neutral" className="font-mono text-xs w-fit font-semibold">
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
                            className="h-8 px-2 lg:px-3"
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
                        <div className="text-right font-mono font-bold w-[80px] text-sm">
                            {isNaN(numRank) ? rank : numRank.toLocaleString()}
                        </div>
                    );
                },
                size: 80,
            },
            {
                id: "percentile",
                header: "Percentile",
                cell: ({ row }) => {
                    const rank = row.getValue("last_rank") as string;
                    const percentile = calculatePercentile(rank);
                    return (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="text-right font-mono font-semibold w-[80px] text-sm cursor-help">
                                        {percentile.toFixed(2)}%
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Exact: {percentile.toFixed(4)}%</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                },
                size: 80,
            },
            {
                accessorKey: "seat_allocation_section",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="link"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="h-8 px-2 lg:px-3"
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
                                    <div className="text-xs max-w-[120px] truncate cursor-help font-medium">
                                        {label}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{label}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                },
                size: 120,
            },
            {
                accessorKey: "cutoff_score",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="link"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="h-8 px-2 lg:px-3"
                        >
                            Score
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    )
                },
                cell: ({ row }) => (
                    <div className="text-right font-mono font-bold w-[70px] text-sm">
                        {row.getValue("cutoff_score")}
                    </div>
                ),
                size: 70,
            },
            {
                accessorKey: "total_admitted",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="link"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="h-8 px-2 lg:px-3"
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
                                    <div className="text-right w-[80px] font-semibold text-sm cursor-help">
                                        {value.toLocaleString()}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{value} students admitted</p>
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
                            className="h-8 px-2 lg:px-3"
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
                                <div className="font-mono text-xs w-[90px] font-semibold cursor-help">
                                    {row.getValue("college_code")}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>College Code: {row.getValue("college_code")}</p>
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
                            className="h-8 px-2 lg:px-3"
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
                                <div className="font-mono text-xs w-[90px] font-semibold cursor-help">
                                    {row.getValue("course_code")}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Course Code: {row.getValue("course_code")}</p>
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
        data: records,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
        },
        initialState: {
            pagination: {
                pageSize: itemsPerPage,
            },
        },
    });

    useEffect(() => {
        if (searchInput) setIsSearching(true);
        const timer = setTimeout(() => {
            setDebouncedSearch(searchInput);
            setIsSearching(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        if (percentileInput) setIsFilteringPercentile(true);
        const timer = setTimeout(() => {
            setDebouncedPercentile(percentileInput);
            setIsFilteringPercentile(false);
        }, 800);
        return () => clearTimeout(timer);
    }, [percentileInput]);

    useEffect(() => {
        setFilters(prev => ({ ...prev, search: debouncedSearch }));
        setCurrentPage(1);
    }, [debouncedSearch]);

    useEffect(() => {
        setFilters(prev => ({ ...prev, percentileInput: debouncedPercentile }));
        setCurrentPage(1);
    }, [debouncedPercentile]);

    useEffect(() => {
        table.setPageSize(itemsPerPage);
    }, [itemsPerPage, table]); const fetchRecords = useCallback(async () => {
        setLoading(true);
        try {
            // Build query parameters
            const params = new URLSearchParams({
                page: currentPage.toString(),
                perPage: itemsPerPage.toString(),
                search: filters.search,
                categories: filters.categories.join(','),
                seatAllocations: filters.seatAllocations.join(','),
                courses: filters.courses.join(','),
                percentileInput: filters.percentileInput,
                sortBy: filters.sortBy,
                sortOrder: filters.sortOrder
            });

            const response = await fetch(`/api/mht-cet/state-cutoffs?${params}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch data');
            }

            setRecords(result.data);
            setTotalItems(result.totalItems);

            // Show notification if using mock data
            if (result.note) {
                toast.info(result.note);
            }
        } catch (error) {
            console.error('Error fetching records:', error);
            toast.error('Failed to fetch cutoff data');
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, filters]);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const handleCategoryToggle = useCallback((category: string) => {
        setFilters(prev => ({
            ...prev,
            categories: prev.categories.includes(category)
                ? prev.categories.filter(c => c !== category)
                : [...prev.categories, category]
        }));
        setCurrentPage(1);
    }, []);

    const handleSeatAllocationToggle = useCallback((seatAllocation: string) => {
        setFilters(prev => ({
            ...prev,
            seatAllocations: prev.seatAllocations.includes(seatAllocation)
                ? prev.seatAllocations.filter(s => s !== seatAllocation)
                : [...prev.seatAllocations, seatAllocation]
        }));
        setCurrentPage(1);
    }, []);

    const clearAllFilters = () => {
        setFilters({
            search: '',
            categories: [],
            seatAllocations: [],
            courses: [],
            percentileInput: '',
            sortBy: 'last_rank',
            sortOrder: 'desc'
        });
        setSearchInput('');
        setPercentileInput('');
        setCurrentPage(1);
    };

    return (
        <div className="container mx-auto py-32 px-4 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                        MHT-CET State Cutoffs 2024
                    </h1>
                    <p className="text-muted-foreground text-lg font-medium mt-2">
                        Round 1 cutoffs for engineering colleges
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="neutral" onClick={fetchRecords} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Search with loading indicator */}
                    <div className="relative">
                        {isSearching ? (
                            <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
                        ) : (
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        )}
                        <Input
                            placeholder="Search colleges, courses..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                        {/* Target Percentile Input with loading */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                                Target Percentile (±1% range)
                                {isFilteringPercentile && <Loader2 className="h-3 w-3 animate-spin" />}
                            </Label>
                            <Input
                                placeholder="Enter percentile (e.g., 95.5432)"
                                value={percentileInput}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    // Allow numbers and decimal point
                                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                        const numValue = parseFloat(value);
                                        if (value === '' || (numValue >= 0 && numValue <= 100)) {
                                            setPercentileInput(value);
                                        }
                                    }
                                }}
                                type="text"
                                className={isFilteringPercentile ? "border-blue-300" : ""}
                            />
                            {percentileInput && (
                                <p className="text-xs text-muted-foreground">
                                    Will show percentiles from {Math.max(0, parseFloat(percentileInput) - 1).toFixed(1)}% to {Math.min(100, parseFloat(percentileInput) + 1).toFixed(1)}%
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Enhanced Category Filter */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="neutral" className="justify-between h-10">
                                    <span>Categories</span>
                                    <div className="flex items-center gap-2">
                                        {filters.categories.length > 0 && (
                                            <Badge variant="neutral" className="ml-2 text-xs px-2 py-0">
                                                {filters.categories.length}
                                            </Badge>
                                        )}
                                        <Filter className="h-4 w-4" />
                                    </div>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-96 p-0">
                                <div className="p-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-medium">Select Categories</h4>
                                        <Button
                                            variant="link"
                                            size="sm"
                                            onClick={() => {
                                                setFilters(prev => ({ ...prev, categories: [] }));
                                                setCurrentPage(1);
                                            }}
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
                                                    <Label className="text-sm font-medium text-foreground">{group}</Label>
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="h-auto p-0 text-xs"
                                                        onClick={() => {
                                                            const allSelected = categories.every(cat => filters.categories.includes(cat));
                                                            if (allSelected) {
                                                                setFilters(prev => ({
                                                                    ...prev,
                                                                    categories: prev.categories.filter(c => !categories.includes(c))
                                                                }));
                                                            } else {
                                                                setFilters(prev => ({
                                                                    ...prev,
                                                                    categories: [...new Set([...prev.categories, ...categories])]
                                                                }));
                                                            }
                                                            setCurrentPage(1);
                                                        }}
                                                    >
                                                        {categories.every(cat => filters.categories.includes(cat)) ? 'Deselect All' : 'Select All'}
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {categories.map((category) => (
                                                        <div key={category} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={category}
                                                                checked={filters.categories.includes(category)}
                                                                onCheckedChange={() => handleCategoryToggle(category)}
                                                            />
                                                            <Label htmlFor={category} className="text-xs font-mono cursor-pointer">
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
                                <Button variant="neutral" className="justify-between h-10">
                                    <span>Courses</span>
                                    <div className="flex items-center gap-2">
                                        {filters.courses.length > 0 && (
                                            <Badge variant="neutral" className="ml-2 text-xs px-2 py-0">
                                                {filters.courses.length}
                                            </Badge>
                                        )}
                                        <Filter className="h-4 w-4" />
                                    </div>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-96 p-0">
                                <div className="p-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-medium">Select Courses</h4>
                                        <Button
                                            variant="link"
                                            size="sm"
                                            onClick={() => {
                                                setFilters(prev => ({ ...prev, courses: [] }));
                                                setCurrentPage(1);
                                            }}
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
                                                    <Label className="text-sm font-medium text-foreground">{group}</Label>
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="h-auto p-0 text-xs"
                                                        onClick={() => {
                                                            const allSelected = courses.every(course => filters.courses.includes(course));
                                                            if (allSelected) {
                                                                setFilters(prev => ({
                                                                    ...prev,
                                                                    courses: prev.courses.filter(c => !courses.includes(c))
                                                                }));
                                                            } else {
                                                                setFilters(prev => ({
                                                                    ...prev,
                                                                    courses: [...new Set([...prev.courses, ...courses])]
                                                                }));
                                                            }
                                                            setCurrentPage(1);
                                                        }}
                                                    >
                                                        {courses.every(course => filters.courses.includes(course)) ? 'Deselect All' : 'Select All'}
                                                    </Button>
                                                </div>
                                                <div className="space-y-1">
                                                    {courses.map((course) => (
                                                        <div key={course} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={course}
                                                                checked={filters.courses.includes(course)}
                                                                onCheckedChange={() => {
                                                                    setFilters(prev => ({
                                                                        ...prev,
                                                                        courses: prev.courses.includes(course)
                                                                            ? prev.courses.filter(c => c !== course)
                                                                            : [...prev.courses, course]
                                                                    }));
                                                                    setCurrentPage(1);
                                                                }}
                                                            />
                                                            <Label htmlFor={course} className="text-xs cursor-pointer leading-tight">
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
                                <Button variant="neutral" className="justify-between h-10">
                                    <span>Seat Allocation</span>
                                    <div className="flex items-center gap-2">
                                        {filters.seatAllocations.length > 0 && (
                                            <Badge variant="neutral" className="ml-2 text-xs px-2 py-0">
                                                {filters.seatAllocations.length}
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
                                                checked={filters.seatAllocations.includes(option.value)}
                                                onCheckedChange={() => handleSeatAllocationToggle(option.value)}
                                            />
                                            <Label htmlFor={option.value} className="text-sm">
                                                {option.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Active Filters & Clear with improved styling */}
                    {(filters.categories.length > 0 || filters.seatAllocations.length > 0 || filters.courses.length > 0 ||
                        filters.search || filters.percentileInput) && (
                            <div className="flex flex-wrap gap-2 items-center p-3 bg-muted/30 rounded-lg">
                                <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
                                {filters.search && (
                                    <Badge variant="neutral" className="bg-blue-50 border-blue-200 text-blue-800">
                                        Search: {filters.search}
                                    </Badge>
                                )}
                                {filters.categories.map(cat => {
                                    // Check if all categories in a group are selected
                                    const categoryGroup = Object.entries(CATEGORY_GROUPS).find(([group, categories]) =>
                                        categories.includes(cat)
                                    );
                                    const isGroupFullySelected = categoryGroup &&
                                        categoryGroup[1].every(c => filters.categories.includes(c));

                                    return (
                                        <Badge
                                            key={cat}
                                            variant="neutral"
                                            className={isGroupFullySelected ? "bg-blue-50 border-blue-200 text-blue-800" : ""}
                                        >
                                            {cat}
                                        </Badge>
                                    );
                                })}
                                {filters.courses.map(course => {
                                    // Check if all courses in a group are selected
                                    const courseGroup = Object.entries(COURSE_GROUPS).find(([group, courses]) =>
                                        courses.includes(course)
                                    );
                                    const isGroupFullySelected = courseGroup &&
                                        courseGroup[1].every(c => filters.courses.includes(c));

                                    return (
                                        <Badge
                                            key={course}
                                            variant="neutral"
                                            className={isGroupFullySelected ? "bg-green-50 border-green-200 text-green-800" : ""}
                                        >
                                            {course}
                                        </Badge>
                                    );
                                })}
                                {filters.seatAllocations.map(seat => {
                                    const isAllSeatAllocationsSelected = SEAT_ALLOCATION_OPTIONS.length === filters.seatAllocations.length;

                                    return (
                                        <Badge
                                            key={seat}
                                            variant="neutral"
                                            className={isAllSeatAllocationsSelected ? "bg-purple-50 border-purple-200 text-purple-800" : ""}
                                        >
                                            {SEAT_ALLOCATION_OPTIONS.find(s => s.value === seat)?.label}
                                        </Badge>
                                    );
                                })}
                                {filters.percentileInput && (
                                    <Badge variant="neutral" className="bg-orange-50 border-orange-200 text-orange-800">
                                        Percentile: {Math.max(0, parseFloat(filters.percentileInput) - 1).toFixed(1)}% - {Math.min(100, parseFloat(filters.percentileInput) + 1).toFixed(1)}%
                                    </Badge>
                                )}
                                <Button variant="link" size="sm" onClick={clearAllFilters} className="text-red-600 hover:text-red-800">
                                    Clear All
                                </Button>
                            </div>
                        )}
                </CardContent>
            </Card>

            {/* Compact Results Summary */}
            <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-md">
                    <span className="font-medium">{totalItems.toLocaleString()}</span>
                    <span className="text-muted-foreground">total</span>
                </div>
                <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-md">
                    <span className="font-medium">{records.length}</span>
                    <span className="text-muted-foreground">showing</span>
                </div>
                <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-md">
                    <span className="font-medium">{filters.categories.length}</span>
                    <span className="text-muted-foreground">categories</span>
                </div>
                <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-md">
                    <span className="font-medium">{filters.percentileInput ? '±1%' : 'All'}</span>
                    <span className="text-muted-foreground">percentile</span>
                </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems.toLocaleString()} results
                </p>
                <div className="flex items-center gap-2">
                    <span className="text-sm">Rows per page:</span>
                    <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) => {
                            setItemsPerPage(parseInt(value));
                            setCurrentPage(1);
                        }}
                    >
                        <SelectTrigger className="w-20">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {ITEMS_PER_PAGE_OPTIONS.map(option => (
                                <SelectItem key={option} value={option.toString()}>
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
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 space-y-4">
                            <div className="relative">
                                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                                <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-blue-100"></div>
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-lg font-medium">Loading Cutoff Data</h3>
                                <p className="text-sm text-muted-foreground">
                                    Fetching the latest MHT-CET state cutoffs...
                                </p>
                                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
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
                                <Table>
                                    <TableHeader>
                                        {table.getHeaderGroups().map((headerGroup) => (
                                            <TableRow key={headerGroup.id} className="h-12 bg-muted/30">
                                                {headerGroup.headers.map((header) => {
                                                    return (
                                                        <TableHead
                                                            key={header.id}
                                                            className="h-12 font-semibold"
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
                                                            className="py-2 h-14"
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
                                                        <span>No cutoff data found matching your criteria</span>
                                                        <span className="text-xs">Try adjusting your filters</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Enhanced Pagination */}
                            <div className="flex items-center justify-between px-4 py-2">
                                <div className="flex items-center space-x-2">
                                    <p className="text-sm font-medium">Rows per page</p>
                                    <Select
                                        value={`${table.getState().pagination.pageSize}`}
                                        onValueChange={(value) => {
                                            table.setPageSize(Number(value))
                                            setItemsPerPage(Number(value))
                                        }}
                                    >
                                        <SelectTrigger className="h-8 w-[70px]">
                                            <SelectValue placeholder={table.getState().pagination.pageSize} />
                                        </SelectTrigger>
                                        <SelectContent side="top">
                                            {ITEMS_PER_PAGE_OPTIONS.map((pageSize) => (
                                                <SelectItem key={pageSize} value={`${pageSize}`}>
                                                    {pageSize}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center space-x-6 lg:space-x-8">
                                    <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                                        Page {table.getState().pagination.pageIndex + 1} of{" "}
                                        {table.getPageCount()}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="neutral"
                                            className="hidden h-8 w-8 p-0 lg:flex"
                                            onClick={() => table.setPageIndex(0)}
                                            disabled={!table.getCanPreviousPage()}
                                        >
                                            <span className="sr-only">Go to first page</span>
                                            <ChevronsLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="neutral"
                                            className="h-8 w-8 p-0"
                                            onClick={() => table.previousPage()}
                                            disabled={!table.getCanPreviousPage()}
                                        >
                                            <span className="sr-only">Go to previous page</span>
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="neutral"
                                            className="h-8 w-8 p-0"
                                            onClick={() => table.nextPage()}
                                            disabled={!table.getCanNextPage()}
                                        >
                                            <span className="sr-only">Go to next page</span>
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="neutral"
                                            className="hidden h-8 w-8 p-0 lg:flex"
                                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                            disabled={!table.getCanNextPage()}
                                        >
                                            <span className="sr-only">Go to last page</span>
                                            <ChevronsRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Table Info */}
                            <div className="flex items-center justify-between px-4 pb-4">
                                <div className="flex-1 text-sm text-muted-foreground">
                                    Showing {table.getRowModel().rows.length} of {totalItems.toLocaleString()} results
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {table.getFilteredRowModel().rows.length} row(s) displayed.
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
