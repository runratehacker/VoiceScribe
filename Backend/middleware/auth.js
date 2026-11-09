import jwt from 'jsonwebtoken'

const authenticate = async (req, res, next) => {

    try {

        let token = req.headers.token || req.headers.authorization;

        if (!token) {
            return res.status(401).json({ message: "No token passed through headers" })
        }

        if (token && token.startsWith('Bearer ')) {
            token = token.slice(7).trim(); // strips "Bearer "
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;
        // { id: , username: , role: }

        next();


    } catch (error) {

        return res.status(401).json({ message: "Invalid token" });
    }


}

export { authenticate };