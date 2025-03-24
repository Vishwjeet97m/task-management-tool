import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: function () {
        return !this.project;
      },
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: function () {
        return !this.task;
      },
    },
    isActive:{
      type: Boolean,
      required: true,
      default: true
    }
  },
  { timestamps: true }
);

const Comment =  mongoose.model("Comment", commentSchema);

export default Comment;
