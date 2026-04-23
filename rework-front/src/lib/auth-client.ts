// TODO: implement session token storage and management
export const authClient = {
  getToken: () => localStorage.getItem("triply_token"),
  setToken: (token: string) => localStorage.setItem("triply_token", token),
  clear: () => localStorage.removeItem("triply_token"),
};
