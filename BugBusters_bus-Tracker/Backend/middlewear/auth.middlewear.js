import jwt from "jsonwebtoken";

const verifyUser = (req, res, next) => {
  try {
    const authHeader = req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ msg: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; 
    next();

  } catch (err) {
    return res.status(401).json({ msg: "Invalid or expired token" });
  }
};


const verifyAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ msg: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({ msg: "Admin access required" });
    }

    req.user = decoded;
    next();

  } catch (err) {
    return res.status(401).json({ msg: "Invalid or expired token" });
  }
};

export { verifyUser, verifyAdmin };
