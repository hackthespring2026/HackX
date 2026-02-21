import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Attach token automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("adminToken");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export const addBus = (data) => API.post("/bus/", data);
export const addRoute = (data) => API.post("/route", data);
export const updateRoute = (id, data) => API.put(`/route/${id}`, data);
export const deleteRoute = (id) => API.delete(`/route/${id}`);
export const addTrip = (data) => API.post("/trip", data);
export const adminLogin = (data) => API.post("/admin/login", data);
export const getBuses = () => API.get("/bus");   // adjust if /bus
export const getRoutes = () => API.get("/route");
export const getActiveTrips = () => API.get("/trip/active"); // adjust if needed
export const endTrip = (id) => API.put(`/trip/${id}/end`);