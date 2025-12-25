import axios from "axios";

export const axiosInstance = axios.create({
        baseURL: import.meta.env.MODE === "development" ? "http://localhost:3000/api" : "https://state-full-application-server-yagf.vercel.app/api",    
    withCredentials: true,

})
