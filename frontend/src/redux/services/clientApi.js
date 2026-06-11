import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const clientApi = createApi({
  reducerPath: "clientApi",

  tagTypes: ["Clients"],

  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:5000/api/clients",

    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),

  endpoints: (builder) => ({
    // GET ALL CLIENTS
    getClients: builder.query({
      query: () => "/",
      providesTags: ["Clients"],
    }),

    // GET SINGLE CLIENT
    getClientById: builder.query({
      query: (id) => `/${id}`,
      providesTags: ["Clients"],
    }),

    // CREATE CLIENT
    addClient: builder.mutation({
      query: (clientData) => ({
        url: "/",
        method: "POST",
        body: clientData,
      }),
      invalidatesTags: ["Clients"],
    }),

    // UPDATE CLIENT
    updateClient: builder.mutation({
      query: ({ id, ...clientData }) => ({
        url: `/${id}`,
        method: "PUT",
        body: clientData,
      }),
      invalidatesTags: ["Clients"],
    }),

    // DELETE CLIENT
    deleteClient: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Clients"],
    }),
  }),
});

export const {
  useGetClientsQuery,
  useGetClientByIdQuery,
  useAddClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} = clientApi;