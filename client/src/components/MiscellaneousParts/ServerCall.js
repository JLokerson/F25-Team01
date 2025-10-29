// The base URL for your API endpoint.
const API_BASE_URL = 'https://63iutwxr2owp72oyfbetwyluaq0wakdm.lambda-url.us-east-1.on.aws';

/**
 * A generic helper function to handle all API calls.
 * This reduces code duplication and centralizes error handling.
 * @param {string} method - The HTTP method (e.g., 'GET', 'POST').
 * @param {string} path - The API endpoint path (e.g., '/userAPI/getAllUsers').
 * @param {Object} [params=null] - An object of query parameters to be appended to the URL.
 * @returns {Promise<any>} - A promise that resolves with the JSON response from the API.
 * @throws {Error} - Throws an error if the network response is not ok.
 */
const apiCall = async (method, path, params = null) => {
    let url = `${API_BASE_URL}${path}`;

    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    // If parameters are provided, construct the query string.
    // This is used for both GET and POST requests as per your Postman setup.
    if (params) {
        const query = new URLSearchParams(params).toString();
        url += `?${query}`;
    }

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }
        // Return null if the response has no content (e.g., 204 No Content)
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return await response;
        }
        return null; 
    } catch (error) {
        console.error(`Error during API call to ${url}:`, error);
        throw error;
    }
};

// --- User API Calls ---

/**
 * Fetches all users from the API.
 */
export const getAllUsers = () => apiCall('GET', '/userAPI/getAllUsers');

/**
 * Fetches a single user by their ID.
 * @param {string|number} userId - The ID of the user to fetch.
 */
export const getUser = (userId) => apiCall('GET', '/userAPI/getUser', { UserID: userId });

/**
 * Adds a new user.
 * @param {Object} userData - The user data.
 * @param {string} userData.FirstName
 * @param {string} userData.LastName
 * @param {string} userData.Email
 * @param {string} userData.Password
 * @param {string} userData.PasswordSalt
 * @param {number} userData.UserType
 */
export const addUser = (userData) => apiCall('POST', '/userAPI/addUser', userData);

/**
 * Updates a user's password.
 * @param {string|number} userID
 * @param {string} password
 * @param {string} passwordSalt
 */
export const updatePassword = (userID, password, passwordSalt) => apiCall('POST', '/userAPI/updatePassword', { UserID: userID, Password: password, PasswordSalt: passwordSalt});

/**
 * Logs a user in.
 * @param {Object} credentials - The user's login credentials.
 * @param {string} credentials.Email
 * @param {string} credentials.Password
 */
export const login = (credentials) => apiCall('POST', '/userAPI/login', credentials);

/**
 * Checks if an email already exists in the USER database.
 * @param {string} Email - The email to check.
 */
export const checkEmailExist = (Email) => apiCall('GET', '/userAPI/checkEmail', { email: Email });

// --- Admin API Calls ---

/**
 * Fetches all admins.
 * Note: Corrected path from '/userAPI/getAllUsers' to '/adminAPI/getAllAdmins' based on API structure.
 */
export const getAllAdmins = () => apiCall('GET', '/adminAPI/getAllAdmins');

/**
 * Adds a new admin user.
 * Note: Corrected path from '/userAPI/addUser' to '/adminAPI/addAdmin' based on API structure.
 * @param {Object} adminData - The admin user data.
 */
export const addAdmin = (adminData) => apiCall('POST', '/adminAPI/addAdmin', adminData);


// --- Driver API Calls ---

/**
 * Fetches all drivers.
 */
export const getAllDrivers = () => apiCall('GET', '/driverAPI/getAllDrivers');

/**
 * Adds a new driver.
 * Note: Corrected path from '/userAPI/addUser' to '/driverAPI/addDriver' based on API structure.
 * @param {Object} driverData - The driver data.
 * @param {string} driverData.FirstName
 * @param {string} driverData.LastName
 * @param {string} driverData.Email
 * @param {string} driverData.Password
 * @param {string} driverData.PasswordSalt
 * @param {number} driverData.UserType
 * @param {number} driverData.SponsorID
 */
export const addDriver = (driverData) => apiCall('POST', '/driverAPI/addDriver', driverData);


// --- Sponsor API Calls ---

/**
 * Fetches all sponsors.
 */
export const getAllSponsors = () => apiCall('GET', '/sponsorAPI/getAllSponsors');

/**
 * Fetches all users associated with sponsors.
 */
export const getAllSponsorUsers = () => apiCall('GET', '/sponsorAPI/getAllSponsorUsers');

/**
 * Get the sponsor record associated with a given UserID
 * @param {number} userID - The ID of the user.
 */
export const getSponsorForUser = (userId) => apiCall('GET', '/sponsorAPI/getSponsorForUser', {UserID: userId});

/**
 * Adds a new sponsor.
 * @param {Object} sponsorData - The sponsor data.
 * @param {string} sponsorData.Name
 */
export const addSponsor = (sponsorData) => apiCall('POST', '/sponsorAPI/addSponsor', sponsorData);

/**
 * Adds a new user for a sponsor.
 * @param {Object} sponsorUserData - The sponsor user data.
 */
export const addSponsorUser = (sponsorUserData) => apiCall('POST', '/sponsorAPI/addSponsorUser', sponsorUserData);


// --- Cart API Calls ---

/**
 * Gets all cart items for a specific driver.
 * @param {string|number} driverId - The ID of the driver.
 */
export const getCartItems = (driverId) => apiCall('GET', '/cartAPI/getCartItems', { DriverID: driverId });

/**
 * Adds an item to a driver's cart.
 * @param {Object} itemData - The item data.
 * @param {string|number} itemData.DriverID
 * @param {string|number} itemData.ProductID
 */
export const addCartItem = (itemData) => apiCall('POST', '/cartAPI/addCartItem', itemData);

/**
 * Gets mappings for a specific item/product.
 * @param {string|number} productId - The ID of the product.
 */
export const getItemMappings = (productId) => apiCall('GET', '/cartAPI/getItemMappings', { ProductID: productId });

/**
 * Deletes all cart items for a specific user/driver.
 * @param {string|number} driverId - The ID of the driver whose cart should be cleared.
 */
export const deleteUserCartItems = (driverId) => apiCall('DELETE', '/cartAPI/deleteCartItems', { DriverID: driverId });
