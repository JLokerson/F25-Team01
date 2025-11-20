// The base URL for your API endpoint.
const API_BASE_URL =
  "https://63iutwxr2owp72oyfbetwyluaq0wakdm.lambda-url.us-east-1.on.aws";
//const API_BASE_URL = "http://localhost:4000"; // swap for localhost testing

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
  // Ensure the path starts with a slash so relative URLs are not generated
  const normalizedPath = path && path.startsWith("/") ? path : `/${path}`;
  let url = `${API_BASE_URL}${normalizedPath}`;

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
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
      throw new Error(
        `HTTP error! status: ${response.status} - ${response.statusText}`
      );
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
export const getAllUsers = () => apiCall("GET", "/userAPI/getAllUsers");

/**
 * Fetches a single user by their ID.
 * @param {string|number} userId - The ID of the user to fetch.
 */
export const getUser = (userId) =>
  apiCall("GET", "/userAPI/getUser", { UserID: userId });

export const getUserFromEmail = (Email) =>
  apiCall("GET", "/userAPI/getUser", { Email: Email });

// Retrieve salt from email (login purposes)
export const getSaltForUser = (Email) =>
  apiCall("GET", "/userAPI/getSaltForUser", {Email: Email});


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
export const addUser = (userData) =>
  apiCall("POST", "/userAPI/addUser", userData);

/**
 * Updates a user's password.
 * @param {string|number} userID
 * @param {string} password
 * @param {string} passwordSalt
 */
export const updatePassword = (userID, password, passwordSalt) =>
  apiCall("POST", "/userAPI/updatePassword", {
    UserID: userID,
    Password: password,
    PasswordSalt: passwordSalt,
  });

/**
 * Logs a user in.
 * @param {Object} credentials - The user's login credentials.
 * @param {string} credentials.Email
 * @param {string} credentials.Password
 */
export const login = (credentials) =>
  apiCall("POST", "/userAPI/login", credentials);

/**
 * Checks if an email already exists in the USER database.
 * @param {string} Email - The email to check.
 */
export const checkEmailExist = (Email) =>
  apiCall("GET", "/userAPI/checkEmail", { email: Email });

// --- Admin API Calls ---

/**
 * Fetches all admins.
 * Note: Corrected path from '/userAPI/getAllUsers' to '/adminAPI/getAllAdmins' based on API structure.
 */
export const getAllAdmins = () => apiCall("GET", "/adminAPI/getAllAdmins");

/**
 * Adds a new admin user.
 * Note: Corrected path from '/userAPI/addUser' to '/adminAPI/addAdmin' based on API structure.
 * @param {Object} adminData - The admin user data.
 */
export const addAdmin = (adminData) =>
  apiCall("POST", "/adminAPI/addAdmin", adminData);

/**
 * Fetches all driver applications from all sponsor organizations.
 */
export const getAllApplications = () =>
  apiCall("GET", "/adminAPI/getAllApplications");

/**
 * Fetches all audit records.
 */
export const getAllAuditRecords = () =>
  apiCall("GET", "/adminAPI/getAuditRecords");

/**
 * Updates an application status (approve/deny).
 * @param {Object} applicationData - The application update data.
 * @param {number} applicationData.applicationId - The ID of the application.
 * @param {string} applicationData.status - The new status ('approved' or 'denied').
 * @param {string} applicationData.processedBy - The admin who processed the application.
 * @param {string} [applicationData.denialReason] - The reason for denial (if denied).
 */
export const updateApplicationStatus = (applicationData) =>
  apiCall("POST", "/adminAPI/updateApplicationStatus", applicationData);

// --- Driver API Calls ---

/**
 * Fetches all drivers.
 */
export const getAllDrivers = () => apiCall("GET", "/driverAPI/getAllDrivers");

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
export const addDriver = (driverData) =>
  apiCall("POST", "/driverAPI/addDriver", driverData);

/**
 * Fetches driver-sponsor mappings for a specific user using GetDriverInfoSpecific stored procedure.
 * Falls back to localhost:3001 if the primary endpoint fails, then to getAllDrivers simulation.
 * @param {string|number} userId - The ID of the user.
 * 
 * This is longer than it needs to be, but I can't get it work without the fallback
 * so for now imma keep it like this - J.L.
 */
export const getDriverSponsorMappings = async (userId) => {
  try {
    // Try the primary AWS endpoint first
    return await apiCall("GET", `/driverAPI/getDriverSponsorMappings/${userId}`);
  } catch (error) {
    console.warn(`Primary getDriverSponsorMappings endpoint failed for userId ${userId}, trying localhost backup:`, error.message);
    
    try {
      // Try localhost:3001 backup
      const localhostUrl = `${LOCALHOST_BASE_URL}/driverAPI/getDriverSponsorMappings/${userId}`;
      const response = await fetch(localhostUrl, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (response.ok) {
        console.log(`Localhost backup successful for getDriverSponsorMappings userId ${userId}`);
        return response;
      } else {
        throw new Error(`Localhost backup failed with status: ${response.status}`);
      }
    } catch (localhostError) {
      console.warn(`Localhost backup also failed for userId ${userId}, attempting final fallback:`, localhostError.message);
      
      // Final fallback to getAllDrivers simulation (existing code)
      try {
        const allDriversResponse = await getAllDrivers();
        if (allDriversResponse && allDriversResponse.ok) {
          const allDriversData = await allDriversResponse.json();
          
          // Extract the actual drivers array from the response
          let driversArray = allDriversData;
          if (Array.isArray(allDriversData) && allDriversData.length > 0 && Array.isArray(allDriversData[0])) {
            driversArray = allDriversData[0];
          }
          
          // Filter for the specific user
          const userDrivers = driversArray.filter(driver => 
            Number(driver.UserID) === Number(userId)
          );
          
          console.log(`Final fallback found ${userDrivers.length} driver records for userId ${userId}`);
          
          // Transform the driver records to match the stored procedure response structure
          const transformedDrivers = userDrivers.map((driver, index) => ({
            ...driver,
            Name: null, // Will be populated by sponsor name lookup
            MappingID: driver.DriverID || (index + 1), // Use DriverID as MappingID or fallback to index
            PointRatio: "0.01"
          }));
          
          console.log(`Final fallback transformed drivers with MappingIDs:`, transformedDrivers);
          
          // Create response structure that matches the stored procedure: [[actualData], metadata]
          const fallbackResponse = [transformedDrivers, { fieldCount: 0, affectedRows: 0 }];
          
          // Create a mock response object that matches what the specific endpoint would return
          const mockResponse = {
            ok: true,
            status: 200,
            json: async () => fallbackResponse
          };
          
          return mockResponse;
        }
      } catch (fallbackError) {
        console.error('Final fallback to getAllDrivers also failed:', fallbackError);
      }
      
      // If all approaches fail, re-throw the original error
      throw error;
    }
  }
};

/**
 * Fetches points change history for a specific driver-sponsor mapping.
 * Falls back to localhost:3001 if the primary endpoint fails.
 * @param {string|number} mappingID - The DriverSponsorMappingID.
 */
export const getPointsHistory = async (mappingID) => {
  try {
    // Try the primary AWS endpoint first
    return await apiCall("GET", `/driverAPI/getPointsHistory/${mappingID}`);
  } catch (error) {
    console.warn(`Primary getPointsHistory endpoint failed for mappingID ${mappingID}, trying localhost backup:`, error.message);
    
    try {
      // Try localhost:3001 backup
      const localhostUrl = `${LOCALHOST_BASE_URL}/driverAPI/getPointsHistory/${mappingID}`;
      const response = await fetch(localhostUrl, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (response.ok) {
        console.log(`Localhost backup successful for getPointsHistory mappingID ${mappingID}`);
        return response;
      } else {
        throw new Error(`Localhost backup failed with status: ${response.status} - ${response.statusText}`);
      }
    } catch (localhostError) {
      console.error(`Localhost backup also failed for mappingID ${mappingID}:`, localhostError.message);
      // Re-throw the original error since localhost backup failed
      throw error;
    }
  }
};

// --- Sponsor API Calls ---

/**
 * Fetches all sponsors.
 */
export const getAllSponsors = () =>
  apiCall("GET", "/sponsorAPI/getAllSponsors");

/**
 * Fetches all users associated with sponsors.
 */
export const getAllSponsorUsers = () =>
  apiCall("GET", "/sponsorAPI/getAllSponsorUsers");

/**
 * Get the sponsor record associated with a given UserID
 * @param {number} userID - The ID of the user.
 */
export const getSponsorForUser = (userId) =>
  apiCall("GET", "/sponsorAPI/getSponsorForUser", { UserID: userId });

/**
 * Adds a new sponsor.
 * @param {Object} sponsorData - The sponsor data.
 * @param {string} sponsorData.Name
 */
export const addSponsor = (sponsorData) =>
  apiCall("POST", "/sponsorAPI/addSponsor", sponsorData);

/**
 * Adds a new user for a sponsor.
 * @param {Object} sponsorUserData - The sponsor user data.
 */
export const addSponsorUser = (sponsorUserData) =>
  apiCall("POST", "/sponsorAPI/addSponsorUser", sponsorUserData);

// keep existing getSponsorForUser helper (already defined above)

/**
 * Updates the points for a single driver.
 * @param {int} DriverID 
 * @param {int} PointUpdate - positive or negative change to drivers current points
 * @param {int} SponsorID
 */
export const updateDriverPoints = (driverID , pointUpdate, sponsorID) =>
  apiCall("POST", "/sponsorAPI/updateDriverPoints", {DriverID: driverID , PointChange: pointUpdate, SponsorID: sponsorID});

// --- Cart API Calls ---

/**
 * Gets all cart items for a specific driver.
 * @param {string|number} driverId - The ID of the driver.
 */
export const getCartItems = (driverId) =>
  apiCall("GET", "/cartAPI/getCartItems", { DriverID: driverId });

/**
 * Adds an item to a driver's cart.
 * @param {Object} itemData - The item data.
 * @param {string|number} itemData.DriverID
 * @param {string|number} itemData.ProductID
 */
export const addCartItem = (itemData) =>
  apiCall("POST", "/cartAPI/addCartItem", itemData);

/**
 * Gets mappings for a specific item/product.
 * @param {string|number} productId - The ID of the product.
 */
export const getItemMappings = (productId) =>
  apiCall("GET", "/cartAPI/getItemMappings", { ProductID: productId });

/**
 * Deletes all cart items for a specific user/driver.
 * @param {string|number} driverId - The ID of the driver whose cart should be cleared.
 */
export const deleteUserCartItems = (driverId) =>
  apiCall("DELETE", "/cartAPI/deleteCartItems", { DriverID: driverId });

// --- Application API Calls ---

/**
 * Fetches all applications.
 */
export const fetchAllApplicationsData = () =>
  apiCall("GET", "/applicationAPI/getAllApplications");

/**
 * Fetches applications for a specific sponsor.
 * @param {string|number} sponsorId - The ID of the sponsor.
 */
export const fetchApplicationsBySponsorData = (sponsorId) =>
  apiCall("GET", `/applicationAPI/getApplicationsBySponsor/${sponsorId}`);

/**
 * Updates an application status.
 * @param {Object} applicationData - The application update data.
 */
export const updateApplicationStatusData = (applicationData) =>
  apiCall("POST", "/applicationAPI/updateApplicationStatus", applicationData);

/**
 * Creates a new application.
 * @param {Object} applicationData - The application data.
 */
export const createApplicationData = (applicationData) =>
  apiCall("POST", "/applicationAPI/createApplication", applicationData);

// --- Catalog API Calls ---

/**
 * Fetches all categories from a sponsor.
 * @param {int} SponsorID - ID for catalogs sponsors.
 */
export const getAllSponsorCategories = (sponsorID) =>
  apiCall("GET", "/catalogAPI/getAllCategories", { SponsorID: sponsorID });

/**
 * Adds a new category.
 * @param {int} SponsorID - ID for catalogs sponsors.
 * @param {string} CategoryID - Key for Best Buy API category type.
 */
export const addCategory = (sponsorID, categoryID) =>
  apiCall("POST", "/catalogAPI/addCategory", {
    SponsorID: sponsorID,
    CategoryID: categoryID,
  });

/**
 * Updates category to active/inactive.
 * @param {int} SponsorID - ID for catalogs sponsors.
 * @param {string} CategoryID - Key for Best Buy API category type.
 * @param {boolean} Active - Boolean to set a category active/inactive
 */
export const updateCategoryStatus = (sponsorID, categoryID, activeFlag) =>
  apiCall("POST", "/catalogAPI/updateCategoryStatus", {
    SponsorID: sponsorID,
    CategoryID: categoryID,
    Active: activeFlag,
  });
