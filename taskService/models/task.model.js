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
    isActive: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed',],
        default: 'pending'
    }
}, { timestamps: true });

export default mongoose.model('Task', TaskSchema);

