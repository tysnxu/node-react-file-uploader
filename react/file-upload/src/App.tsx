import { useEffect, useState } from "react";
import "./App.css";
import { Box, IconButton, Typography, Container, List, ListItem } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import ClearIcon from "@mui/icons-material/Clear";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

//@ts-ignore
import axios from "./utils/axios";

function App() {
  const [uploads, setUploads] = useState([{ fileName: "test.jpg", uploadTime: "June 14", url: "/sddd.jpg" }]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<String | null>(null);

  const borderRed = { outline: "2px red solid" };

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
      // console.log(response.data);
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
          <Typography variant="h4" component="h1">
            File Uploader
          </Typography>
          <Typography variant="body1">Maximum 10MB allowed</Typography>
        </div>
        {/* <IconButton style={{ color: "white" }}>
            <ContentCopyIcon />
          </IconButton>
          <IconButton style={{ color: "white" }}>
            <ClearIcon />
          </IconButton> */}
        <div className="uploads-table">
          <Typography>Past Uploads</Typography>
          <List>
            {uploads.map((file) => (
              <>
                <ListItem disablePadding>{file.fileName}</ListItem>
              </>
            ))}
          </List>
        </div>
      </div>
    </>
  );
}

export default App;
