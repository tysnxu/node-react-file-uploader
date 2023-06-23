import { useEffect, useState } from "react";
import "./App.css";
import { Box, IconButton, Typography, Container, List, ListItem } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import ClearIcon from "@mui/icons-material/Clear";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

//@ts-ignore
// import axios from "./utils/axios";

import axios from "axios";

function App() {
  const [previousUploads, setPreviousUploads] = useState([
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
  const [dragState, setDragState] = useState<number | null>(null); // 1-entire body, 2-on button
  const [uploadingFiles, setUploadingFiles] = useState<{ id: number; filename: string; estimated: number | null; progress: number; errorMsg: string | null }[]>([]);
  const Axios = axios.create({
    baseURL: "http://localhost:3000",
  });

  const axiosConfig = {
    headers: {
      authorization: localStorage.TYFILE_TOKEN ? `Bearer ${localStorage.TYFILE_TOKEN}` : "",
      "Content-Type": "application/json",
    },
  };

  useEffect(() => {
    const localToken = localStorage.TYFILE_TOKEN;
    if (!localToken) {
      createUser();
    } else {
      // EXISTING USER
      login();
    }

    document.addEventListener("dragleave", (event) => {
      event.preventDefault();
      if (event.clientX === 0 && event.clientY === 0) setDragState(null);
    });

    document.addEventListener("dragenter", (event) => {
      // event.preventDefault();
      if ((event.target as HTMLElement).classList.contains("grid-holder")) {
        setDragState(1);
      } else if ((event.target as HTMLElement).classList.contains("upload-button--hint-land")) {
        setDragState(2);
      }
    });
  }, []);

  useEffect(() => {
    if (loggedIn) {
      getFileList();
    }
  }, [loggedIn]);

  const createUser = () => {
    // CREATE NEW USER
    axios
      .post(`/api/user/new`)
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
    Axios.post(`/api/user/login`, {}, axiosConfig)
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
    setPreviousUploads([]);
    Axios.get(`/api/user/files/`, axiosConfig).then((response: any) => {
      console.log(response.data.files);
      setPreviousUploads(response.data.files);
    });
  };

  const uploadFile = (file: File, uploadId: number) => {
    var formData = new FormData();
    formData.append("fileContent", file);

    let config = {
      onUploadProgress: (progressEvent: any) => {
        if (progressEvent.progress === 1) {
        } else {
          // SET THE UPDATE STATUS TO UI

          setUploadingFiles((oldFileList) =>
            oldFileList.map((file) => ({
              ...file,
              progress: uploadId === file.id ? progressEvent.progress : 0,
              estimated: uploadId === file.id && progressEvent.estimated !== undefined ? progressEvent.estimated : null,
            }))
          );
        }

        console.log("Progress", Math.round((progressEvent.loaded * 100) / progressEvent.total));
        console.log("progressEvent", progressEvent);
      },
    };

    Axios.post("/upload/file/", formData, config)
      .then((response: any) => {
        console.log(response.data);
      })
      .catch((err: any) => {
        console.log("ERROR:", err.message);
        throw new Error("Cannot upload file");
      });
  };

  const handleFileUpload = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();

    let files = event.dataTransfer.files;
    console.log(files);

    [...files].forEach((file) => {
      let fileSize = file.size / 1024 / 1024;
      let errorMsg: string | null = null;
      let localUploadId: number;
      console.log(fileSize);
      if (fileSize > 10) {
        errorMsg = "file is too large";
      }

      setUploadingFiles((oldFileList) => {
        localUploadId = oldFileList.length === 0 ? 0 : oldFileList[oldFileList.length - 1].id + 1;
        return [
          ...oldFileList,
          {
            id: localUploadId,
            filename: file.name,
            progress: 0,
            estimated: null,
            errorMsg: errorMsg,
          },
        ];
      });

      if (!errorMsg) {
        //@ts-ignore
        uploadFile(file, localUploadId);
      }
    });
  };

  return (
    <>
      <div className="grid-holder">
        <div>
          <h1>File Uploader</h1>
          <div
            className={dragState === null ? "upload-button" : dragState === 1 ? "upload-button--hint-land" : "upload-button--ready-release"}
            onDrop={handleFileUpload}
            onDragOver={(event) => {
              event.preventDefault();
            }}
          >
            {dragState === null && <span className="btn-title">Drag a file here</span>}
            {dragState === 1 && <span className="btn-title--dragged">Drop file here</span>}
            {dragState === 2 && <span className="btn-title--dragged">Release to upload</span>}
            {dragState === null && (
              <>
                or <span className="btn-underline">select a file</span>
              </>
            )}
          </div>
          <p>Maximum 10MB allowed</p>
        </div>
        <div className="uploads-table">
          <h2>Past Uploads ({previousUploads.length})</h2>
          <ul>
            {previousUploads.map((file) => (
              <Box key={file.url}>
                <li>{file.fileName}</li>
                <IconButton style={{ color: "white" }}>
                  <ContentCopyIcon />
                </IconButton>
                <IconButton style={{ color: "white" }}>
                  <ClearIcon />
                </IconButton>
              </Box>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

export default App;
