import {getAllAuditRecords} from './ServerCall.js';
import React, { useState, useEffect } from 'react';

// Filter is an untyped var on purpose, intended to be passed as a bunch of possible filters
// we can apply to the data after initial retrieval, though none have yet been implemented.
function ReportView(Filter) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState([]);

  const fetchAllData = async () => {
    try {
      console.log('=== FETCHING AUDIT DATA ===');
      const response = await fetch(`http://localhost:4000/adminAPI/getAuditRecords`);
      console.log('Admin API response status:', response.status);
      
      if (response.ok) {
        const responseText = await response.text();
        console.log('Raw admin response text:', responseText);
        
        let allEntries;
        try {
          allEntries = JSON.parse(responseText);
          console.log('Parsed admin data:', allEntries);
        }catch (parseError) {
          console.error('Failed to parse admin JSON:', parseError);
          setEntries([]);
          return;
        }
        
        if(!Array.isArray(allEntries)) {
          console.error('Admin data is not an array:', allEntries);
          setEntries([]);
          return;
        }
        
        // Process entries. I don't know how this works,
        // and allegedly neither does julia. I just hope
        // the way I changed it doesn't break anything.
        const processedEntries = allEntries.map(entry => ({
            ...entry,
            ActionName: entry.ActionName,
            EventTime: entry.EventTime,
            AffectedUserID: entry.AffectedUserID,
        }));
        
        console.log('Processed audit data:', processedEntries);
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


  let returned = [] // Placeholder until i can make what was here work.
  //returned = await getAllAuditRecords();
  console.log(returned);
//  returned = JSON.parse(returned);
/*
  const listItems = returned.map(entry =>
    <li>
      <p>This is a single entry
        <b>{entry.ActionName}:</b>
        {' ' + entry.EventTime + ' '}
        {entry.AffectedUserID}
      </p>
    </li>
  );
  return <ul>{listItems}</ul>;
  */
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
    <table>
      <thead>
        <tr>
          <th>ActionName</th>
          <th>EventTime</th>
          <th>AffectedUserID</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <tr key={`${entry.ActionName}-${entry.EventTime}-${entry.AffectedUserID}`}>
            <td>{entry.ActionName}</td>
            <td>{entry.EventTime}</td>
            <td>{entry.AffectedUserID}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ReportView;