import { axiosClient } from "../lib/axiosClient";

export async function getMyAvailability() { const { data } = await axiosClient.get("/api/visit-appointments/availability"); return data; }
export async function addAvailability(payload) { await axiosClient.post("/api/visit-appointments/availability", payload); }
export async function removeAvailability(id) { await axiosClient.delete(`/api/visit-appointments/availability/${id}`); }
export async function getMyVisitRequests() { const { data } = await axiosClient.get("/api/visit-appointments/mine"); return data; }
export async function approveVisitRequest(id) { const { data } = await axiosClient.post(`/api/visit-appointments/${id}/approve`); return data; }
export async function rejectVisitRequest(id) { const { data } = await axiosClient.post(`/api/visit-appointments/${id}/reject`); return data; }
export async function rescheduleVisit(id, startsAtUtc) { const { data } = await axiosClient.post(`/api/visit-appointments/${id}/reschedule`, { startsAtUtc }); return data; }
export async function createManualVisit(payload) { const { data } = await axiosClient.post("/api/visit-appointments/manual", payload); return data; }
export async function getCoordinatorWeek(from) { const { data } = await axiosClient.get("/api/visit-appointments/coordinator/week", { params: { from } }); return data; }
export async function createRealEstateAdvisor(payload) { const { data } = await axiosClient.post("/api/visit-appointments/advisors", payload); return data; }
export async function getCalendarStatus() { const { data } = await axiosClient.get("/api/visit-appointments/calendar-status"); return data; }
export async function getPublicVisitSlots(companySlug, params) { const { data } = await axiosClient.get(`/api/public/companies/${encodeURIComponent(companySlug)}/visit-appointments/slots`, { params }); return data; }
export async function requestPublicVisit(companySlug, payload) { const { data } = await axiosClient.post(`/api/public/companies/${encodeURIComponent(companySlug)}/visit-appointments`, payload); return data; }
