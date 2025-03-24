import axios from 'axios';

const TASK_SERVICE_URL = process.env.TASK_SERVICE_URL

export const searchTasks = async (query, token) => {
    try {
        const headers = {Authorization: token}
        console.log("search task service->", `${TASK_SERVICE_URL}/task/search?query=${query}`)
        const response = await axios.get(`${TASK_SERVICE_URL}/task/search?query=${query}`, {headers});        
        console.log("task response data--.",response.data);
        return response.data.data; // Extract project search results
    } catch (error) {
        console.error(`Error searching tasks:`, error.message);
        return []; // Return empty array if search fails
    }
};