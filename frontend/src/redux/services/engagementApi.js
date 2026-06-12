import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getStoredToken } from '../../utils/api';

export const engagementApi = createApi({
  reducerPath: 'engagementApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000/api/engagements',
    prepareHeaders: (headers) => {
      const token = getStoredToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Engagement'],
  endpoints: (builder) => ({
    getEngagements: builder.query({
      query: () => '/',
      providesTags: ['Engagement'],
    }),
    createEngagement: builder.mutation({
      query: (newEngagement) => ({
        url: '/',
        method: 'POST',
        body: newEngagement,
      }),
      invalidatesTags: ['Engagement'],
    }),
    bulkCreateEngagements: builder.mutation({
      query: (engagementsData) => ({
        url: '/bulk',
        method: 'POST',
        body: { engagements: engagementsData },
      }),
      invalidatesTags: ['Engagement'],
    }),
    updateEngagement: builder.mutation({
      query: ({ id, ...updatedData }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: updatedData,
      }),
      invalidatesTags: ['Engagement'],
    }),
    markEngagementDone: builder.mutation({
      query: (id) => ({
        url: `/${id}/mark-done`,
        method: 'PUT',
      }),
      invalidatesTags: ['Engagement'],
    }),
  }),
});

export const {
  useGetEngagementsQuery,
  useCreateEngagementMutation,
  useUpdateEngagementMutation,
  useMarkEngagementDoneMutation,
  useBulkCreateEngagementsMutation,
} = engagementApi;

export default engagementApi;