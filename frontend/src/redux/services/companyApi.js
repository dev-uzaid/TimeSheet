import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../utils/api";

export const companyApi = createApi({
  reducerPath: "companyApi",

  baseQuery: fetchBaseQuery({
    baseUrl: `${BASE_URL}/companies`,
  }),

  tagTypes: ["Company"],

  endpoints: (builder) => ({
    // GET ALL COMPANIES
    getCompanies: builder.query({
      query: () => "/",
      providesTags: ["Company"],
    }),

    // GET SINGLE COMPANY
    getCompany: builder.query({
      query: (id) => `/${id}`,
      providesTags: ["Company"],
    }),

    // CREATE COMPANY
    createCompany: builder.mutation({
      query: (companyData) => ({
        url: "/",
        method: "POST",
        body: companyData,
      }),
      invalidatesTags: ["Company"],
    }),

    // UPDATE COMPANY
    updateCompany: builder.mutation({
      query: ({ id, companyData }) => ({
        url: `/${id}`,
        method: "PUT",
        body: companyData,
      }),
      invalidatesTags: ["Company"],
    }),

    // DELETE COMPANY
    deleteCompany: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Company"],
    }),
  }),
});

export const {
  useGetCompaniesQuery,
  useGetCompanyQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useDeleteCompanyMutation,
} = companyApi;

export default companyApi;