import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "react-quill/dist/quill.snow.css";

createRoot(document.getElementById("root")!).render(<App />);
