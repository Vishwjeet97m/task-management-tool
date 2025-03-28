import mongoose from "mongoose";
import bcrypt from "bcrypt";


const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isActive:{type:Boolean, required: true, default:true}
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

UserSchema.pre(/^find/, function (next) {
    this.where({ isActive: true });
    next();
  });

const User = mongoose.model('User', UserSchema);
export default User;