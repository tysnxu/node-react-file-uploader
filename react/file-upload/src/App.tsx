import { useState } from "react";
import "./App.css";
import { IconButton } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

function App() {
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
