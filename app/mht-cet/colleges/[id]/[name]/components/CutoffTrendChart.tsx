"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

type Props = {
  roundOneCutoffs: {
    'Serial Number': number;
    'ID': number;
    'College': string;
    'Branch': string;
    'Branch_id': string;
    'Status': string;
    'Allocation': string;
    'Category': string;
    'Cutoff': number;
    'Percentile': number;
    'City': string;
  }[];
}

const chartConfig = {
  percentile: {
    label: "Percentile Cutoff",
    color: "#2D3250",
  }
} satisfies ChartConfig

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <p className="font-mono text-sm">{data.branch}</p>
        <p className="font-bold text-lg">{data.percentile.toFixed(2)}%</p>
        <p className="text-xs text-gray-600">Status: {data.status}</p>
        <p className="text-xs text-gray-600">Seats: {data.allocation}</p>
      </div>
    );
  }
  return null;
};

export function CutoffTrendChart({ roundOneCutoffs }: Props) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("")
  
  const categories = React.useMemo(() => {
    const allCategories = new Set(roundOneCutoffs.map(c => c.Category))
    return Array.from(allCategories)
  }, [roundOneCutoffs])

  const chartData = React.useMemo(() => {
    if (!selectedCategory) return []

    return roundOneCutoffs
      .filter(c => c.Category === selectedCategory)
      .map(item => ({
        branch: item.Branch,
        percentile: item.Percentile,
        status: item.Status,
        allocation: item.Allocation
      }))
      .sort((a, b) => b.percentile - a.percentile)
  }, [selectedCategory, roundOneCutoffs])

  const averagePercentile = chartData.length > 0 
    ? (chartData.reduce((acc, curr) => acc + curr.percentile, 0) / chartData.length).toFixed(2)
    : 0

  return (
    <Card className="mt-6 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
      <CardHeader className="flex items-center gap-4 space-y-0 border-b-2 border-black py-6 sm:flex-row bg-yellow-50">
        <div className="grid flex-1 gap-2">
          <div className="flex items-center gap-3">
            <CardTitle className="text-3xl font-black font-mono">Branch Cutoffs</CardTitle>
            {selectedCategory && (
              <Badge variant="neutral" className="font-mono border-2 border-black px-3 py-1">
                {averagePercentile}% avg
              </Badge>
            )}
          </div>
          <CardDescription className="font-mono text-sm">
            {selectedCategory 
              ? `Showing ${chartData.length} branches for ${selectedCategory}`
              : 'Select a category to view cutoffs'}
          </CardDescription>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[280px] rounded-none border-2 border-black sm:ml-auto 
                                  font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] 
                                  hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] 
                                  transition-shadow">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent className="border-2 border-black rounded-none">
            {categories.map((category) => (
              <SelectItem key={category} value={category} className="font-mono">
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-6">
        {selectedCategory ? (
          <ResponsiveContainer width="100%" height={Math.max(400, chartData.length * 40)}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 20, right: 120, bottom: 20, left: 200 }}
            >
              <CartesianGrid horizontal strokeDasharray="4" />
              <YAxis
                dataKey="branch"
                type="category"
                width={180}
                tickLine={false}
                axisLine={true}
                fontSize={12}
                tick={{ fill: '#000000', fontFamily: 'monospace' }}
              />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                tick={{ fill: '#000000', fontFamily: 'monospace' }}
              />
              <ChartTooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(0,0,0,0.1)' }}
              />
              <Bar
                dataKey="percentile"
                fill="#2D3250"
                radius={[0, 4, 4, 0]}
              >
                <LabelList
                  dataKey="percentile"
                  position="right"
                  formatter={(value: number) => `${value.toFixed(2)}%`}
                  fill="#000000"
                  fontSize={12}
                  fontWeight="bold"
                  fontFamily="monospace"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed border-gray-300 rounded-lg">
            <p className="font-mono text-gray-500">👆 Select a category to view cutoffs</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}