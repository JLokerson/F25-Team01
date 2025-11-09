import {getAllAuditRecords} from './ServerCall.js';

// Filter is an untyped var on purpose, intended to be passed as a bunch of possible filters
// we can apply to the data after initial retrieval, though none have yet been implemented.
function ReportView(Filter) {
  let returned = getAllAuditRecords();
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
}

export default ReportView;