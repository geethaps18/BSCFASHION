import { Request, Response, NextFunction } from "express";

// Named export so it can be imported as { isAdmin }
export const isAdmin = (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    // Check if user exists and has admin role
    if (req.user && req.user.role === "admin") {
      return next();
    }

    // If not admin, deny access
    return res.status(403).json({ message: "Access denied: Admins only" });
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(500).json({ message: "Server error in admin middleware" });
  }
};
