import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { DataTable } from '@/components/admin/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import toast from 'react-hot-toast';

interface AdminReview {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  is_approved: boolean;
  created_at: string;
  product_name: string;
  user_name: string;
}

export function AdminReviews() {
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*, product:products(name), user:profiles(full_name)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data ?? []).map((r: any) => ({
        ...r,
        product_name: r.product?.name?.en ?? 'Unknown',
        user_name: r.user?.full_name ?? 'Anonymous',
      })) as AdminReview[];
    },
  });

  const toggleApproval = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await supabase
        .from('product_reviews')
        .update({ is_approved: approved })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success('Review status updated');
    },
    onError: () => {
      toast.error('Failed to update review');
    },
  });

  const deleteReview = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_reviews')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success('Review deleted');
    },
    onError: () => {
      toast.error('Failed to delete review');
    },
  });

  const columns = useMemo<ColumnDef<AdminReview, any>[]>(() => [
    {
      accessorKey: 'product_name',
      header: 'Product',
      cell: (info) => (
        <span className="font-medium text-gray-900 max-w-[200px] truncate block">
          {info.getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: 'user_name',
      header: 'Customer',
    },
    {
      accessorKey: 'rating',
      header: 'Rating',
      cell: (info) => {
        const val = info.getValue() as number;
        return (
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <svg key={s} className={`w-4 h-4 ${s <= val ? 'text-amber-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: (info) => (
        <span className="text-gray-600 max-w-[200px] truncate block">
          {(info.getValue() as string) || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'is_approved',
      header: 'Status',
      cell: (info) => {
        const approved = info.getValue() as boolean;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {approved ? 'Approved' : 'Pending'}
          </span>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: (info) => new Date(info.getValue() as string).toLocaleDateString(),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const review = row.original;
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleApproval.mutate({ id: review.id, approved: !review.is_approved })}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                review.is_approved
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {review.is_approved ? 'Revoke' : 'Approve'}
            </button>
            <button
              onClick={() => {
                if (window.confirm('Delete this review?')) {
                  deleteReview.mutate(review.id);
                }
              }}
              className="px-3 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
            >
              Delete
            </button>
          </div>
        );
      },
    },
  ], [toggleApproval, deleteReview]);

  const pendingCount = reviews.filter((r) => !r.is_approved).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Reviews</h1>
          <p className="text-sm text-gray-500 mt-1">
            {reviews.length} reviews total, {pendingCount} pending approval
          </p>
        </div>
      </div>

      <DataTable
        data={reviews}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No reviews yet."
        pageSize={20}
      />
    </div>
  );
}
