import jwt from "jsonwebtoken";
import prisma from '../prismaClient.js';
const { verify } = jwt;

// Middleware to check if the user is authenticated
const authenticateUser = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization;
  if (!token) return res.status(401).json({ message: 'Access Denied' });

  try {
    const decoded = verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    
    req.user = await prisma.user.findUnique({ 
      where: { id: decoded.id }, 
      include: { addresses: true } 
    });
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid Token' });
  }
};

// Middleware to allow only admins
const authorizeAdmin = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization;
  if (!token) return res.status(401).json({ message: 'Access Denied' });

  try {
    const decoded = verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    
    req.user = await prisma.user.findUnique({ 
      where: { id: decoded.id }, 
      include: { addresses: true } 
    });
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid Token' });
  }
};

export { authenticateUser, authorizeAdmin };
