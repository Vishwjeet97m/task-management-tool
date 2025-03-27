import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: ["ACTIVE", "COMPLETED"], default: "ACTIVE" },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    attachments: [  // New field for project files
      {
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true } // Stores S3 path
      }
    ]
  },
  { timestamps: true }
);


projectSchema.pre(/^find/, function (next) {
  this.where({ isActive: true });
  next();
});


const Project = mongoose.model("Project", projectSchema);

export default Project;

