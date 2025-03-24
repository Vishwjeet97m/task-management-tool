import axios from 'axios';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL

export const fetchUserById = async (userId, token) => {
    try {
        if (!userId) {
            throw new Error("User ID is required");
        }
        
        const headers = { Authorization: token };
        const response = await axios.get(`${USER_SERVICE_URL}/user/${userId}`, { headers });
        
        return response.data.data; // Extract user data
    } catch (error) {
        console.error(`Error fetching user with ID ${userId}:`, error.message);
        throw new Error("Failed to retrieve user details");
    }
};

export const searchUsers = async (query, token) => {
    try {
        const headers = { Authorization: token };
        const response = await axios.get(`${USER_SERVICE_URL}/user/search?query=${query}`, { headers });
        return response.data.data; // Extract user search results
    } catch (error) {
        console.error(`Error searching users:`, error.message);
        return []; // Return empty array if search fails
    }
};