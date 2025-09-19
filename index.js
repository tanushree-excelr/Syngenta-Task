import express from "express";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

mongoose
  .connect("mongodb://127.0.0.1:27017/node-project", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ DB Connected"))
  .catch((err) => console.error("❌ DB Error:", err));

const taskSchema = new mongoose.Schema({
  taskNumber: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
});
const Task = mongoose.model("Task", taskSchema);

app.get("/", (req, res) => res.redirect("/list"));

// List tasks
app.get("/list", async (req, res) => {
  const tasks = await Task.find().sort({ taskNumber: 1 });
  res.render("list", { tasks });
});

// Fetch all tasks (API)
app.get("/api/tasks", async (req, res) => {
  const tasks = await Task.find().sort({ taskNumber: 1 });
  res.json(tasks);
});

// Fetch single task by number
app.get("/api/tasks/number/:taskNumber", async (req, res) => {
  const task = await Task.findOne({ taskNumber: req.params.taskNumber });
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
});

// Add task page
app.get("/add", async(req, res) => {
  try{
    const tasks = await Task.find()
    return res.status(200).json(tasks);
  } catch(err){
    return res.status(500).send("Server Error");
  }
});

// Add task handler
app.post("/add", async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) return res.redirect("/add");

  // Generate next task number
  const lastTask = await Task.findOne().sort({ taskNumber: -1 });
  const taskNumber = lastTask ? lastTask.taskNumber + 1 : 1;

  await Task.create({ taskNumber, title, description });
  res.redirect("/list");
});

// Update task page
app.get("/update/:id", async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.redirect("/list");
  res.render("update", { task });
});

// Update task handler
app.post("/update/:id", async (req, res) => {
  const { title, description } = req.body;
  await Task.findByIdAndUpdate(req.params.id, { title, description });
  res.redirect("/list");
});

// Delete task
app.get("/delete/:id", async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.redirect("/list");
});

const PORT = 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
