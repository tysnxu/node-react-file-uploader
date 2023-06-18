import { useEffect, useState } from "react";
import "./App.css";
import { IconButton } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
//@ts-ignore
import axios from "./utils/axios";

function App() {
  const [uploads, setUploads] = useState([]);
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
      <IconButton>
        <ContentCopyIcon />
      </IconButton>
      <IconButton>
        <ClearIcon />
      </IconButton>
    </>
  );
}

export default App;
