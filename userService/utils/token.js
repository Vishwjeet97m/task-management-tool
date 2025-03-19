import jwt from "jsonwebtoken";

export const generateTokens = (userId, role) => {
    const accessToken = jwt.sign(
        { id: userId, role },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY } // 1 hour
    );

    const refreshToken = jwt.sign(
        { id: userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY } // 7 days
    );

    return { accessToken, refreshToken };
};