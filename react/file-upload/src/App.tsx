import { useEffect, useState } from "react";
import "./App.css";
import { Box, IconButton, Typography, Container, List, ListItem } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import ClearIcon from "@mui/icons-material/Clear";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

//@ts-ignore
import axios from "./utils/axios";

function App() {
  const [uploads, setUploads] = useState([
    {
      id: "cbcedbcf-665f-49ca-aad5-e11a3429011f",
      fileName: "monalisa.jpg",
      uploadedAt: "2023-06-18T13:12:45.430Z",
      userId: "b65be946-d869-4028-8d30-3af85c038170",
      deleted: false,
      url: "/2023/06/18/monalisa.jpg",
      password: null,
    },
    {
      id: "f9988a90-2bb5-4793-bff3-e31508dc851f",
      fileName: "monabba.jpg",
      uploadedAt: "2023-06-18T13:12:56.689Z",
      userId: "b65be946-d869-4028-8d30-3af85c038170",
      deleted: false,
      url: "/2023/06/18/monabba.jpg",
      password: null,
    },
  ]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<String | null>(null);

  const createUser = () => {
    // CREATE NEW USER
    axios
      .post(`/api/user`)
      .then((response: any) => {
        if (response.data.token) {
          console.log("Successful creation");
          localStorage.setItem("TYFILE_TOKEN", response.data.token);

          setLoggedIn(true);
        }
      })
      .catch((err: any) => {
        console.log("ERROR:", err.message);

        throw new Error("Cannot create user");
      });
  };

  const login = () => {
    axios
      .post(`/api/login`)
      .then((response: any) => {
        // console.log(response.data);
        setLoggedIn(true);
      })
      .catch((err: any) => {
        console.log("ERROR:", err.response.data.message);

        if (err.response.data.message === "User not found, login failed") {
          localStorage.clear();

          setErrorMsg("Invalid User, please refresh");
          setLoggedIn(false);
          // createUser();
        }
      });
  };

  const getFileList = () => {
    axios.get(`/api/files/`).then((response: any) => {
      console.log(response.data.files);
      setUploads(response.data.files);
    });
  };

  useEffect(() => {
    const localToken = localStorage.TYFILE_TOKEN;
    if (!localToken) {
      createUser();
    } else {
      // EXISTING USER
      login();
    }
  }, []);

  useEffect(() => {
    if (loggedIn) {
      getFileList();
    }
  }, [loggedIn]);

  return (
    <>
      <div className="grid-holder">
        <div>
          <h1>File Uploader</h1>
          <div className="upload-button">
            <span className="btn-title">Drag a file here</span>
            or <span className="btn-underline">select a file</span>
          </div>
          <p>Maximum 10MB allowed</p>
        </div>
        {/* <IconButton style={{ color: "white" }}>
            <ContentCopyIcon />
          </IconButton>
          <IconButton style={{ color: "white" }}>
            <ClearIcon />
          </IconButton> */}
        <div className="uploads-table">
          <h2>Past Uploads ({uploads.length})</h2>
          <ul>
            {uploads.map((file) => (
              <>
                <li key={file.url}>{file.fileName}</li>
              </>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

export default App;
