import axios from 'axios';

const PROJECT_SERVICE_URL = process.env.PROJECT_SERVICE_URL

export const fetchProjectById = async (projectId, token) => {
    try {
        if (!projectId) {
            throw new Error("project id is required");
        }
        console.log("url->",`${PROJECT_SERVICE_URL}/project/${projectId}`)
        const response = await axios.get(`${PROJECT_SERVICE_URL}/project/${projectId}`, {
            headers: { Authorization: token }
        });
        return response.data.data;
    } catch (error) {
        console.error(`Error fetching project with ID ${projectId}:`, error.message);
        throw new Error(`Failed to retrieve project details- ${error.message}`);
    }
};

