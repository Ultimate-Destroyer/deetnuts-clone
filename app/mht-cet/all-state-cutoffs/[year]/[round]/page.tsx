// app/mht-cet/all-state-cutoffs/[year]/[round]/page.tsx
'use client';
import React, { useEffect, useState } from "react";
import { z } from "zod";
import { columns } from "../../components/columns";
import { DataTable } from "../../components/data-table";
import { taskSchema } from "../../data/schema";
import { Breadcrumbs } from "../../components/breadcrumb";
import { PercentileFilter } from "../../components/percentile-filter";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Download, TrendingUp, Users, Trophy, Target, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SortingState } from "@tanstack/react-table";

interface FilterState {
  minPercentile: number;
  maxPercentile: number;
  collegeFilter: string;
  courseFilter: string;
  categoryFilter: string;
  allocationFilter: string;
}

async function getMhtcet2024Cutoffs(
  round: string,
  page: number = 1,
  perPage: number = 25,
  isExport: boolean = false,
  sortState?: SortingState,
  filterState?: FilterState
) {
  try {
    // Format the round string for API request
    const formattedRound = round.toLowerCase().replace(/-/g, '_');

    // Start building the URL with mandatory parameters
    let url = `/api/mhtcet/cutoffs-2024?round=${formattedRound}`;

    // If exporting, request a large number of records
    if (isExport) {
      url += '&perPage=10000';
    } else {
      url += `&page=${page}&perPage=${perPage}`;
    }

    // Add sorting parameters if provided
    if (sortState && sortState.length > 0) {
      const { id, desc } = sortState[0];
      url += `&sortField=${id}&sortDirection=${desc ? 'desc' : 'asc'}`;
    }

    // Add filtering parameters if provided
    if (filterState) {
      if (filterState.minPercentile !== undefined && filterState.maxPercentile !== undefined) {
        // Apply ±1% wiggle room
        const minWithWiggle = Math.max(0, filterState.minPercentile - 1);
        const maxWithWiggle = Math.min(100, filterState.maxPercentile + 1);
        url += `&minPercentile=${minWithWiggle}&maxPercentile=${maxWithWiggle}`;
      }

      if (filterState.collegeFilter) {
        url += `&collegeFilter=${encodeURIComponent(filterState.collegeFilter)}`;
      }

      if (filterState.courseFilter) {
        url += `&courseFilter=${encodeURIComponent(filterState.courseFilter)}`;
      }

      if (filterState.categoryFilter) {
        url += `&categoryFilter=${encodeURIComponent(filterState.categoryFilter)}`;
      }

      if (filterState.allocationFilter) {
        url += `&allocationFilter=${encodeURIComponent(filterState.allocationFilter)}`;
      }
    }

    // Add debug logging for API responses
    console.log(`API URL: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch cutoff data");
    }

    const data = await response.json();
    console.log(`API response: ${data.totalItems} items found`);

    return {
      items: z.array(taskSchema).parse(data.items),
      totalItems: data.totalItems,
      totalPages: data.totalPages,
      page: data.page,
      perPage: data.perPage
    };
  } catch (error) {
    console.error("Error fetching MHTCET 2024 cutoffs:", error);
    return {
      items: [],
      totalItems: 0,
      totalPages: 0,
      page: 1,
      perPage: 25
    };
  }
}

export default function MhtcetStateCutoffsPage({
  params
}: {
  params: Promise<{ year: string; round: string }>
}) {
  // Use React.use() to unwrap the params promise
  const unwrappedParams = React.use(params);

  const [tasks, setTasks] = useState<z.infer<typeof taskSchema>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 25,
    totalItems: 0,
    totalPages: 0
  });

  // Sorting state
  const [sorting, setSorting] = useState<SortingState>([]);

  // Filter state - now using percentile-based filtering
  const [filters, setFilters] = useState<FilterState>({
    minPercentile: 0,
    maxPercentile: 100,
    collegeFilter: '',
    courseFilter: '',
    categoryFilter: '',
    allocationFilter: ''
  });

  const round = unwrappedParams.round || "round-one";

  // Load data with current pagination, sorting, and filtering
  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getMhtcet2024Cutoffs(
        round,
        pagination.page,
        pagination.perPage,
        false,
        sorting,
        filters
      );

      console.log("Received data from API:", {
        itemCount: data.items.length,
        totalItems: data.totalItems,
        totalPages: data.totalPages
      });

      // Ensure we have valid data before updating state
      if (data.items && Array.isArray(data.items)) {
        setTasks(data.items);
        setPagination({
          page: data.page,
          perPage: data.perPage,
          totalItems: data.totalItems,
          totalPages: data.totalPages || Math.ceil(data.totalItems / data.perPage)
        });
      } else {
        console.error("Invalid items data returned from API", data);
        setTasks([]);
        setError("Failed to process data from server.");
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load cutoff data. Please try again later.");
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [round, pagination.page, pagination.perPage, sorting, filters]);

  // Load data whenever dependencies change
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      if (!isMounted) return;
      await loadData();
    }

    fetchData();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [loadData]);

  // Handle page change from the data table
  const handlePageChange = (newPage: number, newPerPage: number) => {
    setPagination(prev => ({
      ...prev,
      page: newPage,
      perPage: newPerPage
    }));
  };

  // Handle sorting change
  const handleSortingChange = (newSorting: SortingState) => {
    setSorting(newSorting);
    // Reset to first page when sorting changes
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  // Handle data table filter changes (for faceted filters)
  const handleDataTableFiltersChange = (newFilters: {
    collegeFilter: string;
    branchFilter: string[];
    categoryFilter: string[];
    allocationFilter: string[];
  }) => {
    // Convert arrays to comma-separated strings for API
    const updatedFilters: FilterState = {
      ...filters,
      collegeFilter: newFilters.collegeFilter,
      courseFilter: newFilters.branchFilter.join(','),
      categoryFilter: newFilters.categoryFilter.join(','),
      allocationFilter: newFilters.allocationFilter.join(',')
    };

    setFilters(updatedFilters);

    // Reset to first page when filters change
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  // Save filters to localStorage to persist across page refreshes
  const FILTER_STORAGE_KEY = `mhtcet-filters-2024-${round}`;

  // Load saved filters from localStorage on initial mount
  React.useEffect(() => {
    const savedFilters = localStorage.getItem(FILTER_STORAGE_KEY);
    if (savedFilters) {
      try {
        const parsedFilters = JSON.parse(savedFilters);
        setFilters(parsedFilters);
      } catch (e) {
        console.error("Error parsing saved filters:", e);
      }
    }
  }, [FILTER_STORAGE_KEY]);

  // Handle filter change with persisting to localStorage
  const handleFilterChange = (newFilters: FilterState) => {
    console.log("Filter changed:", newFilters);

    // Save to localStorage
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(newFilters));

    // Update local filter state
    setFilters(newFilters);

    // Reset to first page when filters change
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  // Export data to CSV
  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      // Fetch all data with current filters and sorting
      const data = await getMhtcet2024Cutoffs(
        round,
        1,
        10000,
        true,
        sorting,
        filters
      );

      if (!data.items || data.items.length === 0) {
        setError("No data available to export.");
        return;
      }

      // Create CSV content
      const headers = Object.keys(data.items[0] || {}).filter(key => key !== 'id');
      const csvContent = [
        headers.join(','),
        ...data.items.map((item: any) => {
          return headers.map(header => {
            // Handle commas in strings by surrounding with quotes
            const value = item[header as keyof typeof item];
            return typeof value === 'string' && value.includes(',')
              ? `"${value}"`
              : value;
          }).join(',');
        })
      ].join('\n');

      // Create a blob and download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `mhtcet-cutoffs-2024-${round}.csv`;

      // Add to document, click, and clean up safely
      document.body.appendChild(a);
      a.click();

      // Clean up after a short delay to ensure download starts
      setTimeout(() => {
        if (a.parentNode) {
          document.body.removeChild(a);
        }
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error("Export error:", err);
      setError("Failed to export data. Please try again later.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Neobrutalism Header */}
      <div className="bg-white border-b-2 border-black">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
            {/* Title Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-main border-2 border-black rounded-base shadow-base">
                  <Target className="h-6 w-6 text-black" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-heading text-black">
                    MHTCET 2024 State Cutoffs
                  </h1>
                  <Badge variant="default" className="mt-2">
                    {round.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                </div>
              </div>
              <Breadcrumbs />
              <p className="text-black max-w-2xl font-base">
                🎯 Explore engineering cutoff scores with intelligent filtering. Find your perfect college match!
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              {pagination.totalItems > 0 && (
                <div className="bg-white border-2 border-black rounded-base p-4 shadow-base">
                  <p className="text-sm text-black font-base">Total Records</p>
                  <p className="text-2xl font-heading text-black">{pagination.totalItems.toLocaleString()}</p>
                </div>
              )}
              <Button
                onClick={exportToCSV}
                disabled={isExporting || isLoading || tasks.length === 0}
                variant="neutral"
                className="h-fit"
              >
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? "Exporting..." : "Export CSV"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Filter Section */}
        <div className="mb-8">
          <PercentileFilter
            onFilterApply={handleFilterChange}
            isLoading={isLoading}
          />
        </div>

        {/* Disclaimer Alert - Only show when not loading and has data */}
        {!isLoading && tasks.length > 0 && (
          <div className="mb-6 bg-yellow-100 border-2 border-black rounded-base p-4 shadow-base">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-black mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-heading text-black mb-1">⚠️ Data Disclaimer</h4>
                <p className="text-black text-sm font-base">
                  This data is for informational purposes only. Always verify with official MHTCET sources before making decisions.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-100 border-2 border-black rounded-base p-4 shadow-base">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-black mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-heading text-black mb-1">❌ Error</h4>
                <p className="text-black text-sm font-base">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Data Section */}
        <div className="bg-white border-2 border-black rounded-base shadow-base overflow-hidden">
          {isLoading ? (
            // Loading State
            <div className="py-16 text-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-4 text-black">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent"></div>
                  <span className="text-xl font-heading">Loading cutoff data...</span>
                </div>
                <div className="max-w-md mx-auto bg-main border-2 border-black rounded-base p-4">
                  <p className="text-black font-base">🔍 Searching through thousands of records to find your perfect match!</p>
                </div>
              </div>
            </div>
          ) : tasks.length > 0 ? (
            // Data State
            <div>
              {/* Results Header */}
              <div className="p-4 bg-main border-b-2 border-black">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <h3 className="font-heading text-black text-lg">
                      📊 Showing {tasks.length} of {pagination.totalItems.toLocaleString()} results
                    </h3>
                    <p className="text-black font-base">
                      Page {pagination.page} of {pagination.totalPages}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Badge variant="default">
                      {tasks.length} records
                    </Badge>
                    <Badge variant="neutral">
                      {pagination.perPage} per page
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white">
                <DataTable
                  data={tasks}
                  columns={columns}
                  pagination={pagination}
                  onPaginationChange={handlePageChange}
                  sorting={sorting}
                  onSortingChange={handleSortingChange}
                  onFiltersChange={handleDataTableFiltersChange}
                />
              </div>
            </div>
          ) : !error ? (
            // Empty State
            <div className="py-20 text-center">
              <div className="space-y-6">
                <div className="mx-auto w-20 h-20 bg-main border-2 border-black rounded-base flex items-center justify-center shadow-base">
                  <Target className="h-10 w-10 text-black" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-heading text-black">🔍 No cutoff data found</h3>
                  <div className="max-w-md mx-auto bg-yellow-100 border-2 border-black rounded-base p-4">
                    <p className="text-black font-base">
                      No records match your current filter criteria. Try adjusting your percentile range or removing filters.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    // Reset all filters
                    handleFilterChange({
                      minPercentile: 0,
                      maxPercentile: 100,
                      collegeFilter: '',
                      courseFilter: '',
                      categoryFilter: '',
                      allocationFilter: ''
                    });
                  }}
                  variant="default"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  🔄 Clear All Filters
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
