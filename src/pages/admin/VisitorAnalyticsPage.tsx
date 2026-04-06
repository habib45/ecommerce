import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { DataTable } from '@/components/admin/DataTable';
import type { ColumnDef } from '@tanstack/react-table';

interface VisitorStats {
  id: string;
  date: string;
  visitors: number;
  page_views: number;
  unique_visitors: number;
  bounce_rate: number;
  avg_session_duration: number;
}

export function AdminVisitorAnalytics() {
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    return {
      start: oneMonthAgo.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0],
    };
  });

  const { data: stats = [], isLoading } = useQuery({
    queryKey: ['visitor-analytics', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visitor_analytics')
        .select('*')
        .gte('date', dateRange.start)
        .lte('date', dateRange.end)
        .order('date', { ascending: false });

      if (error) {
        console.error('Visitor analytics query error:', error);
        throw error;
      }

      return (data ?? []) as VisitorStats[];
    },
  });

  const columns = useMemo<ColumnDef<VisitorStats, any>[]>(() => [
    {
      accessorKey: 'date',
      header: 'Date',
      cell: (info) => {
        const date = new Date(info.getValue() as string);
        return date.toLocaleDateString();
      },
      enableSorting: true,
    },
    {
      accessorKey: 'visitors',
      header: 'Visitors',
      cell: (info) => {
        const value = info.getValue() as number;
        return <span className="font-semibold text-blue-600">{value.toLocaleString()}</span>;
      },
      meta: { className: 'text-center' },
      enableSorting: true,
    },
    {
      accessorKey: 'page_views',
      header: 'Page Views',
      cell: (info) => {
        const value = info.getValue() as number;
        return <span className="font-semibold text-green-600">{value.toLocaleString()}</span>;
      },
      meta: { className: 'text-center' },
      enableSorting: true,
    },
    {
      accessorKey: 'unique_visitors',
      header: 'Unique Visitors',
      cell: (info) => {
        const value = info.getValue() as number;
        return <span className="font-semibold text-purple-600">{value.toLocaleString()}</span>;
      },
      meta: { className: 'text-center' },
      enableSorting: true,
    },
    {
      accessorKey: 'bounce_rate',
      header: 'Bounce Rate',
      cell: (info) => {
        const value = info.getValue() as number;
        return (
          <span className={`font-semibold ${value > 70 ? 'text-red-500' : value > 50 ? 'text-orange-500' : 'text-green-600'}`}>
            {value.toFixed(1)}%
          </span>
        );
      },
      meta: { className: 'text-center' },
      enableSorting: true,
    },
    {
      accessorKey: 'avg_session_duration',
      header: 'Avg Session',
      cell: (info) => {
        const value = info.getValue() as number;
        const minutes = Math.floor(value / 60);
        const seconds = Math.floor(value % 60);
        return (
          <span className="font-medium text-gray-700">
            {minutes}m {seconds}s
          </span>
        );
      },
      meta: { className: 'text-center' },
      enableSorting: true,
    },
  ], []);

  const totalStats = useMemo(() => {
    if (stats.length === 0) return { visitors: 0, pageViews: 0, uniqueVisitors: 0 };
    
    return {
      visitors: stats.reduce((sum, s) => sum + s.visitors, 0),
      pageViews: stats.reduce((sum, s) => sum + s.page_views, 0),
      uniqueVisitors: stats.reduce((sum, s) => sum + s.unique_visitors, 0),
    };
  }, [stats]);

  const avgBounceRate = useMemo(() => {
    if (stats.length === 0) return 0;
    const total = stats.reduce((sum, s) => sum + s.bounce_rate, 0);
    return total / stats.length;
  }, [stats]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visitor Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            {stats.length} days of data from {dateRange.start} to {dateRange.end}
          </p>
        </div>
        <div className="flex gap-4">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Total Visitors</div>
          <div className="text-2xl font-bold text-blue-600 mt-2">
            {totalStats.visitors.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Total Page Views</div>
          <div className="text-2xl font-bold text-green-600 mt-2">
            {totalStats.pageViews.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Unique Visitors</div>
          <div className="text-2xl font-bold text-purple-600 mt-2">
            {totalStats.uniqueVisitors.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Avg Bounce Rate</div>
          <div className="text-2xl font-bold text-orange-600 mt-2">
            {avgBounceRate.toFixed(1)}%
          </div>
        </div>
      </div>

      <DataTable
        data={stats}
        columns={columns}
        isLoading={isLoading}
        clientSearch={false}
        emptyMessage="No visitor data found for the selected date range"
        pageSize={31}
      />
    </div>
  );
}
