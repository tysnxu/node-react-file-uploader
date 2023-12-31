import { useEffect, useRef, useState, forwardRef } from "react";
import "./App.css";
import { Box, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Typography, Divider, Toolbar, AppBar, List, ListItem, ListItemText, Link } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Slide from "@mui/material/Slide";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { TransitionProps } from "@mui/material/transitions";

import axios from "axios";

type FileObject = {
  fileName: string;
  id: string;
  uploadedAt: string;
  url: string;
};

type UploadingFileObject = {
  id: number;
  filename: string;
  estimated: number | null;
  progress: number;
  errorMsg: string | null;
};

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

function App() {
  const [previousUploads, setPreviousUploads] = useState<FileObject[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [dragState, setDragState] = useState<number | null>(null); // 1-DRAG OVER DOCUMENT, 2-DRAG OVER BUTTON, 3-RELEASED AND UPLOADING
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFileObject[]>([]);
  const inputFile = useRef<HTMLInputElement | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("Large File");
  const [dialogMessage, setDialogMessage] = useState(<></>);
  const [dialogButtons, setDialogButtons] = useState(<></>);

  const [fileDrawerOpen, setFileDrawerOpen] = useState(false);
  const dialogConfirmFn = useRef<Function>();

  const [snackBarOpen, setSnackBarOpen] = useState(false);
  const BACKEND_URL = "http://18.162.97.23:3000/";
  const FILE_STORE_URL = "http://18.162.97.23/storage/tyFile/";

  const Axios = axios.create({
    baseURL: BACKEND_URL,
  });

  const axiosConfig = {
    headers: {
      authorization: localStorage.TYFILE_TOKEN ? `Bearer ${localStorage.TYFILE_TOKEN}` : "",
      "Content-Type": "application/json",
    },
  };

  useEffect(() => {
    if (localStorage.getItem("TYFILE_PREVIOUS_UPLOADS") !== null) {
      //@ts-ignore
      let local = JSON.parse(localStorage.getItem("TYFILE_PREVIOUS_UPLOADS"));
      setPreviousUploads(local);
      console.log("LOAD LOCAL", local);
    }
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
      // if ((event.target as HTMLElement).classList.contains("grid-holder")) {
      //   setDragState(1);
      // } else if ((event.target as HTMLElement).classList.contains("upload-button--hint-land")) {
      //   setDragState(2);
      // }

      if ((event.target as HTMLElement).classList.contains("upload-button--hint-land")) {
        setDragState(2);
      } else {
        setDragState(1);
      }
    });
  }, []);

  useEffect(() => {
    if (loggedIn) {
      getFileList();
    } else {
      setPreviousUploads([]);
      localStorage.removeItem("TYFILE_PREVIOUS_UPLOADS");
    }
  }, [loggedIn]);

  const createUser = () => {
    // CREATE NEW USER
    Axios.post(`/api/user/new`, {}, axiosConfig)
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
      .then(() => {
        // console.log(response.data);
        setLoggedIn(true);
      })
      .catch((err: any) => {
        console.log("ERROR:", err.response.data.message);

        if (err.response.data.message === "User not found, login failed") {
          localStorage.clear();

          showDialog("Error", <div>Failed to fetch user, please refresh</div>);
          setLoggedIn(false);
        }
      });
  };

  const getFileList = () => {
    Axios.get(`/api/user/files/`, axiosConfig).then((response: any) => {
      // console.log(response.data.files);
      localStorage.setItem("TYFILE_PREVIOUS_UPLOADS", JSON.stringify([...response.data.files]));
      setPreviousUploads(response.data.files);
    });
  };

  const showDialog = (title: string, content: any, buttons: any | null = null) => {
    setDialogTitle(title);
    setDialogMessage(content);
    setDialogButtons(buttons);
    setDialogOpen(true);
  };

  const uploadFile = (file: File) => {
    let fileSize = file.size / 1024 / 1024;

    // console.log("FILE SIZE:", fileSize);
    if (fileSize > 20) {
      showDialog(
        "Large file",
        <div>
          The file <b>{`"${file.name}"`}</b> ({fileSize.toFixed(2)}MB) is larger than 20MB, which will not be uploaded.
        </div>
      );
      return;
    }

    let localUploadID: number;

    setUploadingFiles((oldFilesInList) => {
      localUploadID = oldFilesInList.length === 0 ? 0 : oldFilesInList[oldFilesInList.length - 1].id + 1;

      return [
        ...oldFilesInList,
        {
          id: localUploadID,
          filename: file.name,
          estimated: null,
          progress: 0,
          errorMsg: null,
        },
      ];
    });

    var formData = new FormData();
    formData.append("fileContent", file);
    let uploadConfig = {
      headers: {
        authorization: localStorage.TYFILE_TOKEN ? `Bearer ${localStorage.TYFILE_TOKEN}` : "",
      },
      onUploadProgress: (progressEvent: any) => {
        // console.log("UPLOAD PROGRESS", localUploadID, progressEvent);

        if (progressEvent.progress === 1) {
          setUploadingFiles((uploadingList) => uploadingList.filter((fileInList) => localUploadID !== fileInList.id));
          // FINISH UPLOAD -> REFRESH FILE LIST
          getFileList();
        } else {
          // SET THE UPDATE STATUS TO UI
          setUploadingFiles((uploadingList) =>
            uploadingList.map((fileInList) =>
              fileInList.id === localUploadID
                ? {
                    ...fileInList,
                    progress: progressEvent.progress,
                    estimated: progressEvent.estimated !== undefined ? progressEvent.estimated : null,
                  }
                : {
                    ...fileInList,
                  }
            )
          );
        }
      },
    };

    // UPLOAD FILE TO SERVER
    Axios.post("/api/file/upload/", formData, uploadConfig)
      .then((response: any) => console.log(response.data))
      .catch((err: any) => {
        console.log("ERROR:", err.message);
        throw new Error("Cannot upload file");
      });
  };

  const handleFileDrop = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragState(null);

    let files = event.dataTransfer.files;

    if (files.length === 0) {
      console.log("NO FILES DRAGGED");
      return;
    }

    // console.log(files);
    [...files].forEach((file) => uploadFile(file));
  };

  const copyUrl = (url: string) => {
    let stringToCopy = `${FILE_STORE_URL}/${url}`;
    try {
      navigator.clipboard.writeText(stringToCopy);
      setSnackBarOpen(true);
    } catch (e) {
      // console.log(e);
      // Without HTTPS, cannot copy to clipboard
      alert(`Copy to clipboard is unsupported for http connections, please manually copy this link: ${stringToCopy}`);
    }
  };

  const handlePickFile = () => {
    if (inputFile.current) inputFile.current.click();
  };

  const deleteFile = (fileId: string) => {
    console.log("DELETING", fileId);

    Axios.delete(`/api/file/${fileId}`, axiosConfig)
      .then(() => getFileList())
      .catch((err: any) => console.log("ERROR:", err.response.data.message));
  };

  return (
    <>
      <ThemeProvider theme={darkTheme}>
        <div className="grid-holder">
          <div className="upload-btn-section">
            <h1>File Uploader</h1>
            <div className={dragState === null ? "upload-button" : dragState === 1 ? "upload-button--hint-land" : "upload-button--ready-release"} onDrop={handleFileDrop} onDragOver={(event) => event.preventDefault()} onClick={handlePickFile}>
              {dragState === null && <span className="btn-title">Drag a file here</span>}
              {dragState === 1 && <span className="btn-title--dragged">Drop file here</span>}
              {dragState === 2 && <span className="btn-title--dragged">Release to upload</span>}
              {dragState === null && (
                <>
                  <span>or </span>
                  <span className="btn-underline">select a file</span>
                  <span className="btn-mobile">Upload File</span>
                </>
              )}
            </div>
            <p>Maximum 20MB allowed</p>
            <div className="text-logo-section">
              by
              <img className="logo-text-svg" src="./images/tysnxu_text.svg" alt="" />
            </div>
          </div>
          {!(uploadingFiles.length === 0 && previousUploads.length === 0) && (
            <>
              <div className="uploads-table">
                {uploadingFiles.length !== 0 && (
                  <>
                    <h2>Uploading ({uploadingFiles.length})</h2>
                    {uploadingFiles.map((uploadingFile) => (
                      <div key={uploadingFile.id} className="uploading-file-section">
                        <p>{uploadingFile.filename}</p>
                        <div className="progress-bar-holder">
                          <div className="progress-bar">
                            <div className="progress-indicator" style={{ width: `${uploadingFile.progress * 100}%` }}></div>
                          </div>
                          {Math.floor(uploadingFile.progress * 100)}%
                        </div>
                        {uploadingFile.estimated &&
                          (uploadingFile.estimated < 60 ? (
                            <p className="estimated-time">Estimated: {Math.floor(uploadingFile.estimated)}s</p>
                          ) : (
                            <p className="estimated-time">
                              Estimated: {Math.floor(uploadingFile.estimated / 60)}m {Math.floor(uploadingFile.estimated % 60)}s
                            </p>
                          ))}
                      </div>
                    ))}
                  </>
                )}
                <h2>Past Uploads ({previousUploads.length})</h2>
                {previousUploads.map((file) => (
                  <Box key={file.url} className="file-list-item">
                    {/* <span>{file.fileName}</span> */}
                    <Link href={`${FILE_STORE_URL}//${file.url}`} target="_blank" color="inherit">
                      {file.fileName}
                    </Link>
                    <IconButton style={{ color: "white" }} onClick={() => copyUrl(file.url)}>
                      <ContentCopyIcon />
                    </IconButton>
                    <IconButton
                      style={{ color: "white" }}
                      onClick={() => {
                        dialogConfirmFn.current = () => {
                          deleteFile(file.id);
                          setDialogOpen(false);
                        };
                        showDialog(
                          "Confirm deletion",
                          <>Are you sure you want to delete the file?</>,
                          <>
                            <Button
                              onClick={() => {
                                setDialogOpen(false);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => {
                                if (dialogConfirmFn.current) dialogConfirmFn.current();
                              }}
                            >
                              Confirm
                            </Button>
                          </>
                        );
                      }}
                    >
                      <ClearIcon />
                    </IconButton>
                  </Box>
                ))}
              </div>
              <Box className="uploads-table--btn-mobile" onClick={() => setFileDrawerOpen(true)}>
                Past Uploads ({previousUploads.length})
              </Box>
            </>
          )}
        </div>
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle sx={{ fontWeight: 700 }}>{dialogTitle}</DialogTitle>
          <DialogContent sx={{ lineHeight: "2rem" }}>{dialogMessage}</DialogContent>
          <DialogActions>{dialogButtons === null ? <Button onClick={() => setDialogOpen(false)}>OK</Button> : dialogButtons}</DialogActions>
        </Dialog>
        <Snackbar open={snackBarOpen} autoHideDuration={2000} onClose={() => setSnackBarOpen(false)} message="Link copied to clipboard" />
        <input
          type="file"
          id="file"
          onChange={(event) => {
            console.log("UPLOAD FILE -> ", event.target.value);
            if (inputFile.current && inputFile.current.files !== null) {
              let file = inputFile.current.files[0];
              uploadFile(file);
            }
          }}
          ref={inputFile}
          style={{ display: "none" }}
        />
        <Dialog fullScreen open={fileDrawerOpen} onClose={() => setFileDrawerOpen(false)} TransitionComponent={Transition}>
          <AppBar sx={{ position: "relative" }}>
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={() => setFileDrawerOpen(false)} aria-label="close">
                <CloseIcon />
              </IconButton>
              <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                Previous Uploads
              </Typography>
            </Toolbar>
          </AppBar>
          <List>
            {previousUploads.map((previousFile) => (
              <>
                <ListItem
                  button
                  key={previousFile.url}
                  onClick={() => {
                    // copyUrl(previousFile.url);
                    window.open(`${FILE_STORE_URL}//${previousFile.url}`, "_blank");
                  }}
                >
                  <ListItemText primary={previousFile.fileName} secondary={previousFile.uploadedAt} />
                </ListItem>
                <Divider />
              </>
            ))}
          </List>
        </Dialog>
        <img className="logo-text-svg--mobile" src="./images/tysnxu_text.svg" alt="" />
        <img className="logo-svg" src="./images/tysnxu_logo.svg" alt="" />
        <div style={{ display: "none" }} id="area_for_append_copystuff"></div>
      </ThemeProvider>
    </>
  );
}

export default App;
