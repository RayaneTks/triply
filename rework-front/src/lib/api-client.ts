// TODO: implement actual API client with fetch/axios wrapper
export const apiClient = {
  get: async <T>(url: string): Promise<T> => {
    console.warn("apiClient.get is MOCKED", url);
    return {} as T;
  },
  post: async <T>(url: string, data: any): Promise<T> => {
    console.warn("apiClient.post is MOCKED", url, data);
    return {} as T;
  },
};
