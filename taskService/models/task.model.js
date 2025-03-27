import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
    task_name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    assignee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  
        required: true
    },
    assigner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  
        required: true
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',  
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    attachments: [
        {
            fileName: { type: String, required: true }, // Original file name
            fileUrl: { type: String, required: true }   // S3 File Path
        }
    ],
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed',],
        default: 'pending'
    }
}, { timestamps: true });


TaskSchema.pre(/^find/, function (next) {
    this.where({ isActive: true });
    next();
  });
  

export default mongoose.model('Task', TaskSchema);

