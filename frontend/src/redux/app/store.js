import { configureStore } from "@reduxjs/toolkit";
import { employeeApi } from "../services/employeeApi";
import { engagementApi } from "../services/engagementApi";
import { clientApi } from "../services/clientApi";
import { companyApi } from "../services/companyApi";
import { defaulterApi } from "../services/defaulterApi";

export const store = configureStore({
  reducer: {
    [employeeApi.reducerPath]: employeeApi.reducer,
    [engagementApi.reducerPath]: engagementApi.reducer,
    [clientApi.reducerPath]: clientApi.reducer,
    [companyApi.reducerPath]: companyApi.reducer,
    [defaulterApi.reducerPath]: defaulterApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(employeeApi.middleware)
      .concat(engagementApi.middleware)
      .concat(clientApi.middleware)
      .concat(companyApi.middleware)
      .concat(defaulterApi.middleware),
});