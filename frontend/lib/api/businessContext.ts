import { apiRequest } from "./client";

export function getBusinessContext(businessId: string) {
  return apiRequest<{ context: string | null }>(`/api/businesses/${businessId}/context`);
}

export function updateBusinessContext(businessId: string, context: string) {
  return apiRequest<{ context: string | null }>(`/api/businesses/${businessId}/context`, {
    method: "PUT",
    body: { context },
  });
}
