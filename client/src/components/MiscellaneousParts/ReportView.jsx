import './App.css';
import React, {useState} from react;
import {getAllAuditRecords} from './ServerCall.jsx';

// Filter is an untyped var on purpose, intended to be passed as a bunch of possible filters
// we can apply to the data after initial retrieval, though none have yet been implemented.
function ReportView(Filter) {
  returned = getAllAuditRecords();
  const listItems = returned.map(person =>
    <li>
      <img src={getImageUrl(person)} alt={person.name}/>
      <p>
        <b>{person.name}:</b>
        {' ' + person.profession + ' '}
        known for {person.accomplishment}
      </p>
    </li>
  );
  return <ul>{listItems}</ul>;
}

export default ReportView;