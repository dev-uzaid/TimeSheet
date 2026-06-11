import { configureStore } from "@reduxjs/toolkit";
import { employeeApi } from "../services/employeeApi";
import { engagementApi } from "../services/engagementApi";
import { clientApi } from "../services/clientApi";

export const store = configureStore({
  reducer: {
    [employeeApi.reducerPath]: employeeApi.reducer,
    [engagementApi.reducerPath]: engagementApi.reducer,
    [clientApi.reducerPath]: clientApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(employeeApi.middleware)
      .concat(engagementApi.middleware)
      .concat(clientApi.middleware),
});