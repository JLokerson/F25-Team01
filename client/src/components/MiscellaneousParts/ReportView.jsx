import {getAllAuditRecords} from './ServerCall.js';
import React, { useState, useEffect } from 'react';

// Filter is an untyped var on purpose, intended to be passed as a bunch of possible filters
// we can apply to the data after initial retrieval, though none have yet been implemented.
function ReportView(Filter) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState([]);
  const [searchUserId, setSearchUserId] = useState('');

  const fetchAllData = async () => {
    try {
      console.log('=== FETCHING AUDIT DATA ===');
      const response = await fetch(`https://63iutwxr2owp72oyfbetwyluaq0wakdm.lambda-url.us-east-1.on.aws/adminAPI/getAuditRecords`);
      console.log('Audit API response status:', response.status);
      
      if (response.ok) {
        const responseText = await response.text();
        console.log('Raw audit response text:', responseText);
        
        let allEntries;
        try {
          allEntries = JSON.parse(responseText);
          console.log('Parsed audit data:', allEntries);
        }catch (parseError) {
          console.error('Failed to parse audit JSON:', parseError);
          setEntries([]);
          return;
        }
        
        if(!Array.isArray(allEntries)) {
          console.error('Audit data is not an array:', allEntries);
          setEntries([]);
          return;
        }
        
        // Process entries. I don't know how this works,
        // and allegedly neither does julia. I just hope
        // the way I changed it doesn't break anything.
        let processedEntries = allEntries.map(entry => ({
            ...entry,
            ActionName: entry.ActionName,
            EventTime: entry.EventTime,
            AffectedUserID: entry.AffectedUserID,
        }));
        
        console.log('Processed audit data:', processedEntries);
        processedEntries = processedEntries[0];

        /*
        processedEntries = Object.values(processedEntries)
        processedEntries = processedEntries.slice(0, -3)
        */

        delete processedEntries.ActionName;
        delete processedEntries.AffectedUserID;
        delete processedEntries.EventTime;

        processedEntries = Object.values(processedEntries);

        setEntries(processedEntries);
      }else {
        console.error('Failed to fetch audit data - HTTP status:', response.status);
        setEntries([]);
      }
    } catch (error) {
        console.error('Network error fetching audit data:', error);
        setEntries([]);
    }
  };

  try{
    useEffect(() => {
      setLoading(true);
      fetchAllData();
      setLoading(false);
    }, []);
  }catch(error){
    console.log("Unknown error occurred.")
  }


  // Filter entries based on search
  const filteredEntries = entries.filter(entry => {
    if (!searchUserId) return true;
    return entry.AffectedUserID && entry.AffectedUserID.toString().includes(searchUserId);
  });

  if (loading) {
         return (
             <div>
                 <div className="container mt-4">
                     <div className="text-center">
                         <div className="spinner-border" role="status">
                             <span className="visually-hidden">Loading...</span>
                         </div>
                     </div>
                 </div>
             </div>
         );
  }
  return (
    <div className="container mt-4">
      <h3 className="mb-4">Audit Records</h3>
      
      {/* Search Input */}
      <div className="row mb-3">
        <div className="col-md-8"></div>
        <div className="col-md-4">
          <div className="d-flex">
            <input
              type="text"
              className="form-control"
              placeholder="Search by User ID..."
              value={searchUserId}
              onChange={(e) => setSearchUserId(e.target.value)}
            />
            {searchUserId && (
              <button
                className="btn btn-outline-secondary ms-2"
                type="button"
                onClick={() => setSearchUserId('')}
                title="Clear search"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
          {searchUserId && (
            <small className="text-muted">
              Showing {filteredEntries.length} of {entries.length} records
            </small>
          )}
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead className="table-dark">
            <tr>
              <th scope="col">Action Name</th>
              <th scope="col">Event Time</th>
              <th scope="col">Affected User ID</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center text-muted">
                  {searchUserId ? `No audit records found for User ID containing "${searchUserId}"` : "No audit records found"}
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry, index) => (
                <tr key={`${entry.ActionName}-${entry.EventTime}-${entry.AffectedUserID}-${index}`}>
                  <td>{entry.ActionName}</td>
                  <td>{entry.EventTime}</td>
                  <td>{entry.AffectedUserID}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ReportView;