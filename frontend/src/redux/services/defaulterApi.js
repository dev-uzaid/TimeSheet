import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getStoredToken, BASE_URL } from '../../utils/api';

export const defaulterApi = createApi({
  reducerPath: 'defaulterApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${BASE_URL}/defaulters`,
    prepareHeaders: (headers) => {
      const token = getStoredToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Defaulter'],
  endpoints: (builder) => ({
    getDefaulters: builder.query({
      query: (params) => ({
        url: '/',
        params
      }),
      providesTags: ['Defaulter']
    }),
    runAudit: builder.mutation({
      query: (payload) => ({
        url: '/run',
        method: 'POST',
        body: payload
      }),
      invalidatesTags: ['Defaulter']
    }),
    deleteDefaulter: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Defaulter']
    })
  })
});

export const {
  useGetDefaultersQuery,
  useRunAuditMutation,
  useDeleteDefaulterMutation
} = defaulterApi;

export default defaulterApi;
