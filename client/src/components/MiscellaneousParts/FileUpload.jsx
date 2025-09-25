import './App.css';
import React, {useState} from react;

// Default ID in case none is passed in.
function FileUpload(UserID = -1) {

  const [file, setFile] = useState()

  function handleChange(event) {
    setFile(event.target.files[0])
  }

  return (
    <div className="App">
        <form>
          <h1>React File Upload</h1>
          <input type="file" onChange={handleChange}/>
          <button type="submit">Upload</button>
        </form>
    </div>
  );
}

export default FileUpload;