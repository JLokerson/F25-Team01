

export default function SponsorBulkLoading() {
    const [bulkUploadFile, setBulkUploadFile] = useState(null);
    const [bulkUploadResults, setBulkUploadResults] = useState(null);
    const [bulkUploadLoading, setBulkUploadLoading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [sponsors, setSponsors] = useState([]);

    const getUserInfo = () => {
        const userString = localStorage.getItem('user');
        if (userString) {
            try {
                return JSON.parse(userString);
            } catch (e) {
                return null;
            }
        }
        return null;
    };

    const fetchSponsorInfo = async () => {
        const userInfo = getUserInfo();
        if (userInfo && userInfo.UserID) {
            try {
                const response = await fetch(`https://63iutwxr2owp72oyfbetwyluaq0wakdm.lambda-url.us-east-1.on.aws/sponsorAPI/getAllSponsorUsers`);
                if (response.ok) {
                    const allSponsorUsers = await response.json();
                    const currentSponsorInfo = allSponsorUsers.find(s => s.UserID === userInfo.UserID);
                    setSponsorInfo(currentSponsorInfo);
                    if (currentSponsorInfo) {
                        fetchDriversForSponsor(currentSponsorInfo.SponsorID);
                    }
                }
            } catch (error) {
                console.error('Error fetching sponsor info:', error);
            }
        }
        setLoading(false);
    };

    // Base template for this was taken from Julia's adminbulkupload branch off which
    // the sponsorbulkupload branch was based. This is gonna be messy, seeing as I
    // do not find this massive function to be particularly readable. Regardless, I have a plan.
    const handleBulkUpload = async (e) => {
        e.preventDefault();
        if (!bulkUploadFile) {
            alert('Please select a file to upload.');
            return;
        }

        setBulkUploadLoading(true);
        setBulkUploadResults(null);

        try {
            const fileContent = await readFileContent(bulkUploadFile);
            const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line);
            
            const results = {
                totalLines: lines.length,
                processed: 0,
                errors: [],
                success: {
                    organizations: 0,
                    drivers: 0,
                    sponsors: 0
                },
                organizationCache: new Set() // Track organizations we've created in this session
            };

            /* Disallowed for sponsor users.
            // Load existing organizations into cache
            sponsors.forEach(sponsor => {
                results.organizationCache.add(sponsor.Name.toLowerCase());
            });
            */

            for (let i = 0; i < lines.length; i++) {
                const lineNumber = i + 1;
                const line = lines[i];
                
                try {
                    const result = await processUploadLine(line, lineNumber, results.organizationCache);
                    
                    if (result.success) {
                        results.success[result.type]++;

                        // Should never occur.
                        if (result.type === 'organizations') {
                            alert("Sponsor users may not create organizations!");
                        }
                    } else {
                        results.errors.push({
                            line: lineNumber,
                            content: line,
                            error: result.error
                        });
                    }
                } catch (error) {
                    results.errors.push({
                        line: lineNumber,
                        content: line,
                        error: `Unexpected error: ${error.message}`
                    });
                }
                
                results.processed++;
            }

            setBulkUploadResults(results);
            
            // Refresh all data after bulk upload
            //await Promise.all([fetchAllUsers(), fetchAllSponsors(), fetchSponsorOrgs()]);
            // I have no idea what the fuck to await here. I did not make this page and I 
            // am looking at far too many lines of code to figure this out.
            
        } catch (error) {
            console.error('Error processing bulk upload:', error);
            alert(`Error processing file: ${error.message}`);
        } finally {
            setBulkUploadLoading(false);
        }
    };

    const processUploadLine = async (line, lineNumber, organizationCache) => {
        const parts = line.split('|');
        
        if (parts.length < 2) {
            return { success: false, error: 'Invalid format: Not enough fields (minimum 2 required)' };
        }

        const type = parts[0].trim().toUpperCase();
        
        switch (type) {
            case 'O':
                return await processOrganizationRecord(parts, organizationCache);
            case 'D':
                return await processDriverRecord(parts, organizationCache);
            case 'S':
                return await processSponsorRecord(parts, organizationCache);
            default:
                return { success: false, error: `Invalid type '${type}'. Must be O, D, or S.` };
        }
    };

    const processOrganizationRecord = async (parts, organizationCache) => {
        if (parts.length !== 2) {
            return { success: false, error: 'Organization record must have exactly 2 fields: O|organization name' };
        }

        const organizationName = parts[1].trim();
        
        if (!organizationName) {
            return { success: false, error: 'Organization name cannot be empty' };
        }

        // Check if organization already exists (case insensitive)
        if (organizationCache.has(organizationName.toLowerCase())) {
            return { success: false, error: `Organization '${organizationName}' already exists` };
        }

        try {
            const orgData = {
                Name: organizationName,
                PointRatio: 0.01,
                EnabledSponsor: 1
            };

            const response = await fetch(`http://localhost:4000/sponsorAPI/addSponsor`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orgData)
            });

            if (response.ok) {
                return { 
                    success: true, 
                    type: 'organizations',
                    organizationName: organizationName
                };
            } else {
                const errorText = await response.text();
                return { success: false, error: `Failed to create organization: ${errorText}` };
            }
        } catch (error) {
            return { success: false, error: `Network error creating organization: ${error.message}` };
        }
    };

    const processDriverRecord = async (parts, organizationCache) => {
        if (parts.length !== 4) {
            return { success: false, error: 'Driver record must have exactly 4 fields: D|first name|last name|email' };
        }

        const [, organizationName, firstName, lastName, email] = parts.map(p => p.trim());
        
        if (!organizationName || !firstName || !lastName || !email) {
            return { success: false, error: 'All driver fields are required and cannot be empty' };
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { success: false, error: 'Invalid email format' };
        }

        // Check if organization exists
        const sponsor = sponsors.find(s => s.Name.toLowerCase() === organizationName.toLowerCase());
        if (!sponsor && !organizationCache.has(organizationName.toLowerCase())) {
            return { success: false, error: `Organization '${organizationName}' does not exist. Ask an admin to create it first.` };
        }

        try {
            const salt = GenerateSalt();
            const driverData = {
                FirstName: firstName,
                LastName: lastName,
                Email: email,
                Password: 'DefaultPassword123!', // Default password - user should change on first login
                SponsorID: sponsor ? sponsor.SponsorID : 0, // Will need to be resolved if organization was just created
                UserType: 1,
                PasswordSalt: salt
            };

            // If organization was just created, we need to find its ID
            if (!sponsor) {
                // For now, we'll skip this record and suggest processing organizations first
                return { success: false, error: `Organization '${organizationName}' was created in this batch but ID not yet available. Please process organizations first, then drivers.` };
            }

            const queryString = new URLSearchParams(driverData).toString();
            const response = await fetch(`http://localhost:4000/driverAPI/addDriver?${queryString}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                return { success: true, type: 'drivers' };
            } else {
                const errorText = await response.text();
                return { success: false, error: `Failed to create driver: ${errorText}` };
            }
        } catch (error) {
            return { success: false, error: `Network error creating driver: ${error.message}` };
        }
    };

    const processSponsorRecord = async (parts, organizationCache) => {
        if (parts.length !== 5) {
            return { success: false, error: 'Sponsor record must have exactly 5 fields: S|organization|first name|last name|email' };
        }

        const [, organizationName, firstName, lastName, email] = parts.map(p => p.trim());
        
        if (!organizationName || !firstName || !lastName || !email) {
            return { success: false, error: 'All sponsor fields are required and cannot be empty' };
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { success: false, error: 'Invalid email format' };
        }

        // Check if organization exists
        const sponsor = sponsors.find(s => s.Name.toLowerCase() === organizationName.toLowerCase());
        if (!sponsor && !organizationCache.has(organizationName.toLowerCase())) {
            return { success: false, error: `Organization '${organizationName}' does not exist. Create it first with an 'O' record.` };
        }

        try {
            const salt = GenerateSalt();
            const sponsorData = {
                FirstName: firstName,
                LastName: lastName,
                Email: email,
                Password: 'DefaultPassword123!', // Default password - user should change on first login
                SponsorID: sponsor ? sponsor.SponsorID : 0,
                UserType: 2,
                PasswordSalt: salt
            };

            // If organization was just created, we need to find its ID
            if (!sponsor) {
                return { success: false, error: `Organization '${organizationName}' was created in this batch but ID not yet available. Please process organizations first, then sponsors.` };
            }

            const response = await fetch(`http://localhost:4000/sponsorAPI/addSponsorUser`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sponsorData)
            });

            if (response.ok) {
                return { success: true, type: 'sponsors' };
            } else {
                const errorText = await response.text();
                return { success: false, error: `Failed to create sponsor: ${errorText}` };
            }
        } catch (error) {
            return { success: false, error: `Network error creating sponsor: ${error.message}` };
        }
    };

    const readFileContent = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    };

    const handleFileSelect = (file) => {
        if (file && (file.type === 'text/plain' || file.name.endsWith('.txt'))) {
            setBulkUploadFile(file);
            setBulkUploadResults(null);
        } else {
            alert('Please select a valid text file (.txt)');
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };
    
}