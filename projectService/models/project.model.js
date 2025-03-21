import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: ["ACTIVE", "COMPLETED"], default: "ACTIVE" },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);

export default Project;

