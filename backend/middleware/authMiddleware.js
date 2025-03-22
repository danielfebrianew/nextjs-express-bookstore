import jwt from "jsonwebtoken";
import prisma from '../prismaClient.js';
const { verify } = jwt;

// Middleware to check if the user is authenticated
const authenticateUser = async (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'Access Denied' });

  try {
    const decoded = verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    // console.log("Decoded JWT:", decoded);
    req.user = await prisma.user.findUnique({ 
      where: { id: decoded.id }, 
      include: { addresses: true } 
    });
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    // console.log("User from middleware:", req.user);
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid Token' });
  }
};

// Middleware to allow only admins
const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admins only' });
  }
  next();
};

export { authenticateUser, authorizeAdmin };
