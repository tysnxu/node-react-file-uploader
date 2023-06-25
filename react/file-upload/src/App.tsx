import { useEffect, useRef, useState } from "react";
import "./App.css";
import { Box, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, useAutocomplete } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

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
  const dialogConfirmFn = useRef<Function>();

  const [snackBarOpen, setSnackBarOpen] = useState(false);
  const BACKEND_URL = "http://localhost:3000";

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
      .then((response: any) => {
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

  const handleFileDrop = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragState(null);

    let files = event.dataTransfer.files;

    if (files.length === 0) {
      console.log("NO FILES DRAGGED");
      return;
    }

    console.log(files);
    [...files].forEach((file) => {
      let fileSize = file.size / 1024 / 1024;

      // console.log("FILE SIZE:", fileSize);
      if (fileSize > 10.5) {
        showDialog(
          "Large file",
          <div>
            The file <b>{`"${file.name}"`}</b> ({fileSize.toFixed(2)}MB) is larger than 10MB, which will not be uploaded.
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
            setTimeout(() => {
              getFileList();
            }, 200);
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
        .then((response: any) => {
          console.log(response.data);
        })
        .catch((err: any) => {
          console.log("ERROR:", err.message);
          throw new Error("Cannot upload file");
        });
    });
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(`${BACKEND_URL}//${url}`);
    setSnackBarOpen(true);
  };

  const handlePickFile = () => {
    if (inputFile.current) inputFile.current.click();
  };

  const deleteFile = (fileId: string) => {
    console.log("DELETING", fileId);

    Axios.delete(`/api/file/${fileId}`, axiosConfig)
      .then((response: any) => {
        getFileList();
      })
      .catch((err: any) => {
        console.log("ERROR:", err.response.data.message);
      });
  };

  return (
    <>
      <div className="grid-holder">
        <div>
          <h1>File Uploader</h1>
          <div
            className={dragState === null ? "upload-button" : dragState === 1 ? "upload-button--hint-land" : "upload-button--ready-release"}
            onDrop={handleFileDrop}
            onDragOver={(event) => {
              event.preventDefault();
            }}
            onClick={handlePickFile}
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
        {!(uploadingFiles.length === 0 && previousUploads.length === 0) && (
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
                <span>{file.fileName}</span>
                <IconButton
                  style={{ color: "white" }}
                  onClick={() => {
                    copyUrl(file.url);
                  }}
                >
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
        )}
      </div>
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>{dialogTitle}</DialogTitle>
        <DialogContent sx={{ lineHeight: "2rem" }}>{dialogMessage}</DialogContent>
        <DialogActions>
          {dialogButtons === null ? (
            <Button
              onClick={() => {
                setDialogOpen(false);
              }}
            >
              OK
            </Button>
          ) : (
            dialogButtons
          )}
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackBarOpen}
        autoHideDuration={2000}
        onClose={() => {
          setSnackBarOpen(false);
        }}
        message="Link copied to clipboard"
      />
      <input
        type="file"
        id="file"
        onChange={(event) => {
          console.log("UPLOAD FILE -> ", event.target.value);
        }}
        ref={inputFile}
        style={{ display: "none" }}
      />
    </>
  );
}

export default App;
