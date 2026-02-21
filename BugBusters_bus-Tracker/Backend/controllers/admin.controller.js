import jwt from "jsonwebtoken";

const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (
      username !== process.env.ADMIN_USERNAME ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        success: false,
        msg: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      { role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      token
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

export { loginAdmin };