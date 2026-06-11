import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getStoredToken } from '../../utils/api';

export const employeeApi = createApi({
  reducerPath: 'employeeApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000/api/employees',
    prepareHeaders: (headers) => {
      const token = getStoredToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Employee', 'Manager'],
  endpoints: (builder) => ({
    getAdminsAndManager:builder.query({
query:()=>'/admin',
providesTags:['Admins'],
    }),
    getEmployees: builder.query({
      query: () => '/',
      providesTags: ['Employee'],
    }),
    getManagers: builder.query({
      query: () => '/managers',
      providesTags: ['Manager'],
    }),
    createEmployee: builder.mutation({
      query: (newEmployee) => ({
        url: '/',
        method: 'POST',
        body: newEmployee,
      }),
      invalidatesTags: ['Employee', 'Manager'],
    }),
    deleteEmployee: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Employee', 'Manager'],
    }),
  }),
});

export const {
    useGetAdminsAndManagerQuery,
  useGetEmployeesQuery,
  useGetManagersQuery,
  useCreateEmployeeMutation,
  useDeleteEmployeeMutation,
} = employeeApi;

export default employeeApi;
