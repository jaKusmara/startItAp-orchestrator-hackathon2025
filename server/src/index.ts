import express, { Express, Request, Response } from "express";

import openaiRoutes from "./routes/openai";
import projectRoutes from "./routes/project";
import taskRoutes from "./routes/tasks";

const cors = require("cors");
const app: Express = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());



app.use("/openai", openaiRoutes);
app.use("/projects", projectRoutes);
app.use("/tasks", taskRoutes);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
