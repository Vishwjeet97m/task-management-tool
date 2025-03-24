import axios from 'axios';

const PROJECT_SERVICE_URL = process.env.PROJECT_SERVICE_URL

export const searchProjects = async (query, token) => {
    try {
        const headers = { Authorization: token };
        const response = await axios.get(`${PROJECT_SERVICE_URL}/project/search?query=${query}`, { headers });
        return response.data.data; // Extract project search results
    } catch (error) {
        console.error(`Error searching projects:`, error.message);
        return []; // Return empty array if search fails
    }
};